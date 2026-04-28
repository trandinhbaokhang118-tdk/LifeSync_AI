import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { GpsService } from './gps.service';
import { StartTrackingDto } from './dto/start-tracking.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, CurrentUserData } from '../common/decorators/current-user.decorator';

@ApiTags('gps')
@Controller('gps')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('USER')
export class GpsController {
  constructor(private readonly gpsService: GpsService) {}

  @Post('track/start')
  @ApiOperation({ summary: 'Start GPS tracking session' })
  async startTracking(@CurrentUser() user: CurrentUserData, @Body() dto: StartTrackingDto) {
    return this.gpsService.startTracking(user.id, dto);
  }

  @Put('track/:id/location')
  @ApiOperation({ summary: 'Update GPS location' })
  async updateLocation(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @Body() dto: UpdateLocationDto,
  ) {
    return this.gpsService.updateLocation(user.id, id, dto);
  }

  @Post('track/:id/end')
  @ApiOperation({ summary: 'End GPS tracking session' })
  async endTracking(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
    return this.gpsService.endTracking(user.id, id);
  }

  @Get('routes')
  @ApiOperation({ summary: 'Get GPS route history' })
  async getRoutes(@CurrentUser() user: CurrentUserData, @Query('limit') limit?: number) {
    return this.gpsService.getRoutes(user.id, limit);
  }

  @Get('routes/:id')
  @ApiOperation({ summary: 'Get GPS route details' })
  async getRoute(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
    return this.gpsService.getRoute(user.id, id);
  }
}
