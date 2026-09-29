import api from './api';
import type { ApiResponse } from '../types';
export interface GoogleCalendarStatus { configured: boolean; connected: boolean; needsReconnect: boolean; updatedAt: string | null }
export interface GoogleBusy { connected: boolean; busy: { startAt: string; endAt: string }[] }
const base = '/calendar-integrations/google';
export const googleCalendarService = {
    status: async () => (await api.get<ApiResponse<GoogleCalendarStatus>>(`${base}/status`)).data.data,
    connect: async () => (await api.post<ApiResponse<{ url: string }>>(`${base}/connect`)).data.data,
    complete: async (data: { code: string; state: string }) => (await api.post(`${base}/complete`, data)).data,
    disconnect: async () => (await api.delete<ApiResponse<{ revoked: boolean }>>(base)).data.data,
    busy: async (startDate: string, endDate: string) => (await api.get<ApiResponse<GoogleBusy>>(`${base}/busy`, { params: { startDate, endDate } })).data.data,
};
