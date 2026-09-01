import { INestApplication } from '@nestjs/common';
import { createTestApp, api } from './utils/e2e-app';
import { registerAndLogin, cleanupUsers, TestUser } from './utils/auth-helper';
import { PrismaService } from '../src/prisma/prisma.service';

const FUTURE = (offsetMinutes: number) =>
    new Date(Date.now() + offsetMinutes * 60_000).toISOString();

describe('Tasks flow (e2e)', () => {
    let app: INestApplication;
    let prisma: PrismaService;
    let baseUrl: string;
    let user: TestUser;
    const createdUserIds: string[] = [];

    beforeAll(async () => {
        ({ app, prisma, baseUrl } = await createTestApp());
        user = await registerAndLogin(baseUrl, createdUserIds);
    });

    afterAll(async () => {
        await cleanupUsers(prisma, createdUserIds);
        await app.close();
    });

    it('rejects task access without authentication (401)', async () => {
        const res = await api(baseUrl, '/tasks');
        expect(res.status).toBe(401);
    });

    it('creates a task and returns it with formatted tags', async () => {
        const res = await api<{ data: { id: string; title: string; status: string; tags: unknown[] } }>(
            baseUrl,
            '/tasks',
            {
                method: 'POST',
                token: user.accessToken,
                body: {
                    title: 'Write e2e tests',
                    description: 'Cover the core flows',
                    startAt: FUTURE(60),
                    dueAt: FUTURE(120),
                    priority: 'HIGH',
                },
            },
        );

        expect(res.status).toBe(201);
        expect(res.body.data.id).toEqual(expect.any(String));
        expect(res.body.data.title).toBe('Write e2e tests');
        expect(res.body.data.status).toBe('TODO');
        expect(Array.isArray(res.body.data.tags)).toBe(true);
    });

    it('rejects a task whose dueAt is before startAt (400)', async () => {
        const res = await api<{ error: { code: string } }>(baseUrl, '/tasks', {
            method: 'POST',
            token: user.accessToken,
            body: {
                title: 'Invalid range',
                startAt: FUTURE(120),
                dueAt: FUTURE(60),
            },
        });

        expect(res.status).toBe(400);
        expect(res.body.error.code).toBe('INVALID_TIME_RANGE');
    });

    it('lists tasks with pagination metadata', async () => {
        const res = await api<{
            data: unknown[];
            meta: { page: number; limit: number; total: number; totalPages: number };
        }>(baseUrl, '/tasks?page=1&limit=5', { token: user.accessToken });

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.meta.page).toBe(1);
        expect(res.body.meta.limit).toBe(5);
        expect(res.body.meta.total).toBeGreaterThanOrEqual(1);
    });

    it('updates a task status', async () => {
        const created = await api<{ data: { id: string } }>(baseUrl, '/tasks', {
            method: 'POST',
            token: user.accessToken,
            body: { title: 'To update', startAt: FUTURE(60), dueAt: FUTURE(120) },
        });
        const id = created.body.data.id;

        const updated = await api<{ data: { status: string } }>(baseUrl, `/tasks/${id}`, {
            method: 'PATCH',
            token: user.accessToken,
            body: { status: 'DONE' },
        });

        expect(updated.status).toBe(200);
        expect(updated.body.data.status).toBe('DONE');
    });

    it('deletes a task and then returns 404 on fetch', async () => {
        const created = await api<{ data: { id: string } }>(baseUrl, '/tasks', {
            method: 'POST',
            token: user.accessToken,
            body: { title: 'To delete', startAt: FUTURE(60), dueAt: FUTURE(120) },
        });
        const id = created.body.data.id;

        const del = await api(baseUrl, `/tasks/${id}`, { method: 'DELETE', token: user.accessToken });
        expect(del.status).toBe(200);

        const fetch = await api<{ error: { code: string } }>(baseUrl, `/tasks/${id}`, {
            token: user.accessToken,
        });
        expect(fetch.status).toBe(404);
        expect(fetch.body.error.code).toBe('RESOURCE_NOT_FOUND');
    });

    it('prevents one user from accessing another user task (403)', async () => {
        const created = await api<{ data: { id: string } }>(baseUrl, '/tasks', {
            method: 'POST',
            token: user.accessToken,
            body: { title: 'Owner only', startAt: FUTURE(60), dueAt: FUTURE(120) },
        });
        const id = created.body.data.id;

        const intruder = await registerAndLogin(baseUrl, createdUserIds);
        const res = await api<{ error: { code: string } }>(baseUrl, `/tasks/${id}`, {
            token: intruder.accessToken,
        });

        expect(res.status).toBe(403);
        expect(res.body.error.code).toBe('AUTH_FORBIDDEN');
    });
});
