import { ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GpsService } from './gps.service';

describe('GpsService premium access', () => {
  const findSubscription = jest.fn();
  const findExercise = jest.fn();
  const createExercise = jest.fn();
  const createRoute = jest.fn();
  const prisma = {
    subscription: { findUnique: findSubscription },
    exercise: { findFirst: findExercise, create: createExercise },
    gpsRoute: { create: createRoute },
  } as unknown as PrismaService;
  const service = new GpsService(prisma);
  const startDto = {
    latitude: 10.7769,
    longitude: 106.7009,
    activityType: 'running',
  };

  beforeEach(() => {
    findSubscription.mockReset();
    findExercise.mockReset();
    createExercise.mockReset();
    createRoute.mockReset();
    createExercise.mockResolvedValue({ id: 'exercise-id' });
    findExercise.mockResolvedValue(null);
    createRoute.mockResolvedValue({ id: 'route-id' });
  });

  it('allows GPS tracking during an unexpired PLUS trial', async () => {
    findSubscription.mockResolvedValue({
      tier: 'PLUS',
      status: 'TRIALING',
      currentPeriodEnd: new Date(Date.now() + 60_000),
    });

    await expect(service.startTracking('user-id', startDto)).resolves.toMatchObject({
      sessionId: 'exercise-id',
      status: 'started',
    });
  });

  it('rejects GPS tracking after the subscription expires', async () => {
    findSubscription.mockResolvedValue({
      tier: 'PLUS',
      status: 'ACTIVE',
      currentPeriodEnd: new Date(Date.now() - 60_000),
    });

    await expect(service.startTracking('user-id', startDto)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects a second tracking session while one is active', async () => {
    findSubscription.mockResolvedValue({
      tier: 'PLUS',
      status: 'ACTIVE',
      currentPeriodEnd: new Date(Date.now() + 60_000),
    });
    findExercise.mockResolvedValue({ id: 'active-session' });

    await expect(service.startTracking('user-id', startDto)).rejects.toThrow(
      'A tracking session is already active',
    );
    expect(createExercise).not.toHaveBeenCalled();
  });
});
