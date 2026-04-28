import { BadRequestException, Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
    constructor(private prisma: PrismaService) { }

    async getSystemStats() {
        const [totalUsers, totalTasks, completedTasks] = await Promise.all([
            this.prisma.user.count(),
            this.prisma.task.count(),
            this.prisma.task.count({ where: { status: 'DONE' } }),
        ]);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const newUsersToday = await this.prisma.user.count({
            where: {
                createdAt: { gte: today },
            },
        });

        const activeUsers = await this.prisma.user.count({
            where: {
                updatedAt: {
                    gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                },
            },
        });

        const avgTasksPerUser = totalUsers > 0 ? totalTasks / totalUsers : 0;

        return {
            totalUsers,
            activeUsers,
            totalTasks,
            completedTasks,
            avgTasksPerUser,
            newUsersToday,
        };
    }

    async getAllUsers() {
        return this.prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                phone: true,
                role: true,
                createdAt: true,
                updatedAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async updateUserRole(userId: string, role: string) {
        if (role !== Role.USER && role !== Role.ADMIN) {
            throw new BadRequestException('Invalid role');
        }

        return this.prisma.user.update({
            where: { id: userId },
            data: { role },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
            },
        });
    }

    async deleteUser(userId: string) {
        await this.prisma.user.delete({
            where: { id: userId },
        });

        return { message: 'User deleted successfully' };
    }

    async getActivityLogs() {
        const [recentUsers, recentTasks] = await Promise.all([
            this.prisma.user.findMany({
                take: 25,
                orderBy: { updatedAt: 'desc' },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    createdAt: true,
                    updatedAt: true,
                },
            }),
            this.prisma.task.findMany({
                take: 25,
                orderBy: { updatedAt: 'desc' },
                select: {
                    id: true,
                    title: true,
                    createdAt: true,
                    updatedAt: true,
                    user: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
            }),
        ]);

        const userLogs = recentUsers.flatMap((user) => {
            const logs = [
                {
                    id: `register-${user.id}`,
                    userId: user.id,
                    userName: user.name,
                    action: 'REGISTER',
                    details: `Tạo tài khoản ${user.email}`,
                    timestamp: user.createdAt,
                    ipAddress: 'N/A',
                },
            ];

            if (Math.abs(user.updatedAt.getTime() - user.createdAt.getTime()) > 1000) {
                logs.push({
                    id: `profile-${user.id}`,
                    userId: user.id,
                    userName: user.name,
                    action: 'UPDATE_PROFILE',
                    details: 'Cập nhật hồ sơ người dùng',
                    timestamp: user.updatedAt,
                    ipAddress: 'N/A',
                });
            }

            return logs;
        });

        const taskLogs = recentTasks.flatMap((task) => {
            const logs = [
                {
                    id: `task-create-${task.id}`,
                    userId: task.user.id,
                    userName: task.user.name,
                    action: 'CREATE_TASK',
                    details: `Tạo công việc "${task.title}"`,
                    timestamp: task.createdAt,
                    ipAddress: 'N/A',
                },
            ];

            if (Math.abs(task.updatedAt.getTime() - task.createdAt.getTime()) > 1000) {
                logs.push({
                    id: `task-update-${task.id}`,
                    userId: task.user.id,
                    userName: task.user.name,
                    action: 'UPDATE_TASK',
                    details: `Cập nhật công việc "${task.title}"`,
                    timestamp: task.updatedAt,
                    ipAddress: 'N/A',
                });
            }

            return logs;
        });

        return [...userLogs, ...taskLogs]
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .slice(0, 50);
    }

    async createBackup() {
        return {
            status: 'manual_required',
            message: 'Automated SQL export is not exposed from the API. Use the mysqldump and mysql commands from docs/Deployment.md.',
            backupCommand: 'docker exec time_manager_mysql mysqldump -u tm_user -ptm_password time_manager > backup.sql',
            restoreCommand: 'docker exec -i time_manager_mysql mysql -u tm_user -ptm_password time_manager < backup.sql',
            timestamp: new Date(),
        };
    }
}
