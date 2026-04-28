import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, SubscriptionStatus, SubscriptionTier } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateFitnessProfileDto } from './dto/update-fitness-profile.dto';
import { CreateExerciseDto } from './dto/create-exercise.dto';
import { SyncDailyActivityDto } from './dto/sync-daily-activity.dto';

@Injectable()
export class FitnessService {
  constructor(private prisma: PrismaService) {}

  // ============ Fitness Profile ============

  async getProfile(userId: string) {
    let profile = await this.prisma.fitnessProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      // Create default profile
      profile = await this.prisma.fitnessProfile.create({
        data: { userId },
      });
    }

    return profile;
  }

  async updateProfile(userId: string, dto: UpdateFitnessProfileDto) {
    return this.prisma.fitnessProfile.upsert({
      where: { userId },
      create: { ...dto, userId },
      update: dto,
    });
  }

  async connectHealthDevice(userId: string, _provider: 'apple_health' | 'google_fit') {
    return this.prisma.fitnessProfile.upsert({
      where: { userId },
      create: {
        userId,
        healthConnect: true,
      },
      update: { healthConnect: true },
    });
  }

  // ============ Exercises ============

  async createExercise(userId: string, dto: CreateExerciseDto) {
    return this.prisma.exercise.create({
      data: {
        userId,
        name: dto.name,
        category: dto.category,
        subCategory: dto.subCategory,
        duration: dto.duration,
        distance: dto.distance,
        steps: dto.steps,
        caloriesBurned: dto.caloriesBurned,
        avgHeartRate: dto.avgHeartRate,
        avgPace: dto.avgPace,
        intensity: dto.intensity || 'moderate',
        notes: dto.notes,
        performedAt: dto.performedAt ? new Date(dto.performedAt) : new Date(),
        route: dto.route
          ? {
              create: {
                startLat: dto.route.startLat,
                startLng: dto.route.startLng,
                endLat: dto.route.endLat,
                endLng: dto.route.endLng,
                totalDistance: dto.route.totalDistance,
                elevationGain: dto.route.elevationGain,
                duration: dto.route.duration,
                polyline:
                  dto.route.path && dto.route.path.length > 1
                    ? this.encodePolyline(dto.route.path)
                    : undefined,
              },
            }
          : undefined,
      },
      include: { route: true },
    });
  }

  async getExercises(userId: string, startDate?: Date, endDate?: Date, category?: string) {
    const where: Prisma.ExerciseWhereInput = { userId };

    if (startDate || endDate) {
      where.performedAt = {};
      if (startDate) where.performedAt.gte = startDate;
      if (endDate) where.performedAt.lte = endDate;
    }

    if (category) {
      where.category = category;
    }

    return this.prisma.exercise.findMany({
      where,
      orderBy: { performedAt: 'desc' },
      take: 100,
    });
  }

  async getExercise(userId: string, exerciseId: string) {
    const exercise = await this.prisma.exercise.findFirst({
      where: { id: exerciseId, userId },
      include: { route: true },
    });

    if (!exercise) {
      throw new NotFoundException('Exercise not found');
    }

    return exercise;
  }

  async deleteExercise(userId: string, exerciseId: string) {
    const exercise = await this.prisma.exercise.findFirst({
      where: { id: exerciseId, userId },
    });

    if (!exercise) {
      throw new NotFoundException('Exercise not found');
    }

    return this.prisma.exercise.delete({
      where: { id: exerciseId },
    });
  }

  // ============ Daily Activities ============

  async syncDailyActivity(userId: string, dto: SyncDailyActivityDto) {
    const date = new Date(dto.date);
    date.setHours(0, 0, 0, 0);

    return this.prisma.dailyActivity.upsert({
      where: {
        userId_date: {
          userId,
          date,
        },
      },
      create: {
        userId,
        date,
        steps: dto.steps || 0,
        distance: dto.distance || 0,
        calories: dto.calories || 0,
        activeMinutes: dto.activeMinutes || 0,
        sleepMinutes: dto.sleepMinutes,
        heartRateAvg: dto.heartRateAvg,
        source: dto.source,
        syncedAt: new Date(),
      },
      update: {
        steps: dto.steps,
        distance: dto.distance,
        calories: dto.calories,
        activeMinutes: dto.activeMinutes,
        sleepMinutes: dto.sleepMinutes,
        heartRateAvg: dto.heartRateAvg,
        source: dto.source,
        syncedAt: new Date(),
      },
    });
  }

  async getDailyActivity(userId: string, date: Date) {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    let activity = await this.prisma.dailyActivity.findUnique({
      where: {
        userId_date: {
          userId,
          date: targetDate,
        },
      },
    });

    if (!activity) {
      activity = {
        id: '',
        userId,
        date: targetDate,
        steps: 0,
        distance: 0,
        calories: 0,
        activeMinutes: 0,
        sleepMinutes: null,
        heartRateAvg: null,
        syncedAt: null,
        source: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    return activity;
  }

  async getWeeklyStats(userId: string, startDate: Date) {
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 7);

    const activities = await this.prisma.dailyActivity.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lt: endDate,
        },
      },
      orderBy: { date: 'asc' },
    });

    const stats = {
      totalSteps: 0,
      totalDistance: 0,
      totalCalories: 0,
      totalActiveMinutes: 0,
      avgHeartRate: 0,
      days: activities.map((a) => ({
        date: a.date,
        steps: a.steps,
        distance: a.distance,
        calories: a.calories,
        activeMinutes: a.activeMinutes,
      })),
    };

    activities.forEach((a) => {
      stats.totalSteps += a.steps;
      stats.totalDistance += a.distance;
      stats.totalCalories += a.calories;
      stats.totalActiveMinutes += a.activeMinutes;
      if (a.heartRateAvg) {
        stats.avgHeartRate += a.heartRateAvg;
      }
    });

    if (activities.length > 0) {
      stats.avgHeartRate = Math.round(stats.avgHeartRate / activities.length);
    }

    return stats;
  }

  // ============ Premium Check ============

  async checkPremiumFeature(userId: string, feature: string): Promise<boolean> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription || subscription.status !== SubscriptionStatus.ACTIVE) {
      return false;
    }

    // Define feature requirements
    const featureTiers: Record<string, SubscriptionTier[]> = {
      'fitness-basic': [SubscriptionTier.PRO, SubscriptionTier.PLUS],
      'fitness-full': [SubscriptionTier.PLUS],
      'gps-tracking': [SubscriptionTier.PLUS],
      'health-connect': [SubscriptionTier.PLUS],
      'data-export': [SubscriptionTier.PLUS],
    };

    const requiredTiers = featureTiers[feature] || [];
    return requiredTiers.includes(subscription.tier);
  }

  private encodePolyline(points: Array<{ lat: number; lng: number }>): string {
    let result = '';
    let prevLat = 0;
    let prevLng = 0;

    for (const point of points) {
      const lat = Math.round(point.lat * 1e5);
      const lng = Math.round(point.lng * 1e5);
      result += this.encodeValue(lat - prevLat) + this.encodeValue(lng - prevLng);
      prevLat = lat;
      prevLng = lng;
    }

    return result;
  }

  private encodeValue(value: number): string {
    let current = value < 0 ? ~(value << 1) : value << 1;
    let result = '';

    while (current >= 0x20) {
      result += String.fromCharCode((0x20 | (current & 0x1f)) + 63);
      current >>= 5;
    }

    result += String.fromCharCode(current + 63);
    return result;
  }
}
