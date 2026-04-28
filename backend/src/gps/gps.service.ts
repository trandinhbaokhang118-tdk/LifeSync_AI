import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StartTrackingDto } from './dto/start-tracking.dto';
import { UpdateLocationDto } from './dto/update-location.dto';

interface TrackingSession {
  id: string;
  startLat: number;
  startLng: number;
  locations: Array<{ lat: number; lng: number; timestamp: Date }>;
  startTime: Date;
  isActive: boolean;
}

// In-memory storage for active tracking sessions (use Redis in production)
const activeSessions: Map<string, TrackingSession> = new Map();

@Injectable()
export class GpsService {
  constructor(private prisma: PrismaService) {}

  async startTracking(userId: string, dto: StartTrackingDto) {
    // Check premium access
    const hasAccess = await this.checkPremiumAccess(userId);
    if (!hasAccess) {
      throw new ForbiddenException('GPS tracking requires Plus subscription');
    }

    // Create exercise record first
    const exercise = await this.prisma.exercise.create({
      data: {
        userId,
        name: this.buildExerciseTitle(dto.activityType),
        category: dto.category || dto.activityType || 'cardio',
        subCategory: dto.activityType,
        duration: 0,
        distance: 0,
        intensity: dto.intensity || 'moderate',
      },
    });

    // Store session in memory
    const session: TrackingSession = {
      id: exercise.id,
      startLat: dto.latitude,
      startLng: dto.longitude,
      locations: [{ lat: dto.latitude, lng: dto.longitude, timestamp: new Date() }],
      startTime: new Date(),
      isActive: true,
    };

    activeSessions.set(exercise.id, session);

    // Create initial GPS route
    await this.prisma.gpsRoute.create({
      data: {
        exerciseId: exercise.id,
        startLat: dto.latitude,
        startLng: dto.longitude,
        endLat: dto.latitude,
        endLng: dto.longitude,
        totalDistance: 0,
      },
    });

    return {
      sessionId: exercise.id,
      status: 'started',
      startLocation: { lat: dto.latitude, lng: dto.longitude },
    };
  }

  async updateLocation(userId: string, sessionId: string, dto: UpdateLocationDto) {
    const session = activeSessions.get(sessionId);

    if (!session || !session.isActive) {
      throw new NotFoundException('No active tracking session found');
    }

    // Verify ownership
    const exercise = await this.prisma.exercise.findFirst({
      where: { id: sessionId, userId },
    });

    if (!exercise) {
      throw new ForbiddenException('Access denied');
    }

    // Add new location
    session.locations.push({
      lat: dto.latitude,
      lng: dto.longitude,
      timestamp: new Date(dto.timestamp || Date.now()),
    });

    // Calculate total distance
    let totalDistance = 0;
    for (let i = 1; i < session.locations.length; i++) {
      totalDistance += this.calculateDistance(
        session.locations[i - 1].lat,
        session.locations[i - 1].lng,
        session.locations[i].lat,
        session.locations[i].lng,
      );
    }

    // Update GPS route
    const lastLocation = session.locations[session.locations.length - 1];
    await this.prisma.gpsRoute.update({
      where: { exerciseId: sessionId },
      data: {
        endLat: lastLocation.lat,
        endLng: lastLocation.lng,
        totalDistance,
        polyline: this.encodePolyline(session.locations),
      },
    });

    return {
      sessionId,
      status: 'tracking',
      locationCount: session.locations.length,
      totalDistance: Math.round(totalDistance * 100) / 100,
    };
  }

  async endTracking(userId: string, sessionId: string) {
    const session = activeSessions.get(sessionId);

    if (!session) {
      throw new NotFoundException('No active tracking session found');
    }

    // Verify ownership
    const exercise = await this.prisma.exercise.findFirst({
      where: { id: sessionId, userId },
    });

    if (!exercise) {
      throw new ForbiddenException('Access denied');
    }

    // Mark session as inactive
    session.isActive = false;

    // Calculate final stats
    const endTime = new Date();
    const durationSeconds = Math.floor((endTime.getTime() - session.startTime.getTime()) / 1000);
    const durationMinutes = Math.floor(durationSeconds / 60);

    let totalDistance = 0;
    for (let i = 1; i < session.locations.length; i++) {
      totalDistance += this.calculateDistance(
        session.locations[i - 1].lat,
        session.locations[i - 1].lng,
        session.locations[i].lat,
        session.locations[i].lng,
      );
    }

    // Calculate average pace (min/km)
    const avgPace = totalDistance > 0 ? durationMinutes / totalDistance : 0;

    // Calculate calories (rough estimate: ~60 cal/km for running)
    const caloriesBurned = Math.round(totalDistance * 60);

    // Update exercise record
    await this.prisma.exercise.update({
      where: { id: sessionId },
      data: {
        duration: durationMinutes,
        distance: totalDistance,
        caloriesBurned,
        avgPace: Math.round(avgPace * 10) / 10,
        performedAt: session.startTime,
      },
    });

    // Update GPS route with duration
    await this.prisma.gpsRoute.update({
      where: { exerciseId: sessionId },
      data: { duration: durationSeconds },
    });

    // Clean up session
    activeSessions.delete(sessionId);

    return {
      sessionId,
      status: 'completed',
      summary: {
        duration: durationMinutes,
        distance: Math.round(totalDistance * 100) / 100,
        caloriesBurned,
        avgPace: Math.round(avgPace * 10) / 10,
        startLocation: { lat: session.startLat, lng: session.startLng },
        endLocation: {
          lat: session.locations[session.locations.length - 1].lat,
          lng: session.locations[session.locations.length - 1].lng,
        },
      },
    };
  }

