import { Controller, Get, Put, Post, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FitnessService } from './fitness.service';
import { UpdateFitnessProfileDto } from './dto/update-fitness-profile.dto';
import { CreateExerciseDto } from './dto/create-exercise.dto';
import { SyncDailyActivityDto } from './dto/sync-daily-activity.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, CurrentUserData } from '../common/decorators/current-user.decorator';

@ApiTags('fitness')
@Controller('fitness')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('USER')
export class FitnessController {
  constructor(private readonly fitnessService: FitnessService) {}

  // ============ Profile ============

  @Get('profile')
  @ApiOperation({ summary: 'Get fitness profile' })
  async getProfile(@CurrentUser() user: CurrentUserData) {
    return this.fitnessService.getProfile(user.id);
  }

  @Put('profile')
  @ApiOperation({ summary: 'Update fitness profile' })
  async updateProfile(@CurrentUser() user: CurrentUserData, @Body() dto: UpdateFitnessProfileDto) {
    return this.fitnessService.updateProfile(user.id, dto);
  }

  @Post('profile/connect')
  @ApiOperation({ summary: 'Connect Apple Health or Google Fit' })
  async connectHealthDevice(
    @CurrentUser() user: CurrentUserData,
    @Body('provider') provider: 'apple_health' | 'google_fit',
  ) {
    return this.fitnessService.connectHealthDevice(user.id, provider);
  }

  // ============ Exercises ============

  @Post('exercises')
  @ApiOperation({ summary: 'Create exercise record' })
  async createExercise(@CurrentUser() user: CurrentUserData, @Body() dto: CreateExerciseDto) {
    return this.fitnessService.createExercise(user.id, dto);
  }

  @Get('exercises')
  @ApiOperation({ summary: 'Get exercise history' })
  async getExercises(
    @CurrentUser() user: CurrentUserData,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('category') category?: string,
  ) {
    return this.fitnessService.getExercises(
      user.id,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
      category,
    );
  }

  @Get('exercises/:id')
  @ApiOperation({ summary: 'Get exercise details' })
  async getExercise(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
    return this.fitnessService.getExercise(user.id, id);
  }

  @Delete('exercises/:id')
  @ApiOperation({ summary: 'Delete exercise' })
  async deleteExercise(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
    return this.fitnessService.deleteExercise(user.id, id);
  }

  // ============ Daily Activities ============

  @Post('activity/sync')
  @ApiOperation({ summary: 'Sync daily activity from device' })
  async syncActivity(@CurrentUser() user: CurrentUserData, @Body() dto: SyncDailyActivityDto) {
    return this.fitnessService.syncDailyActivity(user.id, dto);
  }

  @Get('activity/daily')
  @ApiOperation({ summary: 'Get daily activity' })
  async getDailyActivity(@CurrentUser() user: CurrentUserData, @Query('date') date: string) {
    return this.fitnessService.getDailyActivity(
      user.id,
      date ? new Date(date) : new Date(),
    );
  }

  @Get('activity/weekly')
  @ApiOperation({ summary: 'Get weekly activity stats' })
  async getWeeklyStats(@CurrentUser() user: CurrentUserData, @Query('startDate') startDate?: string) {
    return this.fitnessService.getWeeklyStats(
      user.id,
      startDate ? new Date(startDate) : new Date(),
    );
  }

  // ============ Premium Check ============

  @Get('premium-check/:feature')
  @ApiOperation({ summary: 'Check if user has premium feature access' })
  async checkPremiumFeature(@CurrentUser() user: CurrentUserData, @Param('feature') feature: string) {
    const hasAccess = await this.fitnessService.checkPremiumFeature(user.id, feature);
    return { feature, hasAccess };
  }
}
