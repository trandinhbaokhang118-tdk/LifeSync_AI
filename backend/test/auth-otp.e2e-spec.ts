import { INestApplication } from '@nestjs/common';
import { createTestApp, api } from './utils/e2e-app';
import { cleanupUsers } from './utils/auth-helper';
import { PrismaService } from '../src/prisma/prisma.service';

/**
 * E2E coverage for the phone/OTP login flow. Rate limiting is disabled here
 * (default test behaviour) so we can exercise the OTP branches directly; the
 * OTP throttling itself is proven separately in security.e2e-spec.ts.
 *
 * The OTP value is generated server-side and only "sent" via a (stubbed) SMS
 * provider, so tests focus on the security-relevant branches we CAN assert
 * without knowing the code: validation, missing OTP, and wrong OTP.
 */
describe('Auth OTP flow (e2e)', () => {
    let app: INestApplication;
    let prisma: PrismaService;
    let baseUrl: string;
    const createdPhones: string[] = [];

    beforeAll(async () => {
        ({ app, prisma, baseUrl } = await createTestApp());
    });

    afterAll(async () => {
        // Clean up any users auto-created by phone login.
        if (createdPhones.length > 0) {
            const users = await prisma.user.findMany({
                where: { phone: { in: createdPhones } },
                select: { id: true },
            });
            await cleanupUsers(prisma, users.map((u) => u.id));
        }
        await app.close();
    });

    it('accepts a valid phone number and reports OTP sent', async () => {
        const res = await api<{ data?: { message: string }; message?: string }>(
            baseUrl,
            '/auth/send-otp',
            { method: 'POST', body: { phone: '0900000001' } },
        );

        expect(res.status).toBe(200);
    });

    it('rejects a malformed phone number with 400 validation error', async () => {
        const res = await api<{ error: { code: string } }>(baseUrl, '/auth/send-otp', {
            method: 'POST',
            body: { phone: '123' },
        });

        expect(res.status).toBe(400);
        expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects verify when no OTP was ever requested for that phone (401)', async () => {
        const res = await api<{ error: { code: string } }>(baseUrl, '/auth/verify-otp', {
            method: 'POST',
            body: { phone: '0988888888', otp: '000000' },
        });

        expect(res.status).toBe(401);
        expect(res.body.error.code).toBe('OTP_NOT_FOUND');
    });

    it('rejects verify with a wrong OTP after one was requested (401)', async () => {
        const phone = '0900000002';
        const send = await api(baseUrl, '/auth/send-otp', {
            method: 'POST',
            body: { phone },
        });
        expect(send.status).toBe(200);

        // We do not know the real 6-digit code; a guess must be rejected.
        const res = await api<{ error: { code: string } }>(baseUrl, '/auth/verify-otp', {
            method: 'POST',
            body: { phone, otp: '999999' },
        });

        expect(res.status).toBe(401);
        expect(res.body.error.code).toBe('OTP_INVALID');
    });

    it('rejects verify with a malformed OTP (not 6 digits) with 400', async () => {
        const res = await api<{ error: { code: string } }>(baseUrl, '/auth/verify-otp', {
            method: 'POST',
            body: { phone: '0900000003', otp: '12' },
        });

        expect(res.status).toBe(400);
        expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('invalidates the OTP after 5 wrong guesses (OTP_ATTEMPTS_EXCEEDED)', async () => {
        const phone = '0900000004';
        const send = await api(baseUrl, '/auth/send-otp', {
            method: 'POST',
            body: { phone },
        });
        expect(send.status).toBe(200);

        const codes: string[] = [];
        // 4 wrong guesses are rejected as OTP_INVALID...
        for (let i = 0; i < 4; i++) {
            const res = await api<{ error: { code: string } }>(baseUrl, '/auth/verify-otp', {
                method: 'POST',
                body: { phone, otp: '111111' },
            });
            codes.push(res.body.error.code);
        }
        expect(codes).toEqual([
            'OTP_INVALID',
            'OTP_INVALID',
            'OTP_INVALID',
            'OTP_INVALID',
        ]);

        // ...the 5th trips the lockout and burns the OTP.
        const fifth = await api<{ error: { code: string } }>(baseUrl, '/auth/verify-otp', {
            method: 'POST',
            body: { phone, otp: '111111' },
        });
        expect(fifth.status).toBe(401);
        expect(fifth.body.error.code).toBe('OTP_ATTEMPTS_EXCEEDED');

        // The OTP is now gone entirely: further attempts see OTP_NOT_FOUND.
        const after = await api<{ error: { code: string } }>(baseUrl, '/auth/verify-otp', {
            method: 'POST',
            body: { phone, otp: '111111' },
        });
        expect(after.body.error.code).toBe('OTP_NOT_FOUND');
    });
});
