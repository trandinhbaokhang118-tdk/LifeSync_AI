import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StartTrackingDto } from './dto/start-tracking.dto';
import { UpdateLocationDto } from './dto/update-location.dto';

type LatLng = { lat: number; lng: number };

const MIN_TRACK_POINT_DISTANCE_KM = 0.012;
const MAX_TRACK_ACCURACY_METERS = 120;

@Injectable()
export class GpsService {
  constructor(private prisma: PrismaService) { }

  async startTracking(userId: string, dto: StartTrackingDto) {
    // Check premium access
    const hasAccess = await this.checkPremiumAccess(userId);
    if (!hasAccess) {
      throw new ForbiddenException('GPS tracking requires Plus subscription');
    }

    const activeSession = await this.prisma.exercise.findFirst({
      where: {
        userId,
        route: { is: { duration: null } },
      },
      select: { id: true },
    });
    if (activeSession) {
      throw new ConflictException('A tracking session is already active');
    }

    // Create exercise record first. The GpsRoute row with a null `duration`
    // represents an active session; `duration` is set when tracking ends.
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

    // Persist the initial GPS route so the session survives restarts and
    // works across multiple instances (no in-memory state).
    await this.prisma.gpsRoute.create({
      data: {
        exerciseId: exercise.id,
        startLat: dto.latitude,
        startLng: dto.longitude,
        endLat: dto.latitude,
        endLng: dto.longitude,
        totalDistance: 0,
        polyline: null,
      },
    });

    return {
      sessionId: exercise.id,
      status: 'started',
      startLocation: { lat: dto.latitude, lng: dto.longitude },
    };
  }

  /**
   * Loads an active session (exercise + its route) for the given user, or
   * throws. A session is "active" while its route has a null `duration`.
   */
  private async loadActiveSession(userId: string, sessionId: string) {
    const exercise = await this.prisma.exercise.findFirst({
      where: { id: sessionId, userId },
      include: { route: true },
    });

    if (!exercise) {
      // Either the session does not exist or it belongs to someone else.
      const exists = await this.prisma.exercise.findUnique({ where: { id: sessionId } });
      if (exists) {
        throw new ForbiddenException('Access denied');
      }
      throw new NotFoundException('No active tracking session found');
    }

    if (!exercise.route) {
      throw new NotFoundException('No active tracking session found');
    }

    return exercise;
  }

  async updateLocation(userId: string, sessionId: string, dto: UpdateLocationDto) {
    const exercise = await this.loadActiveSession(userId, sessionId);
    const route = exercise.route!;

    if (route.duration !== null) {
      throw new ConflictException('Tracking session has already ended');
    }

    const locations = route.polyline ? this.decodePolyline(route.polyline) : [];
    const candidate = { lat: dto.latitude, lng: dto.longitude };
    const previousLocation = locations[locations.length - 1] ?? { lat: route.startLat, lng: route.startLng };
    const distanceFromPrevious = this.calculateDistance(
      previousLocation.lat,
      previousLocation.lng,
      candidate.lat,
      candidate.lng,
    );
    const accuracyFloorKm = Math.min((dto.accuracy ?? 0) / 1000, 0.04);
    const minimumDistanceKm = Math.max(MIN_TRACK_POINT_DISTANCE_KM, accuracyFloorKm * 0.5);

    if ((dto.accuracy && dto.accuracy > MAX_TRACK_ACCURACY_METERS) || distanceFromPrevious < minimumDistanceKm) {
      return {
        sessionId,
        status: 'tracking',
        ignored: true,
        reason: 'stationary-or-low-accuracy',
        locationCount: locations.length,
        totalDistance: Math.round(route.totalDistance * 100) / 100,
      };
    }

    const nextLocations = locations.length > 0 ? [...locations, candidate] : [previousLocation, candidate];

    const totalDistance = this.totalDistance(nextLocations);
    const lastLocation = nextLocations[nextLocations.length - 1];

    await this.prisma.gpsRoute.update({
      where: { exerciseId: sessionId },
      data: {
        endLat: lastLocation.lat,
        endLng: lastLocation.lng,
        totalDistance,
        polyline: this.encodePolyline(nextLocations),
      },
    });

    return {
      sessionId,
      status: 'tracking',
      locationCount: nextLocations.length,
      totalDistance: Math.round(totalDistance * 100) / 100,
    };
  }

  async endTracking(userId: string, sessionId: string) {
    const exercise = await this.loadActiveSession(userId, sessionId);
    const route = exercise.route!;

    if (route.duration !== null) {
      throw new ConflictException('Tracking session has already ended');
    }

    const startTime = exercise.createdAt;
    const endTime = new Date();
    const durationSeconds = Math.max(0, Math.floor((endTime.getTime() - startTime.getTime()) / 1000));
    const durationMinutes = Math.floor(durationSeconds / 60);

    const locations = route.polyline ? this.decodePolyline(route.polyline) : [];
    const totalDistance = this.totalDistance(locations);

    // Average pace (min/km)
    const avgPace = totalDistance > 0 ? durationMinutes / totalDistance : 0;

    // Calories (rough estimate: ~60 cal/km for running)
    const caloriesBurned = Math.round(totalDistance * 60);

    await this.prisma.exercise.update({
      where: { id: sessionId },
      data: {
        duration: durationMinutes,
        distance: totalDistance,
        caloriesBurned,
        avgPace: Math.round(avgPace * 10) / 10,
        performedAt: startTime,
      },
    });

    // Setting duration marks the session as ended.
    await this.prisma.gpsRoute.update({
      where: { exerciseId: sessionId },
      data: { duration: durationSeconds },
    });

    const firstLocation = locations[0] ?? { lat: route.startLat, lng: route.startLng };
    const lastLocation = locations[locations.length - 1] ?? { lat: route.endLat, lng: route.endLng };

    return {
      sessionId,
      status: 'completed',
      summary: {
        duration: durationMinutes,
        distance: Math.round(totalDistance * 100) / 100,
        caloriesBurned,
        avgPace: Math.round(avgPace * 10) / 10,
        startLocation: { lat: firstLocation.lat, lng: firstLocation.lng },
        endLocation: { lat: lastLocation.lat, lng: lastLocation.lng },
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

    const hasEligibleStatus = subscription?.status === 'ACTIVE' || subscription?.status === 'TRIALING';
    const isExpired = subscription?.currentPeriodEnd
      ? subscription.currentPeriodEnd.getTime() <= Date.now()
      : true;

    if (!subscription || !hasEligibleStatus || isExpired) {
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

  // Sums the haversine distance (km) across an ordered list of points.
  private totalDistance(locations: LatLng[]): number {
    let total = 0;
    for (let i = 1; i < locations.length; i++) {
      total += this.calculateDistance(
        locations[i - 1].lat,
        locations[i - 1].lng,
        locations[i].lat,
        locations[i].lng,
      );
    }
    return total;
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
