import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

interface HealthResponse {
    ok: true;
    status: 'ok';
    service: string;
    timestamp: string;
    uptimeSeconds: number;
}

@ApiTags('Health')
@Controller('health')
export class HealthController {
    @Get()
    @ApiOperation({ summary: 'Health check endpoint' })
    @ApiResponse({ status: 200, description: 'Service is healthy' })
    check(): HealthResponse {
        return {
            ok: true,
            status: 'ok',
            service: 'time-manager-backend',
            timestamp: new Date().toISOString(),
            uptimeSeconds: Math.floor(process.uptime()),
        };
    }
}
