import { ConflictException } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TimeBlocksService } from '../time-blocks/time-blocks.service';

describe('Fixed calendar and task scheduling', () => {
    const startAt = new Date('2027-01-04T02:00:00Z');
    const endAt = new Date('2027-01-04T03:00:00Z');
    const block = { id: 'b1', title: 'Lớp cố định', startAt, endAt };
    function setup() {
        const existing = { id: 't1', userId: 'u1', title: 'Task', status: 'TODO', startAt, dueAt: endAt, reminderMinutes: 15, tags: [] };
        const db = {
            task: { findUnique: jest.fn().mockResolvedValue(existing), findFirst: jest.fn().mockResolvedValue(null), update: jest.fn().mockResolvedValue(existing), create: jest.fn().mockResolvedValue(existing) },
            timeBlock: { findMany: jest.fn().mockResolvedValue([block]), findFirst: jest.fn().mockResolvedValue(null), create: jest.fn() },
            taskTag: { deleteMany: jest.fn(), createMany: jest.fn() },
            reminder: { create: jest.fn(), deleteMany: jest.fn(), upsert: jest.fn() },
        };
        const google = { assertAvailable: jest.fn().mockResolvedValue(undefined) };
        return { db, google, tasks: new TasksService(db as never, google as never), blocks: new TimeBlocksService(db as never, google as never) };
    }
    it('rejects a dragged task before changing its time or tags, with useful conflict details', async () => {
        const { db, tasks } = setup();
        await expect(tasks.update('t1', 'u1', { startAt: startAt.toISOString(), tagIds: [] })).rejects.toMatchObject({
            response: { code: 'TASK_FIXED_CALENDAR_CONFLICT', details: { conflictingBlocks: [block] } },
        });
        expect(db.task.update).not.toHaveBeenCalled();
        expect(db.taskTag.deleteMany).not.toHaveBeenCalled();
        expect(db.timeBlock.findMany).toHaveBeenCalledWith(expect.objectContaining({
            where: { userId: 'u1', startAt: { lt: endAt }, endAt: { gt: startAt } },
        }));
    });
    it('checks creation too, and accepts adjacent intervals using strict overlap bounds', async () => {
        const { db, tasks } = setup();
        const dto = { title: 'New task', startAt: startAt.toISOString(), dueAt: endAt.toISOString() };
        await expect(tasks.create('u1', dto)).rejects.toBeInstanceOf(ConflictException);
        expect(db.task.create).not.toHaveBeenCalled();
        db.timeBlock.findMany.mockResolvedValue([]);
        await tasks.create('u1', { ...dto, startAt: endAt.toISOString(), dueAt: new Date(+endAt + 3600000).toISOString() });
        expect(db.task.create).toHaveBeenCalled();
    });
    it('allows title/status-only edits without moving a task and validates partial time updates', async () => {
        const { db, tasks } = setup();
        await tasks.update('t1', 'u1', { title: 'Renamed' });
        expect(db.timeBlock.findMany).not.toHaveBeenCalled();
        await expect(tasks.update('t1', 'u1', { dueAt: new Date(+startAt - 1).toISOString() })).rejects.toThrow('Giờ kết thúc');
        expect(db.task.update).toHaveBeenCalledTimes(1);
    });
    it('prevents adding a fixed block over an already scheduled task', async () => {
        const { db, blocks } = setup();
        db.task.findFirst.mockResolvedValue({ id: 't1', title: 'Project task', startAt, dueAt: endAt });
        await expect(blocks.create('u1', { title: 'New fixed block', startAt: startAt.toISOString(), endAt: endAt.toISOString() })).rejects.toMatchObject({
            response: { code: 'TIME_BLOCK_TASK_CONFLICT' },
        });
        expect(db.timeBlock.create).not.toHaveBeenCalled();
    });
    it('rejects another active task and excludes the task being moved', async () => {
        const { db, tasks } = setup();
        db.timeBlock.findMany.mockResolvedValue([]);
        db.task.findFirst.mockResolvedValue({ id: 'other', title: 'Meeting', startAt, dueAt: endAt });
        await expect(tasks.update('t1', 'u1', { startAt: startAt.toISOString() })).rejects.toMatchObject({ response: { code: 'TASK_CALENDAR_CONFLICT' } });
        expect(db.task.update).not.toHaveBeenCalled();
        expect(db.task.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: {
            userId: 'u1', id: { not: 't1' }, status: { not: 'DONE' }, startAt: { lt: endAt }, dueAt: { gt: startAt },
        } }));
        db.task.findFirst.mockResolvedValue(null);
        await tasks.update('t1', 'u1', { startAt: startAt.toISOString() });
        expect(db.task.update).toHaveBeenCalledTimes(1);
    });
    it('fails closed on Google conflicts and outages before writing schedules', async () => {
        const { db, google, tasks, blocks } = setup();
        google.assertAvailable.mockRejectedValue(new ConflictException('Google busy'));
        await expect(tasks.update('t1', 'u1', { startAt: startAt.toISOString() })).rejects.toThrow('Google busy');
        await expect(blocks.create('u1', { title: 'Block', startAt: startAt.toISOString(), endAt: endAt.toISOString() })).rejects.toThrow('Google busy');
        expect(db.task.update).not.toHaveBeenCalled();
        expect(db.timeBlock.create).not.toHaveBeenCalled();
    });
    it('reschedules reminders and clears them when a task is completed', async () => {
        const { db, tasks } = setup();
        db.timeBlock.findMany.mockResolvedValue([]);
        await tasks.update('t1', 'u1', { startAt: startAt.toISOString() });
        expect(db.reminder.upsert).toHaveBeenCalledWith(expect.objectContaining({ where: { taskId: 't1' }, update: expect.objectContaining({ triggerAt: new Date(+startAt - 15 * 60000), triggered: false }) }));
        db.task.update.mockResolvedValue({ ...(await db.task.findUnique()), status: 'DONE' });
        await tasks.update('t1', 'u1', { status: 'DONE' });
        expect(db.reminder.deleteMany).toHaveBeenCalledWith({ where: { userId: 'u1', taskId: 't1' } });
    });    it('requires explicit confirmation for overlapping tasks and never stores the request flag', async () => {
        const { db, tasks } = setup();
        db.timeBlock.findMany.mockResolvedValue([]);
        db.task.findFirst.mockResolvedValue({ id: 'other', title: 'Other task', startAt, dueAt: endAt });
        await expect(tasks.update('t1', 'u1', { startAt: startAt.toISOString(), allowTaskOverlap: false })).rejects.toMatchObject({ response: { code: 'TASK_CALENDAR_CONFLICT' } });
        await tasks.update('t1', 'u1', { startAt: startAt.toISOString(), allowTaskOverlap: true });
        expect(db.task.update).toHaveBeenCalledTimes(1);
        expect(db.task.update.mock.calls[0][0].data).not.toHaveProperty('allowTaskOverlap');
    });
    it('still rejects fixed blocks even with simultaneous-work confirmation', async () => {
        const { db, tasks } = setup();
        await expect(tasks.update('t1', 'u1', { startAt: startAt.toISOString(), allowTaskOverlap: true })).rejects.toMatchObject({ response: { code: 'TASK_FIXED_CALENDAR_CONFLICT' } });
        expect(db.task.update).not.toHaveBeenCalled();
    });

});
