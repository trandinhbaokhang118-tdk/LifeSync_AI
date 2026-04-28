import { HealthController } from './health.controller';

describe('HealthController', () => {
    let controller: HealthController;

    beforeEach(() => {
        controller = new HealthController();
    });

    it('returns a structured health payload', () => {
        const response = controller.check();

        expect(response.ok).toBe(true);
        expect(response.status).toBe('ok');
        expect(response.service).toBe('time-manager-backend');
        expect(response.timestamp).toEqual(expect.any(String));
        expect(Number.isFinite(response.uptimeSeconds)).toBe(true);
        expect(response.uptimeSeconds).toBeGreaterThanOrEqual(0);
    });
});
