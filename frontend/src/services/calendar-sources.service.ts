import api from './api';
import type { ApiResponse } from '../types';

interface PublicCalendarResult {
    configured: boolean;
    events: { id: string; title: string; startAt: string; endAt: string; allDay: boolean }[];
}

export const calendarSourcesService = {
    async getPublicEvents(startDate: string, endDate: string): Promise<PublicCalendarResult> {
        const response = await api.get<ApiResponse<PublicCalendarResult>>('/calendar-sources/google-public', { params: { startDate, endDate } });
        return response.data.data;
    },
};