  async getRoutes(userId: string, limit = 20) {
    const exercises = await this.prisma.exercise.findMany({
      where: {
        userId,
        route: { isNot: null },
      },
      include: { route: true },
      orderBy: { performedAt: 'desc' },
      take: limit,
    });

    return exercises
      .filter((exercise) => exercise.route)
      .map((exercise) => ({
        id: exercise.route!.id,
        exerciseId: exercise.id,
        name: exercise.name,
        category: exercise.category,
        distance: exercise.distance,
        caloriesBurned: exercise.caloriesBurned,
        performedAt: exercise.performedAt,
        polyline: exercise.route!.polyline,
        startLat: exercise.route!.startLat,
        startLng: exercise.route!.startLng,
        endLat: exercise.route!.endLat,
        endLng: exercise.route!.endLng,
        totalDistance: exercise.route!.totalDistance,
        elevationGain: exercise.route!.elevationGain,
        duration: exercise.route!.duration ?? exercise.duration * 60,
        path: exercise.route!.polyline ? this.decodePolyline(exercise.route!.polyline) : [],
      }));
  }

  async getRoute(userId: string, routeId: string) {
    const exercise = await this.prisma.exercise.findFirst({
      where: {
        userId,
        OR: [
          { id: routeId },
          { route: { is: { id: routeId } } },
        ],
      },
      include: { route: true },
    });

    if (!exercise || !exercise.route) {
      throw new NotFoundException('Route not found');
    }

    // Decode polyline if exists
    let path: Array<{ lat: number; lng: number }> = [];
    if (exercise.route?.polyline) {
      path = this.decodePolyline(exercise.route.polyline);
    }

    return {
      id: exercise.route.id,
      exerciseId: exercise.id,
      name: exercise.name,
      category: exercise.category,
      distance: exercise.distance,
      caloriesBurned: exercise.caloriesBurned,
      performedAt: exercise.performedAt,
      polyline: exercise.route.polyline,
      startLat: exercise.route.startLat,
      startLng: exercise.route.startLng,
      endLat: exercise.route.endLat,
      endLng: exercise.route.endLng,
      totalDistance: exercise.route.totalDistance,
      elevationGain: exercise.route.elevationGain,
      duration: exercise.route.duration ?? exercise.duration * 60,
      path,
      avgPace: exercise.avgPace,
    };
  }

  private async checkPremiumAccess(userId: string): Promise<boolean> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription || subscription.status !== 'ACTIVE') {
      return false;
    }

    return subscription.tier === 'PLUS';
  }

  private buildExerciseTitle(activityType?: string): string {
    if (!activityType) {
      return 'Outdoor Activity';
    }

    const normalized = activityType.trim().toLowerCase();
    const label = normalized.charAt(0).toUpperCase() + normalized.slice(1);
    return `${label} Track Lab Session`;
  }

  // Haversine formula for distance calculation (km)
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  // Polyline encoding (simplified)
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
    let v = value < 0 ? ~(value << 1) : value << 1;
    let result = '';
    while (v >= 0x20) {
      result += String.fromCharCode((0x20 | (v & 0x1f)) + 63);
      v >>= 5;
    }
    result += String.fromCharCode(v + 63);
    return result;
  }

  private decodePolyline(encoded: string): Array<{ lat: number; lng: number }> {
    const points: Array<{ lat: number; lng: number }> = [];
    let index = 0;
    let lat = 0;
    let lng = 0;

    while (index < encoded.length) {
      let shift = 0;
      let b = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        lat |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      lat = (lat & 1) ? ~(lat >> 1) : lat >> 1;

      shift = 0;
      b = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        lng |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      lng = (lng & 1) ? ~(lng >> 1) : lng >> 1;

      points.push({
        lat: lat / 1e5,
        lng: lng / 1e5,
      });
    }

    return points;
  }
}
