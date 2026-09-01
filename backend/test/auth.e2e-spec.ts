import { INestApplication } from '@nestjs/common';
import { createTestApp, api, uniqueEmail } from './utils/e2e-app';
import { cleanupUsers } from './utils/auth-helper';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Auth flow (e2e)', () => {
    let app: INestApplication;
    let prisma: PrismaService;
    let baseUrl: string;
    const createdUserIds: string[] = [];

    beforeAll(async () => {
        ({ app, prisma, baseUrl } = await createTestApp());
    });

    afterAll(async () => {
        await cleanupUsers(prisma, createdUserIds);
        await app.close();
    });

    it('registers a new user and returns a sanitized profile', async () => {
        const email = uniqueEmail('auth');
        const res = await api<{ data: { id: string; email: string; passwordHash?: string } }>(
            baseUrl,
            '/auth/register',
            { method: 'POST', body: { email, password: 'password123', name: 'Auth User' } },
        );

        expect(res.status).toBe(201);
        expect(res.body.data.id).toEqual(expect.any(String));
        expect(res.body.data.email).toBe(email);
        expect(res.body.data.passwordHash).toBeUndefined();
        createdUserIds.push(res.body.data.id);
    });

    it('rejects duplicate registration with 409', async () => {
        const email = uniqueEmail('dup');
        const first = await api<{ data: { id: string } }>(baseUrl, '/auth/register', {
            method: 'POST',
            body: { email, password: 'password123', name: 'Dup User' },
        });
        createdUserIds.push(first.body.data.id);

        const second = await api<{ error: { code: string } }>(baseUrl, '/auth/register', {
            method: 'POST',
            body: { email, password: 'password123', name: 'Dup User' },
        });

        expect(second.status).toBe(409);
        expect(second.body.error.code).toBe('USER_EXISTS');
    });

    it('rejects registration that fails validation with 400', async () => {
        const res = await api<{ error: { code: string } }>(baseUrl, '/auth/register', {
            method: 'POST',
            body: { email: 'not-an-email', password: '123', name: '' },
        });

        expect(res.status).toBe(400);
        expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('logs in with valid credentials and issues tokens', async () => {
        const email = uniqueEmail('login');
        const register = await api<{ data: { id: string } }>(baseUrl, '/auth/register', {
            method: 'POST',
            body: { email, password: 'password123', name: 'Login User' },
        });
        createdUserIds.push(register.body.data.id);

        const res = await api<{
            data: { accessToken: string; refreshToken: string; user: { email: string }; access: { portal: string } };
        }>(baseUrl, '/auth/login', { method: 'POST', body: { email, password: 'password123' } });

        expect(res.status).toBe(200);
        expect(res.body.data.accessToken).toEqual(expect.any(String));
        expect(res.body.data.refreshToken).toEqual(expect.any(String));
        expect(res.body.data.user.email).toBe(email);
        expect(res.body.data.access.portal).toBe('user');
    });

    it('rejects login with wrong password (401)', async () => {
        const email = uniqueEmail('wrong');
        const register = await api<{ data: { id: string } }>(baseUrl, '/auth/register', {
            method: 'POST',
            body: { email, password: 'password123', name: 'Wrong Pass' },
        });
        createdUserIds.push(register.body.data.id);

        const res = await api<{ error: { code: string } }>(baseUrl, '/auth/login', {
            method: 'POST',
            body: { email, password: 'wrong-password' },
        });

        expect(res.status).toBe(401);
        expect(res.body.error.code).toBe('AUTH_INVALID_CREDENTIALS');
    });

    it('returns the current user from /auth/me with a valid token', async () => {
        const email = uniqueEmail('me');
        const register = await api<{ data: { id: string } }>(baseUrl, '/auth/register', {
            method: 'POST',
            body: { email, password: 'password123', name: 'Me User' },
        });
        createdUserIds.push(register.body.data.id);

        const login = await api<{ data: { accessToken: string } }>(baseUrl, '/auth/login', {
            method: 'POST',
            body: { email, password: 'password123' },
        });

        const me = await api<{ data: { email: string; role: string } }>(baseUrl, '/auth/me', {
            token: login.body.data.accessToken,
        });

        expect(me.status).toBe(200);
        expect(me.body.data.email).toBe(email);
        expect(me.body.data.role).toBe('USER');
    });

    it('rejects /auth/me without a token (401)', async () => {
        const res = await api<{ error: { code: string } }>(baseUrl, '/auth/me');
        expect(res.status).toBe(401);
        expect(res.body.error.code).toBe('AUTH_UNAUTHORIZED');
    });

    it('rotates refresh tokens and invalidates the old one', async () => {
        const email = uniqueEmail('refresh');
        const register = await api<{ data: { id: string } }>(baseUrl, '/auth/register', {
            method: 'POST',
            body: { email, password: 'password123', name: 'Refresh User' },
        });
        createdUserIds.push(register.body.data.id);

        const login = await api<{ data: { refreshToken: string } }>(baseUrl, '/auth/login', {
            method: 'POST',
            body: { email, password: 'password123' },
        });
        const oldRefresh = login.body.data.refreshToken;

        const refreshed = await api<{ data: { accessToken: string; refreshToken: string } }>(
            baseUrl,
            '/auth/refresh',
            { method: 'POST', body: { refreshToken: oldRefresh } },
        );

        expect(refreshed.status).toBe(200);
        expect(refreshed.body.data.accessToken).toEqual(expect.any(String));
        expect(refreshed.body.data.refreshToken).not.toBe(oldRefresh);

        // Old token must no longer work (rotation).
        const reuseOld = await api<{ error: { code: string } }>(baseUrl, '/auth/refresh', {
            method: 'POST',
            body: { refreshToken: oldRefresh },
        });
        expect(reuseOld.status).toBe(401);
        expect(reuseOld.body.error.code).toBe('AUTH_REFRESH_INVALID');
    });
});
