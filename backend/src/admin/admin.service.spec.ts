import { ConflictException } from '@nestjs/common';
import { Role } from '@prisma/client';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { AdminService } from './admin.service';

jest.mock('argon2', () => ({
    hash: jest.fn(),
}));

describe('AdminService createUser', () => {
    const user = {
        findFirst: jest.fn(),
        create: jest.fn(),
    };
    const service = new AdminService({ user } as unknown as PrismaService);

    beforeEach(() => {
        jest.clearAllMocks();
        (argon2.hash as jest.Mock).mockResolvedValue('hashed-password');
    });

    it('hashes the password and creates a regular user by default', async () => {
        user.findFirst.mockResolvedValue(null);
        user.create.mockResolvedValue({
            id: 'user-id',
            name: 'New User',
            email: 'new@example.com',
            phone: null,
            role: Role.USER,
        });

        const result = await service.createUser({
            name: 'New User',
            email: 'new@example.com',
            password: 'password123',
        });

        expect(argon2.hash).toHaveBeenCalledWith('password123');
        expect(user.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    passwordHash: 'hashed-password',
                    role: Role.USER,
                }),
                select: expect.not.objectContaining({ passwordHash: true }),
            }),
        );
        expect(result).not.toHaveProperty('passwordHash');
    });

    it('rejects an email that is already in use before hashing', async () => {
        user.findFirst.mockResolvedValue({
            email: 'existing@example.com',
            phone: null,
        });

        await expect(
            service.createUser({
                name: 'New User',
                email: 'existing@example.com',
                password: 'password123',
            }),
        ).rejects.toBeInstanceOf(ConflictException);

        expect(argon2.hash).not.toHaveBeenCalled();
        expect(user.create).not.toHaveBeenCalled();
    });
});
