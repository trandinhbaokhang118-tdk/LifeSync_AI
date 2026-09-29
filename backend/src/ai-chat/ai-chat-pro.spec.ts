import { AIChatService } from './ai-chat.service';

describe('Pro AI context', () => {
  it.each([{ tier: 'FREE', messages: 12, tasks: 10, pro: false }, { tier: 'PRO', messages: 40, tasks: 100, pro: true }, { tier: 'PLUS', messages: 40, tasks: 100, pro: true }])('uses the $tier context allowance', async plan => {
    const db = {
      subscription: { findUnique: jest.fn().mockResolvedValue({ tier: plan.tier, status: 'ACTIVE', currentPeriodEnd: new Date(Date.now() + 86400000) }) },
      chatConversation: { create: jest.fn().mockResolvedValue({ id: 'c1' }), update: jest.fn() },
      chatMessage: { findMany: jest.fn().mockResolvedValue([]), create: jest.fn().mockResolvedValue({ id: 'm1', createdAt: new Date() }) },
      task: { findMany: jest.fn().mockResolvedValue([{ id: 't1', title: 'Deadline', status: 'TODO', priority: 'HIGH', dueAt: new Date() }]) },
      timeBlock: { findMany: jest.fn().mockResolvedValue([{ title: 'Meeting', startAt: new Date(), endAt: new Date() }]) },
    };
    const service = new AIChatService(db as never, { get: jest.fn() } as never);
    const call = jest.spyOn(service as unknown as { callOpenAI: (...args: unknown[]) => Promise<string> }, 'callOpenAI').mockResolvedValue('Đây là đề xuất.');
    await service.processMessage('u1', { message: 'Giúp tôi lên lịch' });
    expect(db.chatMessage.findMany).toHaveBeenCalledWith(expect.objectContaining({ take: plan.messages }));
    expect(db.task.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: 'u1' }, take: plan.tasks }));
    if (plan.pro) {
      expect(db.timeBlock.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ userId: 'u1' }) }));
      expect(call.mock.calls[0][0]).toContain('Meeting');
    } else expect(db.timeBlock.findMany).not.toHaveBeenCalled();
  });
});
