import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class WeatherService {
    constructor(private config: ConfigService) {}
    status() { return { configured: !!this.config.get('OPEN_METEO_API_KEY') || this.config.get('WEATHER_NON_COMMERCIAL') === 'true' }; }
    private async fetch(kind: 'forecast' | 'search', params: Record<string, string | number>) {
        if (!this.status().configured) throw new ServiceUnavailableException({ code: 'WEATHER_NOT_CONFIGURED', message: 'Nguồn thời tiết chưa được quản trị viên cấu hình.' });
        const apikey = this.config.get<string>('OPEN_METEO_API_KEY');
        const host = `${apikey ? 'customer-' : ''}${kind === 'search' ? 'geocoding-api' : 'api'}.open-meteo.com`;
        try {
            const response = await axios.get(`https://${host}/v1/${kind}`, { params: { ...params, ...(apikey ? { apikey } : {}) }, timeout: 10000 });
            return response.data;
        } catch {
            throw new ServiceUnavailableException({ code: 'WEATHER_UNAVAILABLE', message: 'Không tải được thời tiết. Vui lòng thử lại.' });
        }
    }
    search(name: string) { return this.fetch('search', { name, count: 6, language: 'vi', format: 'json' }); }
    forecast(latitude: number, longitude: number) {
        return this.fetch('forecast', { latitude, longitude, timezone: 'auto', forecast_days: 7, hourly: 'temperature_2m,precipitation_probability,weather_code,wind_speed_10m' });
    }
}
