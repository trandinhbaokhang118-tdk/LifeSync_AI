import api from './api';
import type {
    ApiResponse,
    DailyActivity,
    Exercise,
    ExerciseRoutePayload,
    FitnessProfile,
    HealthProvider,
    WeeklyStats,
} from '../types';

export const fitnessService = {
    // Profile
    async getProfile(): Promise<FitnessProfile> {
        const response = await api.get<ApiResponse<FitnessProfile>>('/fitness/profile');
        return response.data.data;
    },

    async updateProfile(data: Partial<FitnessProfile>): Promise<FitnessProfile> {
        const response = await api.put<ApiResponse<FitnessProfile>>('/fitness/profile', data);
        return response.data.data;
    },

    async connectHealthDevice(provider: HealthProvider): Promise<FitnessProfile> {
        const response = await api.post<ApiResponse<FitnessProfile>>('/fitness/profile/connect', { provider });
        return response.data.data;
    },

    // Exercises
    async createExercise(data: Omit<Partial<Exercise>, 'route'> & { route?: ExerciseRoutePayload }): Promise<Exercise> {
        const response = await api.post<ApiResponse<Exercise>>('/fitness/exercises', data);
        return response.data.data;
    },

    async getExercises(params?: { startDate?: string; endDate?: string; category?: string }): Promise<Exercise[]> {
        const response = await api.get<ApiResponse<Exercise[]>>('/fitness/exercises', { params });
        return response.data.data;
    },

    async getExercise(id: string): Promise<Exercise> {
        const response = await api.get<ApiResponse<Exercise>>(`/fitness/exercises/${id}`);
        return response.data.data;
    },

    async deleteExercise(id: string): Promise<void> {
        await api.delete(`/fitness/exercises/${id}`);
    },

    // Daily Activities
    async syncActivity(data: {
        date: string;
        steps?: number;
        distance?: number;
        calories?: number;
        activeMinutes?: number;
        sleepMinutes?: number;
        heartRateAvg?: number;
        source?: string;
    }): Promise<DailyActivity> {
        const response = await api.post<ApiResponse<DailyActivity>>('/fitness/activity/sync', data);
        return response.data.data;
    },

    async getDailyActivity(date?: string): Promise<DailyActivity> {
        const response = await api.get<ApiResponse<DailyActivity>>('/fitness/activity/daily', {
            params: date ? { date } : {},
        });
        return response.data.data;
    },

    async getWeeklyStats(startDate?: string): Promise<WeeklyStats> {
        const response = await api.get<ApiResponse<WeeklyStats>>('/fitness/activity/weekly', {
            params: startDate ? { startDate } : {},
        });
        return response.data.data;
    },

    // Premium Check
    async checkPremiumFeature(feature: string): Promise<{ feature: string; hasAccess: boolean }> {
        const response = await api.get<ApiResponse<{ feature: string; hasAccess: boolean }>>(`/fitness/premium-check/${feature}`);
        return response.data.data;
    },
};
