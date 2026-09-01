import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateAdminUserDto } from './dto/update-admin-user.dto';

@Injectable()
export class AdminService {
    constructor(private prisma: PrismaService) { }

    async getSystemStats() {
        const [totalUsers, totalTasks, completedTasks, adminCount, moderatorCount] = await Promise.all([
            this.prisma.user.count(),
            this.prisma.task.count(),
            this.prisma.task.count({ where: { status: 'DONE' } }),
            this.prisma.user.count({ where: { role: Role.ADMIN } }),
            this.prisma.user.count({ where: { role: Role.MODERATOR } }),
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
            adminCount,
            moderatorCount,
            regularUserCount: totalUsers - adminCount - moderatorCount,
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

    async updateUser(userId: string, dto: UpdateAdminUserDto) {
        const target = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, email: true, phone: true },
        });

        if (!target) {
            throw new NotFoundException('User not found');
        }

        const data: { name?: string; email?: string; phone?: string | null } = {};

        if (dto.name !== undefined) {
            data.name = dto.name;
        }

        if (dto.email !== undefined) {
            if (dto.email !== target.email) {
                const existingEmail = await this.prisma.user.findUnique({
                    where: { email: dto.email },
                    select: { id: true },
                });

                if (existingEmail && existingEmail.id !== userId) {
                    throw new BadRequestException('Email is already in use');
                }
            }

            data.email = dto.email;
        }

        if (dto.phone !== undefined) {
            const phone = dto.phone === '' ? null : dto.phone;

            if (phone && phone !== target.phone) {
                const existingPhone = await this.prisma.user.findFirst({
                    where: { phone },
                    select: { id: true },
                });

                if (existingPhone && existingPhone.id !== userId) {
                    throw new BadRequestException('Phone number is already in use');
                }
            }

            data.phone = phone;
        }

        if (Object.keys(data).length === 0) {
            throw new BadRequestException('No account changes provided');
        }

        try {
            return await this.prisma.user.update({
                where: { id: userId },
                data,
                select: {
                    id: true,
                    email: true,
                    name: true,
                    phone: true,
                    role: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                throw new BadRequestException('Email or phone number is already in use');
            }

            throw error;
        }
    }

    async updateUserRole(userId: string, role: string, actingAdminId?: string) {
        const validRoles: string[] = [Role.USER, Role.MODERATOR, Role.ADMIN];
        if (!validRoles.includes(role)) {
            throw new BadRequestException('Invalid role');
        }

        const target = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, role: true },
        });

        if (!target) {
            throw new NotFoundException('User not found');
        }

        // Prevent removing the last admin from the system.
        if (target.role === Role.ADMIN && role !== Role.ADMIN) {
            const adminCount = await this.prisma.user.count({ where: { role: Role.ADMIN } });
            if (adminCount <= 1) {
                throw new BadRequestException(
                    'Cannot change the role of the last remaining admin. Promote another admin first.',
                );
            }
        }

        // Admins should not silently demote themselves and lose access.
        if (actingAdminId && actingAdminId === userId && role !== Role.ADMIN) {
            throw new BadRequestException('You cannot change your own admin role.');
        }

        return this.prisma.user.update({
            where: { id: userId },
            data: { role: role as Role },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
            },
        });
    }

    async deleteUser(userId: string, actingAdminId?: string) {
        if (actingAdminId && actingAdminId === userId) {
            throw new BadRequestException('You cannot delete your own account.');
        }

        const target = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, role: true },
        });

        if (!target) {
            throw new NotFoundException('User not found');
        }

        // Prevent deleting the last admin.
        if (target.role === Role.ADMIN) {
            const adminCount = await this.prisma.user.count({ where: { role: Role.ADMIN } });
            if (adminCount <= 1) {
                throw new BadRequestException('Cannot delete the last remaining admin.');
            }
        }

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
            backupCommand: 'docker exec lifesync_ai_mysql mysqldump -u tm_user -ptm_password lifesync_ai > backup.sql',
            restoreCommand: 'docker exec -i lifesync_ai_mysql mysql -u tm_user -ptm_password lifesync_ai < backup.sql',
            timestamp: new Date(),
        };
    }
}
