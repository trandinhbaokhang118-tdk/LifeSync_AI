import { INestApplication } from '@nestjs/common';
import { createTestApp, api } from './utils/e2e-app';
import { registerAndLogin, cleanupUsers, TestUser } from './utils/auth-helper';
import { PrismaService } from '../src/prisma/prisma.service';
import * as crypto from 'crypto';

/**
 * Session/password-lifecycle security. Verifies that changing a password
 * revokes existing sessions (refresh tokens) and rejects no-op changes — key
 * protections when an account is suspected compromised.
 */
describe('Auth session security (e2e)', () => {
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

    it('revokes all existing refresh tokens after a password change', async () => {
        const user: TestUser = await registerAndLogin(baseUrl, createdUserIds);
        const oldRefresh = user.refreshToken;

        // Sanity: the refresh token works before the password change.
        const before = await api<{ data: { accessToken: string } }>(baseUrl, '/auth/refresh', {
            method: 'POST',
            body: { refreshToken: oldRefresh },
        });
        expect(before.status).toBe(200);

        // Change the password (must re-login for a fresh refresh token because
        // the sanity refresh above rotated the original one).
        const relogin = await api<{ data: { accessToken: string; refreshToken: string } }>(
            baseUrl,
            '/auth/login',
            { method: 'POST', body: { email: user.email, password: user.password } },
        );
        const currentRefresh = relogin.body.data.refreshToken;

        const change = await api<{ data?: { message: string } }>(baseUrl, '/users/change-password', {
            method: 'PATCH',
            token: relogin.body.data.accessToken,
            body: { currentPassword: user.password, newPassword: 'brandNewPass456' },
        });
        expect(change.status).toBe(200);

        // Every refresh token issued before the change must now be rejected.
        const afterOld = await api<{ error: { code: string } }>(baseUrl, '/auth/refresh', {
            method: 'POST',
            body: { refreshToken: currentRefresh },
        });
        expect(afterOld.status).toBe(401);
        expect(afterOld.body.error.code).toBe('AUTH_REFRESH_INVALID');
    });

    it('rejects changing the password to the same value (PASSWORD_UNCHANGED)', async () => {
        const user: TestUser = await registerAndLogin(baseUrl, createdUserIds);

        const res = await api<{ error: { code: string } }>(baseUrl, '/users/change-password', {
            method: 'PATCH',
            token: user.accessToken,
            body: { currentPassword: user.password, newPassword: user.password },
        });

        expect(res.status).toBe(400);
        expect(res.body.error.code).toBe('PASSWORD_UNCHANGED');
    });

    it('revokes the refresh token on logout even without an access token', async () => {
        const user: TestUser = await registerAndLogin(baseUrl, createdUserIds);

        const logout = await api(baseUrl, '/auth/logout', {
            method: 'POST',
            body: { refreshToken: user.refreshToken },
        });
        expect(logout.status).toBe(200);

        const refresh = await api<{ error: { code: string } }>(baseUrl, '/auth/refresh', {
            method: 'POST',
            body: { refreshToken: user.refreshToken },
        });
        expect(refresh.status).toBe(401);
        expect(refresh.body.error.code).toBe('AUTH_REFRESH_INVALID');
    });

    it('lets the user log in with the new password after a change', async () => {
        const user: TestUser = await registerAndLogin(baseUrl, createdUserIds);
        const newPassword = 'freshSecret789';

        const change = await api(baseUrl, '/users/change-password', {
            method: 'PATCH',
            token: user.accessToken,
            body: { currentPassword: user.password, newPassword },
        });
        expect(change.status).toBe(200);

        // Old password no longer works.
        const oldLogin = await api<{ error: { code: string } }>(baseUrl, '/auth/login', {
            method: 'POST',
            body: { email: user.email, password: user.password },
        });
        expect(oldLogin.status).toBe(401);

        // New password works.
        const newLogin = await api<{ data: { accessToken: string } }>(baseUrl, '/auth/login', {
            method: 'POST',
            body: { email: user.email, password: newPassword },
        });
        expect(newLogin.status).toBe(200);
        expect(newLogin.body.data.accessToken).toEqual(expect.any(String));
    });

    it('resets a password with a one-time token and revokes existing sessions', async () => {
        const user: TestUser = await registerAndLogin(baseUrl, createdUserIds);
        const rawToken = 'a'.repeat(64);
        const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

        await prisma.passwordResetToken.create({
            data: {
                userId: user.id,
                tokenHash,
                expiresAt: new Date(Date.now() + 60_000),
            },
        });

        const reset = await api(baseUrl, '/auth/password-reset/confirm', {
            method: 'POST',
            body: { token: rawToken, newPassword: 'resetPassword456' },
        });
        expect(reset.status).toBe(200);

        const oldSession = await api<{ error: { code: string } }>(baseUrl, '/auth/refresh', {
            method: 'POST',
            body: { refreshToken: user.refreshToken },
        });
        expect(oldSession.status).toBe(401);

        const reusedToken = await api<{ error: { code: string } }>(baseUrl, '/auth/password-reset/confirm', {
            method: 'POST',
            body: { token: rawToken, newPassword: 'anotherPassword789' },
        });
        expect(reusedToken.status).toBe(400);
        expect(reusedToken.body.error.code).toBe('PASSWORD_RESET_TOKEN_INVALID');

        const login = await api<{ data: { accessToken: string } }>(baseUrl, '/auth/login', {
            method: 'POST',
            body: { email: user.email, password: 'resetPassword456' },
        });
        expect(login.status).toBe(200);
    });
});
