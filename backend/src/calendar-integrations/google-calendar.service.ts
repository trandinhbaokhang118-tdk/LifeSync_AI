import { BadRequestException, ConflictException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';
import axios from 'axios';
import { PrismaService } from '../prisma/prisma.service';
import { CompleteCalendarDto } from './google-calendar.dto';

const scope = 'https://www.googleapis.com/auth/calendar.events.freebusy';
const digest = (value: string) => createHash('sha256').update(value).digest('hex');
interface TokenResponse { access_token?: string; refresh_token?: string; scope?: string }
interface BusyResponse { calendars?: Record<string, { errors?: unknown[]; busy?: { start: string; end: string }[] }> }

@Injectable()
export class GoogleCalendarService {
    constructor(private prisma: PrismaService, private config: ConfigService) {}

    private settings() {
        const clientId = this.config.get<string>('GOOGLE_CALENDAR_CLIENT_ID');
        const clientSecret = this.config.get<string>('GOOGLE_CALENDAR_CLIENT_SECRET');
        const redirectUri = this.config.get<string>('GOOGLE_CALENDAR_REDIRECT_URI');
        const encryptionKey = this.config.get<string>('CALENDAR_TOKEN_ENCRYPTION_KEY');
        if (!clientId || !clientSecret || !redirectUri || !encryptionKey || !/^[a-f\d]{64}$/i.test(encryptionKey)) return null;
        try {
            const url = new URL(redirectUri);
            if (url.pathname !== '/app/calendar' || url.search || url.hash ||
                (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname)))) return null;
        } catch { return null; }
        return { clientId, clientSecret, redirectUri, key: Buffer.from(encryptionKey, 'hex') };
    }
    private requiredSettings() {
        const settings = this.settings();
        if (!settings) throw new ServiceUnavailableException({ code: 'GOOGLE_CALENDAR_NOT_CONFIGURED', message: 'Kết nối Google Calendar chưa được cấu hình.' });
        return settings;
    }
    private encrypt(value: string, userId: string) {
        const iv = randomBytes(12);
        const cipher = createCipheriv('aes-256-gcm', this.requiredSettings().key, iv);
        cipher.setAAD(Buffer.from(userId));
        const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
        return [iv, cipher.getAuthTag(), encrypted].map(b => b.toString('base64url')).join('.');
    }
    private decrypt(value: string, userId: string) {
        const [iv, tag, encrypted] = value.split('.').map(v => Buffer.from(v, 'base64url'));
        const cipher = createDecipheriv('aes-256-gcm', this.requiredSettings().key, iv);
        cipher.setAAD(Buffer.from(userId)); cipher.setAuthTag(tag);
        return Buffer.concat([cipher.update(encrypted), cipher.final()]).toString('utf8');
    }
    async status(userId: string) {
        const connection = await this.prisma.googleCalendarConnection.findUnique({ where: { userId }, select: { needsReconnect: true, updatedAt: true } });
        return { configured: !!this.settings(), connected: !!connection, needsReconnect: connection?.needsReconnect ?? false, updatedAt: connection?.updatedAt ?? null };
    }
    async connect(userId: string) {
        const settings = this.requiredSettings();
        const state = randomBytes(32).toString('base64url'), verifier = randomBytes(48).toString('base64url');
        await this.prisma.$transaction([
            this.prisma.googleCalendarOAuthState.deleteMany({ where: { OR: [{ userId }, { expiresAt: { lt: new Date() } }] } }),
            this.prisma.googleCalendarOAuthState.create({ data: { stateHash: digest(state), userId, verifier: this.encrypt(verifier, userId), expiresAt: new Date(Date.now() + 10 * 60000) } }),
        ]);
        const params = new URLSearchParams({ client_id: settings.clientId, redirect_uri: settings.redirectUri, response_type: 'code', scope, state,
            access_type: 'offline', prompt: 'consent', code_challenge_method: 'S256', code_challenge: createHash('sha256').update(verifier).digest('base64url') });
        return { url: `https://accounts.google.com/o/oauth2/v2/auth?${params}` };
    }
    async complete(userId: string, dto: CompleteCalendarDto) {
        const settings = this.requiredSettings();
        const where = { stateHash: digest(dto.state), userId, expiresAt: { gt: new Date() } };
        const state = await this.prisma.googleCalendarOAuthState.findFirst({ where });
        if (!state) throw new BadRequestException({ code: 'CALENDAR_OAUTH_STATE_INVALID', message: 'Phiên kết nối hết hạn hoặc không hợp lệ. Hãy kết nối lại.' });
        try {
            const { data } = await axios.post<TokenResponse>('https://oauth2.googleapis.com/token', new URLSearchParams({
                code: dto.code, client_id: settings.clientId, client_secret: settings.clientSecret, redirect_uri: settings.redirectUri,
                grant_type: 'authorization_code', code_verifier: this.decrypt(state.verifier, userId),
            }), { timeout: 10000 });
            if (!data.refresh_token || !data.scope?.split(' ').includes(scope)) throw new Error('Required consent missing');
            const refreshToken = this.encrypt(data.refresh_token, userId);
            await this.prisma.$transaction(async tx => {
                const consumed = await tx.googleCalendarOAuthState.deleteMany({ where: { ...where, expiresAt: { gt: new Date() } } });
                if (consumed.count !== 1) throw new Error('State expired or cancelled');
                await tx.googleCalendarConnection.upsert({ where: { userId }, create: { userId, refreshToken }, update: { refreshToken, needsReconnect: false } });
            });
            return { connected: true };
        } catch {
            throw new BadRequestException({ code: 'CALENDAR_OAUTH_FAILED', message: 'Không kết nối được. Vui lòng cấp quyền xem giờ bận và thử lại.' });
        }
    }
    async disconnect(userId: string) {
        const connection = await this.prisma.googleCalendarConnection.findUnique({ where: { userId } });
        await this.prisma.$transaction([
            this.prisma.googleCalendarConnection.deleteMany({ where: { userId } }),
            this.prisma.googleCalendarOAuthState.deleteMany({ where: { userId } }),
        ]);
        let revoked = !connection;
        if (connection) {
            try {
                await axios.post('https://oauth2.googleapis.com/revoke', new URLSearchParams({ token: this.decrypt(connection.refreshToken, userId) }), { timeout: 10000 });
                revoked = true;
            } catch { /* Local credentials have already been removed. Allow manual revocation. */ }
        }
        return { connected: false, revoked };
    }
    async busy(userId: string, start: Date, end: Date) {
        if (!Number.isFinite(+start) || !Number.isFinite(+end) || +end <= +start) {
            throw new BadRequestException({ code: 'CALENDAR_INVALID_RANGE', message: 'Khoảng lịch phải hợp lệ và không quá 370 ngày.' });
        }
        const connection = await this.prisma.googleCalendarConnection.findUnique({ where: { userId } });
        if (!connection) return { connected: false, busy: [] };
        if (+end - +start > 370 * 86400000) throw new BadRequestException({ code: 'CALENDAR_INVALID_RANGE', message: 'Hãy chia công việc thành các khoảng nhỏ hơn 370 ngày để kiểm tra lịch Google.' });
        if (connection.needsReconnect) throw new ServiceUnavailableException({ code: 'GOOGLE_CALENDAR_RECONNECT', message: 'Hãy kết nối lại Google Calendar trước khi đổi lịch.' });
        const settings = this.requiredSettings();
        try {
            const token = await axios.post<TokenResponse>('https://oauth2.googleapis.com/token', new URLSearchParams({
                client_id: settings.clientId, client_secret: settings.clientSecret, grant_type: 'refresh_token', refresh_token: this.decrypt(connection.refreshToken, userId),
            }), { timeout: 10000 });
            if (!token.data.access_token) throw new Error('No access token');
            const { data } = await axios.post<BusyResponse>('https://www.googleapis.com/calendar/v3/freeBusy', {
                timeMin: start.toISOString(), timeMax: end.toISOString(), items: [{ id: 'primary' }],
            }, { headers: { Authorization: `Bearer ${token.data.access_token}` }, timeout: 10000 });
            const calendar = data.calendars?.primary;
            if (!calendar || calendar.errors?.length || !Array.isArray(calendar.busy)) throw new Error('Calendar unavailable');
            const busy = calendar.busy.map(b => {
                if (!Number.isFinite(Date.parse(b.start)) || !Number.isFinite(Date.parse(b.end)) || Date.parse(b.start) >= Date.parse(b.end)) throw new Error('Invalid interval');
                return { startAt: b.start, endAt: b.end };
            });
            return { connected: true, busy };
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.data?.error === 'invalid_grant') {
                await this.prisma.googleCalendarConnection.updateMany({ where: { userId, refreshToken: connection.refreshToken }, data: { needsReconnect: true } });
            }
            throw new ServiceUnavailableException({ code: 'GOOGLE_CALENDAR_UNAVAILABLE', message: 'Không kiểm tra được giờ bận Google. Hãy thử lại hoặc kết nối lại trong Lịch.' });
        }
    }
    async assertAvailable(userId: string, start: Date, end: Date) {
        const result = await this.busy(userId, start, end);
        if (result.busy.some(b => +start < Date.parse(b.endAt) && Date.parse(b.startAt) < +end)) {
            throw new ConflictException({ code: 'GOOGLE_CALENDAR_CONFLICT', message: 'Trùng lịch Google cá nhân. Hãy chọn khung giờ khác.', details: { busy: result.busy } });
        }
    }
}
