import { INestApplication } from '@nestjs/common';
import { createTestApp, api } from './utils/e2e-app';
import { registerAndLogin, cleanupUsers, TestUser } from './utils/auth-helper';
import { PrismaService } from '../src/prisma/prisma.service';

const at = (offsetMinutes: number) =>
    new Date(Date.now() + offsetMinutes * 60_000).toISOString();

describe('Time blocks flow (e2e)', () => {
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

    it('creates a time block', async () => {
        const res = await api<{ data: { id: string; title: string } }>(baseUrl, '/time-blocks', {
            method: 'POST',
            token: user.accessToken,
            body: { title: 'Deep work', startAt: at(600), endAt: at(720) },
        });

        expect(res.status).toBe(201);
        expect(res.body.data.title).toBe('Deep work');
    });

    it('rejects an invalid range where start is after end (400)', async () => {
        const res = await api<{ error: { code: string } }>(baseUrl, '/time-blocks', {
            method: 'POST',
            token: user.accessToken,
            body: { title: 'Bad range', startAt: at(900), endAt: at(800) },
        });

        expect(res.status).toBe(400);
        expect(res.body.error.code).toBe('TIME_BLOCK_INVALID_RANGE');
    });

    it('rejects an overlapping time block (409)', async () => {
        await api(baseUrl, '/time-blocks', {
            method: 'POST',
            token: user.accessToken,
            body: { title: 'First', startAt: at(1000), endAt: at(1100) },
        });

        const overlap = await api<{ error: { code: string } }>(baseUrl, '/time-blocks', {
            method: 'POST',
            token: user.accessToken,
            body: { title: 'Overlapping', startAt: at(1050), endAt: at(1150) },
        });

        expect(overlap.status).toBe(409);
        expect(overlap.body.error.code).toBe('TIME_BLOCK_OVERLAP');
    });

    it('lists time blocks within a date range', async () => {
        const res = await api<{ data: unknown[] }>(
            baseUrl,
            `/time-blocks?startDate=${encodeURIComponent(at(0))}&endDate=${encodeURIComponent(at(2000))}`,
            { token: user.accessToken },
        );

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });
});
