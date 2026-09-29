import { SubscriptionStatus, SubscriptionTier } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { FitnessService } from './fitness.service';

describe('FitnessService premium access', () => {
  const findUnique = jest.fn();
  const findMany = jest.fn();
  const prisma = {
    subscription: { findUnique },
    dailyActivity: { findMany },
  } as unknown as PrismaService;
  const service = new FitnessService(prisma);

  beforeEach(() => {
    findUnique.mockReset();
    findMany.mockReset();
  });

  it('grants premium access during an unexpired PLUS trial', async () => {
    findUnique.mockResolvedValue({
      tier: SubscriptionTier.PLUS,
      status: SubscriptionStatus.TRIALING,
      currentPeriodEnd: new Date(Date.now() + 60_000),
    });

    await expect(service.checkPremiumFeature('user-id', 'gps-tracking')).resolves.toBe(true);
  });

  it('rejects an expired active subscription', async () => {
    findUnique.mockResolvedValue({
      tier: SubscriptionTier.PLUS,
      status: SubscriptionStatus.ACTIVE,
      currentPeriodEnd: new Date(Date.now() - 60_000),
    });

    await expect(service.checkPremiumFeature('user-id', 'gps-tracking')).resolves.toBe(false);
  });

  it('rejects a feature that is not assigned to the subscription tier', async () => {
    findUnique.mockResolvedValue({
      tier: SubscriptionTier.PRO,
      status: SubscriptionStatus.ACTIVE,
      currentPeriodEnd: new Date(Date.now() + 60_000),
    });

    await expect(service.checkPremiumFeature('user-id', 'gps-tracking')).resolves.toBe(false);
  });

  it('averages weekly heart rate only across days that have a reading', async () => {
    findMany.mockResolvedValue([
      { date: new Date(), steps: 1000, distance: 1, calories: 100, activeMinutes: 10, heartRateAvg: 60 },
      { date: new Date(), steps: 2000, distance: 2, calories: 200, activeMinutes: 20, heartRateAvg: null },
      { date: new Date(), steps: 3000, distance: 3, calories: 300, activeMinutes: 30, heartRateAvg: 80 },
    ]);

    const stats = await service.getWeeklyStats('user-id', new Date('2026-07-06T00:00:00.000Z'));

    expect(stats.avgHeartRate).toBe(70);
  });
});


describe('workout writes enforce subscription access', () => {
  const dto = { name: 'Run', category: 'running', duration: 30 };
  function setup(tier: string, expired = false) {
    const db = { subscription: { findUnique: jest.fn().mockResolvedValue({ tier, status: 'ACTIVE', currentPeriodEnd: new Date(Date.now() + (expired ? -1 : 1) * 86400000) }) }, exercise: { create: jest.fn().mockResolvedValue({ id: 'e1' }) } };
    return { db, service: new FitnessService(db as never) };
  }
  it('persists a Pro manual workout for its authenticated owner', async () => {
    const { service, db } = setup('PRO');
    await expect(service.createExercise('u1', dto)).resolves.toEqual({ id: 'e1' });
    expect(db.exercise.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ userId: 'u1', duration: 30 }) }));
  });
  it.each([['FREE', false], ['PRO', true]])('rejects unavailable access: %s, expired=%s', async (tier, expired) => {
    const { service, db } = setup(tier as string, expired as boolean);
    await expect(service.createExercise('u1', dto)).rejects.toThrow();
    expect(db.exercise.create).not.toHaveBeenCalled();
  });
  it('does not let Pro bypass Plus GPS access through exercise creation', async () => {
    await expect(setup('PRO').service.createExercise('u1', { ...dto, route: { startLat: 1, startLng: 1, endLat: 2, endLng: 2, totalDistance: 1, duration: 60 } })).rejects.toThrow('Plus');
  });
});
