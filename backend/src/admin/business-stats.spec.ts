import { AdminService } from './admin.service';
import { PrismaService } from '../prisma/prisma.service';
describe('Business revenue', () => {
  afterEach(() => jest.useRealTimers());
  it('queries only paid orders within the period and groups by Vietnam payment date', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-09-21T04:00:00Z'));
    const findMany = jest.fn().mockResolvedValue([
      { amountVND: 100000, paidAt: new Date('2026-09-20T16:59:00Z') },
      { amountVND: 200000, paidAt: new Date('2026-09-20T17:00:00Z') },
    ]);
    const result = await new AdminService({ paymentOrder: { findMany } } as unknown as PrismaService).getBusinessStats();
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { status: 'PAID', paidAt: { gte: new Date('2026-08-22T17:00:00Z'), lte: new Date() } } }));
    expect(result.points).toHaveLength(30);
    expect(result.points[28].revenue).toBe(100000);
    expect(result.points[29].revenue).toBe(200000);
    expect(result.revenue).toBe(300000);
    expect(result.clicks).toBeNull();
  });
});
