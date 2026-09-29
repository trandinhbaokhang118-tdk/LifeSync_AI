import { BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

interface GoogleEvent {
    id: string;
    summary?: string;
    status?: string;
    start?: { date?: string; dateTime?: string };
    end?: { date?: string; dateTime?: string };
}
export interface PublicCalendarEvent {
    id: string; title: string; startAt: string; endAt: string; allDay: boolean;
}

@Injectable()
export class PublicCalendarService {
    constructor(private config: ConfigService) {}

    async list(startDate: string, endDate: string) {
        const from = Date.parse(startDate), to = Date.parse(endDate);
        if (!Number.isFinite(from) || !Number.isFinite(to) || to <= from || to - from > 370 * 86400000) {
            throw new BadRequestException({ code: 'CALENDAR_INVALID_RANGE', message: 'Khoảng ngày phải hợp lệ và không quá 370 ngày.' });
        }
        const key = this.config.get<string>('GOOGLE_CALENDAR_API_KEY');
        const calendarId = this.config.get<string>('GOOGLE_PUBLIC_CALENDAR_ID');
        if (!key || !calendarId) return { configured: false, events: [] };
        const events: PublicCalendarEvent[] = [];
        let pageToken: string | undefined;
        try {
            // Fixed Google endpoint and server-owned calendar ID prevent arbitrary URL fetching.
            for (let page = 0; page < 10; page++) {
                const { data } = await axios.get<{ items?: GoogleEvent[]; nextPageToken?: string }>(
                    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
                    { params: { key, timeMin: new Date(from).toISOString(), timeMax: new Date(to).toISOString(), singleEvents: true, orderBy: 'startTime', maxResults: 2500, pageToken }, timeout: 10000 },
                );
                for (const e of data.items || []) {
                    const startAt = e.start?.dateTime || e.start?.date;
                    const endAt = e.end?.dateTime || e.end?.date;
                    if (e.status === 'cancelled' || !e.id || !startAt || !endAt || !(Date.parse(startAt) < Date.parse(endAt))) continue;
                    events.push({ id: e.id, title: e.summary || 'Sự kiện Google', startAt, endAt, allDay: !!e.start?.date });
                }
                pageToken = data.nextPageToken;
                if (!pageToken) return { configured: true, events };
            }
            throw new Error('Too many pages');
        } catch {
            // Do not expose Axios request configuration containing the API key.
            throw new ServiceUnavailableException({ code: 'CALENDAR_SOURCE_UNAVAILABLE', message: 'Không tải được lịch Google công khai. Vui lòng thử lại sau.' });
        }
    }
}
