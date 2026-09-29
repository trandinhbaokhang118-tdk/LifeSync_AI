import api from './api';
import type { ApiResponse } from '../types';

export interface WeatherPlace { id: number; name: string; latitude: number; longitude: number; country?: string; admin1?: string }
export interface HourlyWeather { time: string; temperature: number; rain: number; code: number; wind: number }
interface Forecast { timezone: string; hourly: { time: string[]; temperature_2m: number[]; precipitation_probability: number[]; weather_code: number[]; wind_speed_10m: number[] } }

export const weatherService = {
    status: async () => (await api.get<ApiResponse<{ configured: boolean }>>('/calendar-integrations/weather/status')).data.data,
    async search(name: string): Promise<WeatherPlace[]> {
        const { data } = await api.get<ApiResponse<{ results?: WeatherPlace[] }>>('/calendar-integrations/weather/search', { params: { name }, timeout: 15000 });
        return data.data.results || [];
    },
    async forecast(place: Pick<WeatherPlace, 'latitude' | 'longitude'>): Promise<{ timezone: string; hours: HourlyWeather[] }> {
        const response = await api.get<ApiResponse<Forecast>>('/calendar-integrations/weather/forecast', { params: { latitude: place.latitude, longitude: place.longitude }, timeout: 15000 });
        const data = response.data.data;
        return { timezone: data.timezone, hours: data.hourly.time.map((time, i) => ({ time, temperature: data.hourly.temperature_2m[i], rain: data.hourly.precipitation_probability[i], code: data.hourly.weather_code[i], wind: data.hourly.wind_speed_10m[i] })) };
    },
};
export function weatherLabel(code: number) {
    if (code === 0) return 'Trời quang';
    if (code <= 3) return 'Có mây';
    if (code <= 48) return 'Sương mù';
    if (code <= 67) return 'Mưa';
    if (code <= 77) return 'Tuyết';
    if (code <= 82) return 'Mưa rào';
    if (code <= 86) return 'Mưa tuyết';
    return 'Dông';
}
