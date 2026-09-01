import { Injectable, ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

    async create(createUserDto: CreateUserDto) {
        const { email, password, name } = createUserDto;

        // Check if user already exists
        const existingUser = await this.prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            throw new ConflictException({
                code: 'USER_EXISTS',
                message: 'User with this email already exists',
            });
        }

        // Hash password
        const passwordHash = await argon2.hash(password);

        // Create user
        const user = await this.prisma.user.create({
            data: {
                email,
                passwordHash,
                name,
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        return user;
    }

    async findByEmail(email: string) {
        return this.prisma.user.findUnique({
            where: { email },
        });
    }

    async findById(id: string) {
        return this.prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true,
                updatedAt: true,
            },
        });
    }

    async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
        return argon2.verify(hashedPassword, plainPassword);
    }

    async updateProfile(userId: string, dto: UpdateProfileDto) {
        const { email, name } = dto;

        // Check if email is already taken by another user
        if (email) {
            const existingUser = await this.prisma.user.findUnique({
                where: { email },
            });

            if (existingUser && existingUser.id !== userId) {
                throw new ConflictException({
                    code: 'EMAIL_TAKEN',
                    message: 'Email is already taken',
                });
            }
        }

        return this.prisma.user.update({
            where: { id: userId },
            data: { email, name },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                avatar: true,
                createdAt: true,
                updatedAt: true,
            },
        });
    }

    async changePassword(userId: string, dto: ChangePasswordDto) {
        const { currentPassword, newPassword } = dto;

        // Get user with password
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new NotFoundException({
                code: 'USER_NOT_FOUND',
                message: 'User not found',
            });
        }

        // Verify current password
        const isPasswordValid = await argon2.verify(user.passwordHash, currentPassword);
        if (!isPasswordValid) {
            throw new BadRequestException({
                code: 'INVALID_PASSWORD',
                message: 'Current password is incorrect',
            });
        }

        // Reject no-op changes so a compromised session can't "confirm" the
        // current password by setting it to itself.
        if (currentPassword === newPassword) {
            throw new BadRequestException({
                code: 'PASSWORD_UNCHANGED',
                message: 'New password must be different from the current password',
            });
        }

        // Hash new password
        const newPasswordHash = await argon2.hash(newPassword);

        // Update password AND revoke every existing refresh token in one
        // transaction. Changing a password must invalidate all other sessions
        // (a key mitigation when an account is suspected compromised).
        await this.prisma.$transaction([
            this.prisma.user.update({
                where: { id: userId },
                data: { passwordHash: newPasswordHash },
            }),
            this.prisma.refreshToken.deleteMany({
                where: { userId },
            }),
        ]);

        return { message: 'Password changed successfully' };
    }

    async updateAvatar(userId: string, filename: string) {
        const avatarUrl = `/uploads/avatars/${filename}`;

        return this.prisma.user.update({
            where: { id: userId },
            data: { avatar: avatarUrl },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                avatar: true,
                createdAt: true,
                updatedAt: true,
            },
        });
    }
}
