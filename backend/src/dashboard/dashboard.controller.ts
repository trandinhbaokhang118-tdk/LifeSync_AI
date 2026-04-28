import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, CurrentUserData } from '../common/decorators/current-user.decorator';

@ApiTags('Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('USER')
@Controller('dashboard')
export class DashboardController {
    constructor(private dashboardService: DashboardService) { }

    @Get('stats')
    @ApiOperation({ summary: 'Get dashboard statistics' })
    @ApiResponse({ status: 200, description: 'Dashboard statistics' })
    getStats(@CurrentUser() user: CurrentUserData) {
        return this.dashboardService.getStats(user.id);
    }

    @Get('focus-time')
    @ApiOperation({ summary: 'Get weekly focus time' })
    @ApiResponse({ status: 200, description: 'Focus time statistics' })
    getFocusTime(@CurrentUser() user: CurrentUserData) {
        return this.dashboardService.getFocusTime(user.id);
    }
}
