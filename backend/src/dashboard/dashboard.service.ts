import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TaskStatus } from '@prisma/client';

@Injectable()
export class DashboardService {
    constructor(private prisma: PrismaService) { }

    /**
     * Returns midnight of the most recent Monday relative to `from`.
     * getDay() is 0 on Sunday, so we shift back 6 days in that case
     * instead of jumping forward to the upcoming Monday.
     */
    private getWeekStart(from: Date): Date {
        const weekStart = new Date(from.getFullYear(), from.getMonth(), from.getDate());
        const day = weekStart.getDay();
        const diff = day === 0 ? -6 : 1 - day;
        weekStart.setDate(weekStart.getDate() + diff);
        return weekStart;
    }

    async getStats(userId: string) {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

        // Start of week (Monday)
        const weekStart = this.getWeekStart(now);

        const [tasksDueToday, tasksOverdue, tasksCompletedThisWeek] = await Promise.all([
            // Tasks due today
            this.prisma.task.count({
                where: {
                    userId,
                    dueAt: { gte: todayStart, lt: todayEnd },
                    status: { not: TaskStatus.DONE },
                },
            }),
            // Overdue tasks
            this.prisma.task.count({
                where: {
                    userId,
                    dueAt: { lt: todayStart },
                    status: { not: TaskStatus.DONE },
                },
            }),
            // Tasks completed this week
            this.prisma.task.count({
                where: {
                    userId,
                    status: TaskStatus.DONE,
                    updatedAt: { gte: weekStart },
                },
            }),
        ]);

        return {
            tasksDueToday,
            tasksOverdue,
            tasksCompletedThisWeek,
        };
    }

    async getFocusTime(userId: string) {
        const now = new Date();

        // Start of week (Monday)
        const weekStart = this.getWeekStart(now);

        const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);

        const timeBlocks = await this.prisma.timeBlock.findMany({
            where: {
                userId,
                startAt: { gte: weekStart },
                endAt: { lte: weekEnd },
            },
        });

        const totalMinutes = timeBlocks.reduce((sum, block) => {
            const duration = (block.endAt.getTime() - block.startAt.getTime()) / (1000 * 60);
            return sum + duration;
        }, 0);

        return {
            totalMinutes: Math.round(totalMinutes),
            totalHours: Math.round(totalMinutes / 60 * 10) / 10,
        };
    }
}
