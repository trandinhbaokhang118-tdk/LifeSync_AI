import { INestApplication } from '@nestjs/common';
import { createTestApp, api } from './utils/e2e-app';
import { registerAndLogin, promoteToAdmin, cleanupUsers, TestUser } from './utils/auth-helper';
import { PrismaService } from '../src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

describe('Admin RBAC flow (e2e)', () => {
    let app: INestApplication;
    let prisma: PrismaService;
    let jwtService: JwtService;
    let baseUrl: string;
    let normalUser: TestUser;
    let adminUser: TestUser;
    let adminToken: string;
    const createdUserIds: string[] = [];

    beforeAll(async () => {
        ({ app, prisma, baseUrl } = await createTestApp());
        jwtService = app.get(JwtService);
        normalUser = await registerAndLogin(baseUrl, createdUserIds);
        adminUser = await registerAndLogin(baseUrl, createdUserIds);
        adminToken = await promoteToAdmin(prisma, jwtService, adminUser);
    });

    afterAll(async () => {
        await cleanupUsers(prisma, createdUserIds);
        await app.close();
    });

    it('blocks a normal user from admin stats (403)', async () => {
        const res = await api<{ error: { code: string } }>(baseUrl, '/admin/stats', {
            token: normalUser.accessToken,
        });

        expect(res.status).toBe(403);
        expect(res.body.error.code).toBe('AUTH_ADMIN_SESSION_REQUIRED');
    });

    it('blocks an admin from user-only task routes (403)', async () => {
        const res = await api<{ error: { code: string } }>(baseUrl, '/tasks', {
            token: adminToken,
        });

        expect(res.status).toBe(403);
        expect(res.body.error.code).toBe('AUTH_ROLE_FORBIDDEN');
    });

    it('allows an admin to read system stats', async () => {
        const res = await api<{ data: { totalUsers: number } }>(baseUrl, '/admin/stats', {
            token: adminToken,
        });

        expect(res.status).toBe(200);
        expect(typeof res.body.data.totalUsers).toBe('number');
    });

    it('allows an admin to list users', async () => {
        const res = await api<{ data: unknown[] }>(baseUrl, '/admin/users', {
            token: adminToken,
        });

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('rejects unauthenticated access to admin routes (401)', async () => {
        const res = await api(baseUrl, '/admin/stats');
        expect(res.status).toBe(401);
    });
});
