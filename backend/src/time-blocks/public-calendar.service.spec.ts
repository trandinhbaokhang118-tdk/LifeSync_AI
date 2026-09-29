import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { PublicCalendarService } from './public-calendar.service';
jest.mock('axios');
const get = axios.get as jest.Mock;
const from = '2026-09-01T00:00:00Z', to = '2026-10-01T00:00:00Z';
const service = (configured = true) => new PublicCalendarService({ get: (key: string) => configured ? ({ GOOGLE_CALENDAR_API_KEY: 'secret', GOOGLE_PUBLIC_CALENDAR_ID: 'public#calendar' }[key]) : undefined } as ConfigService);

describe('Public Google calendar source', () => {
    beforeEach(() => get.mockReset());
    it('reports missing configuration without fetching', async () => {
        await expect(service(false).list(from, to)).resolves.toEqual({ configured: false, events: [] });
        expect(get).not.toHaveBeenCalled();
    });
    it('validates date bounds before fetching', async () => {
        await expect(service().list(to, from)).rejects.toThrow();
        await expect(service().list(from, '2029-01-01')).rejects.toThrow();
        expect(get).not.toHaveBeenCalled();
    });
    it('paginates and preserves exclusive all-day dates; ignores cancelled entries', async () => {
        get.mockResolvedValueOnce({ data: { items: [{ id: 'a', summary: 'Holiday', start: { date: '2026-09-02' }, end: { date: '2026-09-03' } }], nextPageToken: 'next' } });
        get.mockResolvedValueOnce({ data: { items: [{ id: 'b', status: 'cancelled' }] } });
        await expect(service().list(from, to)).resolves.toEqual({ configured: true, events: [{ id: 'a', title: 'Holiday', startAt: '2026-09-02', endAt: '2026-09-03', allDay: true }] });
        expect(get.mock.calls[1][1].params.pageToken).toBe('next');
        expect(get.mock.calls[0][0]).toContain('public%23calendar');
    });
    it('returns a sanitized failure, not partial data or credentials', async () => {
        get.mockRejectedValue(new Error('secret'));
        await expect(service().list(from, to)).rejects.toMatchObject({ response: { code: 'CALENDAR_SOURCE_UNAVAILABLE' } });
    });
});
