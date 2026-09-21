import { AdminService } from './admin.service';
import { PrismaService } from '../prisma/prisma.service';

describe('Operations statistics', () => {
  afterEach(() => jest.useRealTimers());
  it('splits scheduled blocks at Vietnamese midnight and keeps workout and daily activity measures separate', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-09-21T04:00:00Z'));
    const prisma = {
      dailyActivity: { findMany: jest.fn().mockResolvedValue([{ date: new Date('2026-09-20T17:00:00Z'), steps: 120, activeMinutes: 7, calories: 20 }]) },
      exercise: { findMany: jest.fn().mockResolvedValue([{ performedAt: new Date('2026-09-21T01:00:00Z') }]) },
      fitnessProfile: { count: jest.fn().mockResolvedValue(2) },
      timeBlock: { findMany: jest.fn().mockResolvedValue([{ startAt: new Date('2026-09-20T16:30:00Z'), endAt: new Date('2026-09-20T17:30:00Z') }]) },
    };
    const result = await new AdminService(prisma as unknown as PrismaService).getOperationsStats();
    expect(result.points).toHaveLength(14);
    expect(result.points[12].plannedMinutes).toBe(30);
    expect(result.points[13]).toMatchObject({ plannedMinutes: 30, activeMinutes: 7, workouts: 1, steps: 120 });
    expect(result.plannedMinutes).toBe(60);
    expect(result.connectedDevices).toBe(2);
    expect(prisma.exercise.findMany.mock.calls[0][0].where.performedAt.lte).toEqual(new Date());
  });
});
