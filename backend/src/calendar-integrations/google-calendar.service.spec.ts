import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { GoogleCalendarService } from './google-calendar.service';
jest.mock('axios');
const post = axios.post as jest.Mock;
const requiredScope = 'https://www.googleapis.com/auth/calendar.events.freebusy';
function setup(configured = true) {
    const values: Record<string, string> = { GOOGLE_CALENDAR_CLIENT_ID: 'client', GOOGLE_CALENDAR_CLIENT_SECRET: 'secret', GOOGLE_CALENDAR_REDIRECT_URI: 'https://app.example/app/calendar', CALENDAR_TOKEN_ENCRYPTION_KEY: 'a'.repeat(64) };
    const db = {
        googleCalendarConnection: { findUnique: jest.fn().mockResolvedValue(null), upsert: jest.fn(), deleteMany: jest.fn(), updateMany: jest.fn() },
        googleCalendarOAuthState: { create: jest.fn(), findFirst: jest.fn(), deleteMany: jest.fn().mockResolvedValue({ count: 1 }) },
        $transaction: jest.fn(),
    };
    db.$transaction.mockImplementation(async arg => typeof arg === 'function' ? arg(db) : Promise.all(arg));
    const service = new GoogleCalendarService(db as never, { get: (key: string) => configured ? values[key] : undefined } as ConfigService);
    return { db, service };
}
describe('Personal Google calendar', () => {
    beforeEach(() => { jest.resetAllMocks(); (axios.isAxiosError as unknown as jest.Mock).mockReturnValue(false); });
    it('reports missing config and disconnected schedules without external calls', async () => {
        const { service } = setup(false);
        await expect(service.status('u1')).resolves.toMatchObject({ configured: false, connected: false });
        await expect(service.connect('u1')).rejects.toMatchObject({ response: { code: 'GOOGLE_CALENDAR_NOT_CONFIGURED' } });
        await expect(service.busy('u1', new Date('2026-09-29'), new Date('2026-09-30'))).resolves.toEqual({ connected: false, busy: [] });
        expect(post).not.toHaveBeenCalled();
    });
    it('binds state to user, encrypts verifier and tokens, rejects reuse and another user', async () => {
        const { db, service } = setup();
        const { url } = await service.connect('u1');
        const params = new URL(url).searchParams;
        expect(params.get('scope')).toBe(requiredScope);
        expect(params.get('code_challenge_method')).toBe('S256');
        const stateRecord = db.googleCalendarOAuthState.create.mock.calls[0][0].data;
        expect(stateRecord.userId).toBe('u1');
        expect(stateRecord.stateHash).not.toBe(params.get('state'));
        expect(stateRecord.verifier.split('.')).toHaveLength(3);
        db.googleCalendarOAuthState.findFirst.mockResolvedValue(null);
        await expect(service.complete('other', { code: 'code', state: params.get('state')! })).rejects.toThrow();
        expect(post).not.toHaveBeenCalled();
        db.googleCalendarOAuthState.findFirst.mockResolvedValue(stateRecord);
        post.mockResolvedValue({ data: { refresh_token: 'private-refresh', scope: requiredScope } });
        await service.complete('u1', { code: 'code', state: params.get('state')! });
        const saved = db.googleCalendarConnection.upsert.mock.calls[0][0].create;
        expect(saved.refreshToken).not.toContain('private-refresh');
        expect(saved.refreshToken.split('.')).toHaveLength(3);
        db.googleCalendarOAuthState.deleteMany.mockResolvedValue({ count: 0 });
        await expect(service.complete('u1', { code: 'code', state: params.get('state')! })).rejects.toThrow();
        expect(db.googleCalendarConnection.upsert).toHaveBeenCalledTimes(1);
    });
    it('checks Google busy intervals with strict boundaries and sanitizes provider errors', async () => {
        const { db, service } = setup();
        const { url } = await service.connect('u1');
        db.googleCalendarOAuthState.findFirst.mockResolvedValue(db.googleCalendarOAuthState.create.mock.calls[0][0].data);
        post.mockResolvedValueOnce({ data: { refresh_token: 'private-refresh', scope: requiredScope } });
        await service.complete('u1', { code: 'code', state: new URL(url).searchParams.get('state')! });
        db.googleCalendarConnection.findUnique.mockResolvedValue(db.googleCalendarConnection.upsert.mock.calls[0][0].create);
        const from = new Date('2026-09-29T02:00:00Z'), to = new Date('2026-09-29T03:00:00Z');
        post.mockResolvedValueOnce({ data: { access_token: 'access' } }).mockResolvedValueOnce({ data: { calendars: { primary: { busy: [{ start: from.toISOString(), end: to.toISOString() }] } } } });
        await expect(service.assertAvailable('u1', from, to)).rejects.toMatchObject({ response: { code: 'GOOGLE_CALENDAR_CONFLICT' } });
        post.mockResolvedValueOnce({ data: { access_token: 'access' } }).mockResolvedValueOnce({ data: { calendars: { primary: { busy: [{ start: from.toISOString(), end: to.toISOString() }] } } } });
        await expect(service.assertAvailable('u1', to, new Date(+to + 3600000))).resolves.toBeUndefined();
        post.mockRejectedValueOnce(new Error('private-refresh'));
        await expect(service.busy('u1', from, to)).rejects.toMatchObject({ response: { code: 'GOOGLE_CALENDAR_UNAVAILABLE' } });
    });
    it('disconnect removes local tokens and pending flows even if revocation fails', async () => {
        const { db, service } = setup();
        db.googleCalendarConnection.findUnique.mockResolvedValue({ refreshToken: 'invalid' });
        await expect(service.disconnect('u1')).resolves.toEqual({ connected: false, revoked: false });
        expect(db.googleCalendarConnection.deleteMany).toHaveBeenCalledWith({ where: { userId: 'u1' } });
        expect(db.googleCalendarOAuthState.deleteMany).toHaveBeenCalledWith({ where: { userId: 'u1' } });
    });
    it('rejects reversed and invalid date ranges', async () => {
        const { service } = setup();
        await expect(service.busy('u1', new Date('invalid'), new Date())).rejects.toThrow();
        await expect(service.busy('u1', new Date('2026-09-30'), new Date('2026-09-29'))).rejects.toThrow();
    });
});
