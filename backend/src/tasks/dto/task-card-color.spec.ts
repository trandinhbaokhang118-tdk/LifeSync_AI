import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateTaskDto } from './create-task.dto';
import { UpdateTaskDto } from './update-task.dto';

describe('Task card palette validation', () => {
    const task = { title: 'A task', startAt: '2026-10-01T08:00:00Z', dueAt: '2026-10-01T09:00:00Z' };
    it.each(['AUTO', 'CYAN', 'VIOLET', 'AMBER', 'ROSE', 'GREEN'])(
        'accepts %s on create and update', async (cardColor) => {
            expect(await validate(plainToInstance(CreateTaskDto, { ...task, cardColor }))).toHaveLength(0);
            expect(await validate(plainToInstance(UpdateTaskDto, { cardColor }))).toHaveLength(0);
        },
    );
    it('keeps older clients compatible when color is omitted', async () => {
        expect(await validate(plainToInstance(CreateTaskDto, task))).toHaveLength(0);
    });
    it.each([null, '#ffffff', 'url(https://example.com)', 12, 'UNKNOWN'])(
        'rejects non-palette values: %s', async (cardColor) => {
            expect(await validate(plainToInstance(UpdateTaskDto, { cardColor }))).not.toHaveLength(0);
        },
    );
});
