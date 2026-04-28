import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { HealthController } from '../src/health/health.controller';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';

describe('Health endpoint (e2e)', () => {
    let app: INestApplication;
    let baseUrl: string;

    beforeAll(async () => {
        const moduleRef = await Test.createTestingModule({
            controllers: [HealthController],
        }).compile();

        app = moduleRef.createNestApplication();
        app.useGlobalInterceptors(new TransformInterceptor());
        await app.listen(0);

        const address = app.getHttpServer().address();
        const port = typeof address === 'string' ? 0 : address.port;
        baseUrl = `http://127.0.0.1:${port}`;
    });

    afterAll(async () => {
        await app.close();
    });

    it('returns transformed health data', async () => {
        const response = await fetch(`${baseUrl}/health`);
        const body = await response.json() as {
            data: {
                ok: boolean;
                status: string;
                service: string;
                timestamp: string;
                uptimeSeconds: number;
            };
        };

        expect(response.status).toBe(200);
        expect(body.data.ok).toBe(true);
        expect(body.data.status).toBe('ok');
        expect(body.data.service).toBe('time-manager-backend');
        expect(body.data.timestamp).toEqual(expect.any(String));
        expect(body.data.uptimeSeconds).toBeGreaterThanOrEqual(0);
    });
});
