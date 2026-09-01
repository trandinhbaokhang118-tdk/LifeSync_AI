import { INestApplication } from '@nestjs/common';
import { createTestApp, api, uniqueEmail } from './utils/e2e-app';
import { cleanupUsers } from './utils/auth-helper';
import { PrismaService } from '../src/prisma/prisma.service';

/**
 * Security-focused e2e suite. Unlike the other suites (where rate limiting is
 * disabled so they can register/login freely), this suite opts INTO the real
 * rate limiters via RATE_LIMIT_FORCE so we can prove brute-force protection
 * actually blocks abusive traffic.
 */
describe('Security hardening (e2e)', () => {
    let app: INestApplication;
    let prisma: PrismaService;
    let baseUrl: string;
    const createdUserIds: string[] = [];

    beforeAll(async () => {
        // Turn the limiters back on for this suite only.
        process.env.RATE_LIMIT_FORCE = '1';
        ({ app, prisma, baseUrl } = await createTestApp());
    });

    afterAll(async () => {
        delete process.env.RATE_LIMIT_FORCE;
        await cleanupUsers(prisma, createdUserIds);
        await app.close();
    });

    it('never leaks passwordHash or password in the register response', async () => {
        const email = uniqueEmail('sec-sanitize');
        const res = await api<{ data: Record<string, unknown> }>(baseUrl, '/auth/register', {
            method: 'POST',
            body: { email, password: 'password123', name: 'Sanitize User' },
        });

        expect(res.status).toBe(201);
        expect(res.body.data.id).toEqual(expect.any(String));
        expect(res.body.data.passwordHash).toBeUndefined();
        expect(res.body.data.password).toBeUndefined();
        createdUserIds.push(res.body.data.id as string);
    });

    it('blocks brute-force login after 5 failed attempts (429) and locks the IP', async () => {
        const ip = fakeIp('login');
        const email = uniqueEmail('sec-brute');
        const register = await api<{ data: { id: string } }>(baseUrl, '/auth/register', {
            method: 'POST',
            body: { email, password: 'password123', name: 'Brute User' },
            headers: { 'CF-Connecting-IP': fakeIp('register-for-brute') },
        });
        expect(register.status).toBe(201);
        createdUserIds.push(register.body.data.id);

        // Five wrong-password attempts are allowed through (each a 401 auth
        // failure). The limiter is configured for max 5 failed attempts.
        const statuses: number[] = [];
        for (let i = 0; i < 6; i++) {
            const attempt = await api<{ error?: { code: string } }>(baseUrl, '/auth/login', {
                method: 'POST',
                body: { email, password: 'wrong-password' },
                headers: { 'CF-Connecting-IP': ip },
            });
            statuses.push(attempt.status);
        }

        expect(statuses.slice(0, 5)).toEqual([401, 401, 401, 401, 401]);
        expect(statuses[5]).toBe(429);

        // Even the CORRECT password is now blocked: the IP is rate-limited,
        // which is exactly what stops a credential-stuffing attack.
        const correct = await api<{ message?: string }>(baseUrl, '/auth/login', {
            method: 'POST',
            body: { email, password: 'password123' },
            headers: { 'CF-Connecting-IP': ip },
        });
        expect(correct.status).toBe(429);
    });

    it('blocks mass account creation after 3 registrations from one IP (429)', async () => {
        const ip = fakeIp('register');
        const statuses: number[] = [];

        // Limiter allows 3 registrations/hour. The 4th from the same IP is blocked.
        for (let i = 0; i < 4; i++) {
            const res = await api<{ data?: { id: string } }>(baseUrl, '/auth/register', {
                method: 'POST',
                body: {
                    email: uniqueEmail(`sec-reg-${i}`),
                    password: 'password123',
                    name: `Reg User ${i}`,
                },
                headers: { 'CF-Connecting-IP': ip },
            });
            statuses.push(res.status);
            if (res.body.data?.id) {
                createdUserIds.push(res.body.data.id);
            }
        }

        expect(statuses.slice(0, 3)).toEqual([201, 201, 201]);
        expect(statuses[3]).toBe(429);
    });

    it('throttles OTP requests after 3 sends from one IP (429)', async () => {
        const ip = fakeIp('otp');
        const statuses: number[] = [];

        // send-otp shares the password-reset limiter: 3 requests/hour per IP.
        for (let i = 0; i < 4; i++) {
            const res = await api(baseUrl, '/auth/send-otp', {
                method: 'POST',
                body: { phone: '0912345678' },
                headers: { 'CF-Connecting-IP': ip },
            });
            statuses.push(res.status);
        }

        expect(statuses.slice(0, 3)).toEqual([200, 200, 200]);
        expect(statuses[3]).toBe(429);
    });
});

/** Builds a unique, deterministic fake client IP so each test's rate-limit
 *  counter is isolated (the limiter keys off CF-Connecting-IP). */
function fakeIp(seed: string): string {
    let hash = 0;
    for (const ch of seed) hash = (hash * 31 + ch.charCodeAt(0)) % 65536;
    return `203.0.${Math.floor(hash / 256)}.${hash % 256}`;
}
