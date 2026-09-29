import { ConflictException } from '@nestjs/common';
import { parseAssistantReply, TaskAssistantService } from './task-assistant.service';
import { TasksService } from '../tasks/tasks.service';

const taskId = 'c633a0b0-abaa-4d68-902e-aab725d5fe11';
const projectId = 'b633a0b0-abaa-4d68-902e-aab725d5fe11';
const data = { title: 'Báo cáo dự án', startAt: '2026-10-01T09:00:00+07:00', dueAt: '2026-10-01T10:00:00+07:00', projectId };
const task = { ...data, id: taskId, status: 'TODO' };
function setup() {
    const db = {
        task: { findMany: jest.fn().mockResolvedValue([task]), count: jest.fn().mockResolvedValue(132), groupBy: jest.fn().mockResolvedValue([]) },
        planningProject: { findMany: jest.fn().mockResolvedValue([{ id: projectId, title: 'Website', input: {}, status: 'DRAFT' }]), count: jest.fn().mockResolvedValue(1), findFirst: jest.fn() },
        timeBlock: { findMany: jest.fn().mockResolvedValue([]) },
    };
    const tasks = { create: jest.fn().mockResolvedValue(task), update: jest.fn().mockResolvedValue(task) };
    return { db, tasks, service: new TaskAssistantService(db as never, tasks as never) };
}
describe('task assistant', () => {
    it('parses nested updates and braces in titles', () => {
        const reply = { message: '', actions: [{ type: 'update_task', data: { taskId, updates: { title: 'Report {Q4}', status: 'DONE' } } }] };
        expect(parseAssistantReply('```json\n' + JSON.stringify(reply) + '\n```')).toEqual(reply);
    });
    it.each(['[ACTION:CREATE_TASK] {"title":"x"}', '{"message":"Đã tạo", "actions":[', '{"message":"Đã tạo", "actions":[{"type":"delete_task","data":{}}]}'])('fails closed: %s', raw => {
        expect(parseAssistantReply(raw).actions).toEqual([]);
        expect(parseAssistantReply(raw).message).toContain('chưa thay đổi');
    });
    it('loads owner scoped context and timezone', async () => {
        const { db, service } = setup();
        const context = await service.context('owner', 'Asia/Ho_Chi_Minh');
        expect(context.timeZone).toBe('Asia/Ho_Chi_Minh');
        expect(context.recentTasks[0]).toEqual(task);
        expect(db.task.groupBy).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: 'owner' } }));
        expect(db.planningProject.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: 'owner' } }));
    });
    it('finds older tasks by project, keyword, status and local day with accurate totals', async () => {
        const { db, service } = setup();
        const result = await service.lookup('owner', { type: 'find_tasks', data: { projectId, search: 'báo cáo', status: 'TODO', from: '2026-10-01T00:00:00+07:00', to: '2026-10-02T00:00:00+07:00', offset: 100 } });
        expect(result.total).toBe(132);
        expect(result.truncated).toBe(true);
        expect(db.task.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ userId: 'owner', projectId, status: 'TODO', dueAt: { gt: new Date('2026-10-01T00:00:00+07:00') } }), skip: 100 }));
        expect(db.task.count).toHaveBeenCalledWith({ where: db.task.findMany.mock.calls[0][0].where });
    });
    it('computes project progress from persisted owned tasks', async () => {
        const { db, service } = setup();
        const result = await service.lookup('owner', { type: 'find_projects', data: { search: 'Website' } });
        expect(result.items[0]).toHaveProperty('input');
        expect(db.task.groupBy).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: 'owner', projectId: { in: [projectId] } } }));
    });
    it('uses existing task creation and reminder rules', async () => {
        const { tasks, service } = setup();
        const result = await service.execute('owner', { type: 'create_task', data });
        expect(tasks.create).toHaveBeenCalledWith('owner', expect.objectContaining(data));
        expect(result.action).toMatchObject({ type: 'create_task', status: 'completed', data: { taskId } });
    });
    it.each([{ title: 'Thiếu giờ' }, { ...data, title: '  ' }, { ...data, startAt: '2026-10-01T09:00:00' }, { ...data, userId: 'foreign-user' }, { ...data, tagIds: [projectId] }])('rejects invalid/untrusted payload without writing', async payload => {
        const { tasks, service } = setup();
        const result = await service.execute('owner', { type: 'create_task', data: payload });
        expect(tasks.create).not.toHaveBeenCalled();
        expect(result.action).toBeUndefined();
    });
    it('updates with ownership scope and rejects bypass flags', async () => {
        const { tasks, service } = setup();
        await service.execute('owner', { type: 'update_task', data: { taskId, updates: { status: 'DONE' } } });
        expect(tasks.update).toHaveBeenCalledWith(taskId, 'owner', expect.objectContaining({ status: 'DONE' }));
        tasks.update.mockClear();
        await service.execute('owner', { type: 'update_task', data: { taskId, updates: { allowTaskOverlap: true } } });
        expect(tasks.update).not.toHaveBeenCalled();
    });
    it('reports calendar rejection instead of optimistic success', async () => {
        const { tasks, service } = setup();
        tasks.update.mockRejectedValue(new ConflictException({ message: 'Trùng lịch họp' }));
        const result = await service.execute('owner', { type: 'update_task', data: { taskId, updates: { startAt: data.startAt } } });
        expect(result.action).toBeUndefined();
        expect(result.message).toContain('Trùng lịch họp');
    });
    it('rejects another users project before any task is created', async () => {
        const { db } = setup();
        db.planningProject.findFirst.mockResolvedValue(null);
        const tasks = new TasksService(db as never, {} as never);
        await expect(tasks.create('owner', data)).rejects.toThrow('Không tìm thấy dự án');
        expect(db.planningProject.findFirst).toHaveBeenCalledWith({ where: { id: projectId, userId: 'owner' }, select: { id: true } });
    });
});
