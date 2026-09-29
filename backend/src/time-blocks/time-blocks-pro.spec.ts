import { TimeBlocksService } from './time-blocks.service';

describe('time block plan allowance', () => {
  const dto = { title: 'Work', startAt: '2026-10-01T18:00:00Z', endAt: '2026-10-01T19:00:00Z' };
  function setup(tier = 'FREE', count = 5, expired = false) {
    const db = {
      $queryRaw: jest.fn().mockResolvedValue([{ id: 'u1' }]),
      subscription: { findUnique: jest.fn().mockResolvedValue({ tier, status: 'ACTIVE', currentPeriodEnd: new Date(Date.now() + (expired ? -1 : 1) * 86400000) }) },
      timeBlock: { findFirst: jest.fn().mockResolvedValue(null), findUnique: jest.fn().mockResolvedValue({ id: 'b1', userId: 'u1', startAt: new Date(dto.startAt), endAt: new Date(dto.endAt) }), count: jest.fn().mockResolvedValue(count), create: jest.fn().mockResolvedValue({ id: 'b1' }), update: jest.fn().mockResolvedValue({ id: 'b1' }) },
      task: { findFirst: jest.fn().mockResolvedValue(null) },
      $transaction: jest.fn(),
    };
    db.$transaction.mockImplementation(callback => callback(db));
    const service = new TimeBlocksService(db as never, { assertAvailable: jest.fn() } as never);
    return { service, db };
  }
  it('rejects the sixth Free block without writing', async () => {
    const { service, db } = setup();
    await expect(service.create('u1', dto)).rejects.toMatchObject({ response: { code: 'TIME_BLOCK_FREE_LIMIT' } });
    expect(db.timeBlock.create).not.toHaveBeenCalled();
    expect(db.$queryRaw).toHaveBeenCalled();
  });
  it('counts the scheduled day in Vietnam time, scoped to the user', async () => {
    const { service, db } = setup('FREE', 4);
    await expect(service.create('u1', dto)).resolves.toEqual({ id: 'b1' });
    expect(db.timeBlock.count).toHaveBeenCalledWith({ where: { userId: 'u1', id: undefined, startAt: { gte: new Date('2026-10-01T17:00:00Z'), lt: new Date('2026-10-02T17:00:00Z') } } });
  });
  it.each(['PRO', 'PLUS'])('allows %s beyond five blocks', async tier => {
    const { service, db } = setup(tier, 100);
    await expect(service.create('u1', dto)).resolves.toEqual({ id: 'b1' });
    expect(db.timeBlock.count).not.toHaveBeenCalled();
  });
  it('denies an expired Pro subscription the unlimited allowance', async () => {
    await expect(setup('PRO', 5, true).service.create('u1', dto)).rejects.toMatchObject({ response: { code: 'TIME_BLOCK_FREE_LIMIT' } });
  });
  it('allows title edits to existing blocks after downgrade', async () => {
    await expect(setup().service.update('b1', 'u1', { title: 'Updated' })).resolves.toEqual({ id: 'b1' });
  });
  it('checks the destination day when moving a Free block', async () => {
    const { service, db } = setup();
    await expect(service.update('b1', 'u1', { startAt: '2026-10-03T02:00:00Z', endAt: '2026-10-03T03:00:00Z' })).rejects.toMatchObject({ response: { code: 'TIME_BLOCK_FREE_LIMIT' } });
    expect(db.timeBlock.update).not.toHaveBeenCalled();
  });
});
