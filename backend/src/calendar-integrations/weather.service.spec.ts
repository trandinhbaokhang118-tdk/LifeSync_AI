import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { WeatherService } from './weather.service';
import { WeatherLocationDto } from './weather.controller';
jest.mock('axios');
const get = axios.get as jest.Mock;
const service = (values: Record<string, string> = {}) => new WeatherService({ get: (key: string) => values[key] } as ConfigService);
describe('Weather integration', () => {
    beforeEach(() => jest.resetAllMocks());
    it('does not call free APIs unless explicitly configured for noncommercial use', async () => {
        expect(service().status()).toEqual({ configured: false });
        await expect(service().forecast(10, 106)).rejects.toMatchObject({ response: { code: 'WEATHER_NOT_CONFIGURED' } });
        expect(get).not.toHaveBeenCalled();
    });
    it('keeps commercial credentials on the server and uses fixed customer hosts', async () => {
        get.mockResolvedValue({ data: { hourly: {} } });
        const weather = service({ OPEN_METEO_API_KEY: 'private-key' });
        await weather.forecast(10, 106);
        expect(get.mock.calls[0][0]).toBe('https://customer-api.open-meteo.com/v1/forecast');
        expect(get.mock.calls[0][1].params.apikey).toBe('private-key');
        await weather.search('Hanoi');
        expect(get.mock.calls[1][0]).toBe('https://customer-geocoding-api.open-meteo.com/v1/search');
    });
    it('sanitizes failures and validates coordinates', async () => {
        get.mockRejectedValue(new Error('private-key'));
        await expect(service({ WEATHER_NON_COMMERCIAL: 'true' }).forecast(10, 106)).rejects.toMatchObject({ response: { code: 'WEATHER_UNAVAILABLE' } });
        expect(await validate(plainToInstance(WeatherLocationDto, { latitude: '91', longitude: '200' }))).toHaveLength(2);
        expect(await validate(plainToInstance(WeatherLocationDto, { latitude: '10.7', longitude: '106.7' }))).toHaveLength(0);
    });
});
