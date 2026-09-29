import { Injectable, NotFoundException, ForbiddenException, BadRequestException, ConflictException } from '@nestjs/common';
import { hasProAccess } from '../common/subscription-access';
import { Prisma, SubscriptionTier } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTimeBlockDto } from './dto/create-time-block.dto';
import { UpdateTimeBlockDto } from './dto/update-time-block.dto';
import { QueryTimeBlockDto } from './dto/query-time-block.dto';
import { GoogleCalendarService } from '../calendar-integrations/google-calendar.service';

@Injectable()
export class TimeBlocksService {
    constructor(private prisma: PrismaService, private google: GoogleCalendarService) { }

    async create(userId: string, createDto: CreateTimeBlockDto) {
        const startAt = new Date(createDto.startAt);
        const endAt = new Date(createDto.endAt);

        // Validate startAt < endAt
        if (startAt >= endAt) {
            throw new BadRequestException({
                code: 'TIME_BLOCK_INVALID_RANGE',
                message: 'Start time must be before end time',
            });
        }

        // Check for overlap
        await this.checkOverlap(userId, startAt, endAt);

        return this.prisma.$transaction(async (db) => {
            await this.assertDailyAllowance(db, userId, startAt);
            return db.timeBlock.create({
                data: {
                    userId,
                    title: createDto.title,
                    description: createDto.description,
                    startAt,
                    endAt,
                },
            });
        });
    }

    async findAll(userId: string, query: QueryTimeBlockDto) {
        const startDate = new Date(query.startDate);
        const endDate = new Date(query.endDate);

        return this.prisma.timeBlock.findMany({
            where: {
                userId,
                OR: [
                    { startAt: { gte: startDate, lte: endDate } },
                    { endAt: { gte: startDate, lte: endDate } },
                    { AND: [{ startAt: { lte: startDate } }, { endAt: { gte: endDate } }] },
                ],
            },
            orderBy: { startAt: 'asc' },
        });
    }

    async findOne(id: string, userId: string) {
        const block = await this.prisma.timeBlock.findUnique({
            where: { id },
        });

        if (!block) {
            throw new NotFoundException({
                code: 'RESOURCE_NOT_FOUND',
                message: 'Time block not found',
            });
        }

        if (block.userId !== userId) {
            throw new ForbiddenException({
                code: 'AUTH_FORBIDDEN',
                message: 'Access denied',
            });
        }

        return block;
    }

    async update(id: string, userId: string, updateDto: UpdateTimeBlockDto) {
        const existing = await this.findOne(id, userId);

        const startAt = updateDto.startAt ? new Date(updateDto.startAt) : existing.startAt;
        const endAt = updateDto.endAt ? new Date(updateDto.endAt) : existing.endAt;

        // Validate startAt < endAt
        if (startAt >= endAt) {
            throw new BadRequestException({
                code: 'TIME_BLOCK_INVALID_RANGE',
                message: 'Start time must be before end time',
            });
        }

        // Check for overlap (excluding current block)
        await this.checkOverlap(userId, startAt, endAt, id);

        return this.prisma.$transaction(async (db) => {
            if (this.dayKey(startAt) !== this.dayKey(existing.startAt)) {
                await this.assertDailyAllowance(db, userId, startAt, id);
            }
            return db.timeBlock.update({
                where: { id },
                data: {
                    title: updateDto.title,
                    description: updateDto.description,
                    startAt,
                    endAt,
                },
            });
        });
    }

    async remove(id: string, userId: string) {
        await this.findOne(id, userId);

        await this.prisma.timeBlock.delete({ where: { id } });

        return { message: 'Time block deleted successfully' };
    }

    // Quota days follow the application's Vietnam timezone (UTC+7).
    private dayKey(date: Date) {
        return new Date(date.getTime() + 7 * 3600000).toISOString().slice(0, 10);
    }

    private async assertDailyAllowance(db: Prisma.TransactionClient, userId: string, startAt: Date, excludeId?: string) {
        await db.$queryRaw`SELECT id FROM users WHERE id = ${userId} FOR UPDATE`;
        const subscription = await db.subscription.findUnique({ where: { userId } });
        if (hasProAccess(subscription)) return;
        const start = new Date(this.dayKey(startAt) + 'T00:00:00+07:00');
        const count = await db.timeBlock.count({ where: {
            userId, id: excludeId ? { not: excludeId } : undefined,
            startAt: { gte: start, lt: new Date(start.getTime() + 86400000) },
        } });
        if (count >= 5) throw new ForbiddenException({
            code: 'TIME_BLOCK_FREE_LIMIT',
            message: 'Gói Free có tối đa 5 khối giờ mỗi ngày. Nâng cấp Pro để dùng không giới hạn.',
            requiredTier: SubscriptionTier.PRO,
        });
    }

    private async checkOverlap(userId: string, startAt: Date, endAt: Date, excludeId?: string) {
        await this.google.assertAvailable(userId, startAt, endAt);
        // Overlap condition: startA < endB AND startB < endA
        const overlapping = await this.prisma.timeBlock.findFirst({
            where: {
                userId,
                id: excludeId ? { not: excludeId } : undefined,
                AND: [
                    { startAt: { lt: endAt } },
                    { endAt: { gt: startAt } },
                ],
            },
        });

        if (overlapping) {
            throw new ConflictException({
                code: 'TIME_BLOCK_OVERLAP',
                message: 'Time block overlaps with an existing block',
                details: {
                    conflictingBlock: {
                        id: overlapping.id,
                        title: overlapping.title,
                        startAt: overlapping.startAt,
                        endAt: overlapping.endAt,
                    },
                },
            });
        }

        const task = await this.prisma.task.findFirst({
            where: { userId, status: { not: 'DONE' }, startAt: { lt: endAt }, dueAt: { gt: startAt } },
            select: { id: true, title: true, startAt: true, dueAt: true },
        });
        if (task) {
            throw new ConflictException({
                code: 'TIME_BLOCK_TASK_CONFLICT',
                message: `Khối giờ trùng công việc đã lên lịch: ${task.title}. Hãy đổi giờ công việc hoặc khối giờ.`,
                details: { conflictingTask: task },
            });
        }
    }
}
