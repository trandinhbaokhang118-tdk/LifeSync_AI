import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { QueryTaskDto } from './dto/query-task.dto';

@Injectable()
export class TasksService {
    constructor(private prisma: PrismaService) { }

    async create(userId: string, createTaskDto: CreateTaskDto) {
        const { tagIds, startAt, dueAt, reminderMinutes, ...taskData } = createTaskDto;

        // Validate that dueAt is after startAt
        const startDate = new Date(startAt);
        const dueDate = new Date(dueAt);

        if (dueDate <= startDate) {
            throw new BadRequestException({
                code: 'INVALID_TIME_RANGE',
                message: 'Due time must be after start time',
            });
        }

        const task = await this.prisma.task.create({
            data: {
                ...taskData,
                userId,
                startAt: startDate,
                dueAt: dueDate,
                reminderMinutes: reminderMinutes || 15,
                tags: tagIds?.length
                    ? {
                        create: tagIds.map((tagId) => ({ tagId })),
                    }
                    : undefined,
            },
            include: {
                tags: {
                    include: { tag: true },
                },
            },
        });

        // Auto-create reminder
        const reminderTime = new Date(startDate.getTime() - (reminderMinutes || 15) * 60000);

        // Only create reminder if it's in the future
        if (reminderTime > new Date()) {
            await this.prisma.reminder.create({
                data: {
                    userId,
                    message: `Sắp đến giờ: ${task.title}`,
                    triggerAt: reminderTime,
                },
            });
        }

        return this.formatTask(task);
    }

    async findAll(userId: string, query: QueryTaskDto) {
        const { page = 1, limit = 10, status, priority, search, startDate, endDate, sortBy = 'createdAt', sortOrder = 'desc' } = query;

        const where: Prisma.TaskWhereInput = {
            userId,
            ...(status && { status }),
            ...(priority && { priority }),
            ...(search && {
                OR: [
                    { title: { contains: search } },
                    { description: { contains: search } },
                ],
            }),
            ...(startDate || endDate
                ? {
                    dueAt: {
                        ...(startDate && { gte: new Date(startDate) }),
                        ...(endDate && { lte: new Date(endDate) }),
                    },
                }
                : {}),
        };

        const [tasks, total] = await Promise.all([
            this.prisma.task.findMany({
                where,
                include: {
                    tags: {
                        include: { tag: true },
                    },
                },
                orderBy: { [sortBy]: sortOrder },
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.task.count({ where }),
        ]);

        return {
            data: tasks.map(this.formatTask),
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async findOne(id: string, userId: string) {
        const task = await this.prisma.task.findUnique({
            where: { id },
            include: {
                tags: {
                    include: { tag: true },
                },
            },
        });

        if (!task) {
            throw new NotFoundException({
                code: 'RESOURCE_NOT_FOUND',
                message: 'Task not found',
            });
        }

        if (task.userId !== userId) {
            throw new ForbiddenException({
                code: 'AUTH_FORBIDDEN',
                message: 'Access denied',
            });
        }

        return this.formatTask(task);
    }

    async update(id: string, userId: string, updateTaskDto: UpdateTaskDto) {
        await this.findOne(id, userId); // Validates ownership

        const { tagIds, ...taskData } = updateTaskDto;

        // If tagIds provided, update tags
        if (tagIds !== undefined) {
            await this.prisma.taskTag.deleteMany({ where: { taskId: id } });
            if (tagIds.length > 0) {
                await this.prisma.taskTag.createMany({
                    data: tagIds.map((tagId) => ({ taskId: id, tagId })),
                });
            }
        }

        const task = await this.prisma.task.update({
            where: { id },
            data: {
                ...taskData,
                dueAt: taskData.dueAt ? new Date(taskData.dueAt) : undefined,
            },
            include: {
                tags: {
                    include: { tag: true },
                },
            },
        });

        return this.formatTask(task);
    }

    async remove(id: string, userId: string) {
        await this.findOne(id, userId); // Validates ownership

        await this.prisma.task.delete({ where: { id } });

        return { message: 'Task deleted successfully' };
    }

    async addTags(taskId: string, userId: string, tagIds: string[]) {
        await this.findOne(taskId, userId);

        await this.prisma.taskTag.createMany({
            data: tagIds.map((tagId) => ({ taskId, tagId })),
            skipDuplicates: true,
        });

        return this.findOne(taskId, userId);
    }

    async removeTag(taskId: string, tagId: string, userId: string) {
        await this.findOne(taskId, userId);

        await this.prisma.taskTag.delete({
            where: { taskId_tagId: { taskId, tagId } },
        });

        return this.findOne(taskId, userId);
    }

    private formatTask(task: Prisma.TaskGetPayload<{
        include: {
            tags: {
                include: {
                    tag: true;
                };
            };
        };
    }>) {
        return {
            ...task,
            tags: task.tags?.map(({ tag }) => tag) || [],
        };
    }
}
