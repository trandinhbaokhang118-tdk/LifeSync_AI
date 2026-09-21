import { AdminService } from './admin.service';
import { PrismaService } from '../prisma/prisma.service';

describe('Monthly admin KPIs', () => {
  afterEach(() => jest.useRealTimers());
  function fixture(counts: number[], revenues: number[], present: { userId: string }[] = []) {
    const count = jest.fn();
    counts.forEach(value => count.mockResolvedValueOnce(value));
    const aggregate = jest.fn();
    revenues.forEach(value => aggregate.mockResolvedValueOnce({ _sum: { amountVND: value } }));
    const findMany = jest.fn().mockResolvedValue(present);
    const service = new AdminService({ user: { count }, paymentOrder: { aggregate }, userPresence: { findMany } } as unknown as PrismaService);
    return { service, count, aggregate, findMany };
  }
  it('compares Vietnam month-to-date with the previous month and excludes staff', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-09-22T04:30:00Z'));
    const f = fixture([100, 80, 20, 25, 12], [150000, 100000], [{ userId: 'customer' }]);
    const data = await f.service.getMonthlyKpis();
    expect(data.revenue.growth).toBe(50);
    expect(data.customers.growth).toBe(25);
    expect(data.registrations.growth).toBe(-20);
    expect(data).toMatchObject({ online: 12, inactive: 88, onlineShare: 12, registrationShare: 20 });
    expect(f.aggregate.mock.calls[0][0].where).toEqual({ status: 'PAID', paidAt: { gte: new Date('2026-08-31T17:00:00Z'), lte: new Date() } });
    expect(f.aggregate.mock.calls[1][0].where.paidAt).toEqual({ gte: new Date('2026-07-31T17:00:00Z'), lte: new Date('2026-08-22T04:30:00Z') });
    for (const [args] of f.count.mock.calls) expect(args.where.role).toBe('USER');
    expect(f.findMany.mock.calls[0][0].where.seenAt.gte).toEqual(new Date('2026-09-22T04:28:00Z'));
  });
  it('clamps comparison dates to February and does not fabricate percentages from zero', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-03-31T04:30:00Z'));
    const f = fixture([10, 0, 10, 0], [100, 0]);
    const data = await f.service.getMonthlyKpis();
    expect(f.aggregate.mock.calls[1][0].where.paidAt.lte).toEqual(new Date('2026-02-28T04:30:00Z'));
    expect(data.revenue.growth).toBeNull();
    expect(data.customers.growth).toBeNull();
    expect(data).toMatchObject({ online: 0, inactive: 10 });
  });
  it('handles an empty system and the January year boundary', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2025-12-31T18:00:00Z'));
    const f = fixture([0, 0, 0, 0], [0, 0]);
    const data = await f.service.getMonthlyKpis();
    expect(data).toMatchObject({ year: 2026, month: 1, onlineShare: 0, registrationShare: 0, inactive: 0 });
    expect(data.revenue.growth).toBe(0);
    expect(f.aggregate.mock.calls[1][0].where.paidAt.gte).toEqual(new Date('2025-11-30T17:00:00Z'));
  });
});
