import api from './api';
import type { GpsRoute, TrackingSession, ApiResponse } from '../types';

export const gpsService = {
    async startTracking(data: {
        latitude: number;
        longitude: number;
        activityType?: string;
        category?: string;
        intensity?: string;
    }): Promise<TrackingSession> {
        const response = await api.post<ApiResponse<TrackingSession>>('/gps/track/start', data);
        return response.data.data;
    },

    async updateLocation(
        sessionId: string,
        data: {
            latitude: number;
            longitude: number;
            altitude?: number;
            accuracy?: number;
            speed?: number;
            timestamp?: string;
        }
    ): Promise<TrackingSession> {
        const response = await api.put<ApiResponse<TrackingSession>>(`/gps/track/${sessionId}/location`, data);
        return response.data.data;
    },

    async endTracking(sessionId: string): Promise<TrackingSession> {
        const response = await api.post<ApiResponse<TrackingSession>>(`/gps/track/${sessionId}/end`);
        return response.data.data;
    },

    async getRoutes(limit?: number): Promise<GpsRoute[]> {
        const response = await api.get<ApiResponse<GpsRoute[]>>('/gps/routes', { params: { limit } });
        return response.data.data;
    },

    async getRoute(routeId: string): Promise<GpsRoute> {
        const response = await api.get<ApiResponse<GpsRoute>>(`/gps/routes/${routeId}`);
        return response.data.data;
    },
};
