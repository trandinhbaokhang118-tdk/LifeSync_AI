import { AIChatService } from './ai-chat.service';
import axios from 'axios';
function setup(tier = 'FREE') {
    const db = {
        subscription: { findUnique: jest.fn().mockResolvedValue({ tier, status: 'ACTIVE', currentPeriodEnd: new Date(Date.now() + 86400000) }) },
        chatConversation: { create: jest.fn().mockResolvedValue({ id: 'c1' }), update: jest.fn() },
        chatMessage: { findMany: jest.fn().mockResolvedValue([]), create: jest.fn().mockResolvedValue({ id: 'm1', createdAt: new Date() }) },
    };
    const tasks = { context: jest.fn().mockResolvedValue({ recentTasks: [], recentProjects: [] }), retrieveRelevant: jest.fn().mockResolvedValue({ tasks: [], projects: [] }), lookup: jest.fn().mockResolvedValue({ items: [{ id: 'old-task', title: 'Báo cáo' }], total: 1 }), execute: jest.fn() };
    const service = new AIChatService(db as never, { get: jest.fn() } as never, tasks as never);
    const call = jest.spyOn(service as unknown as { callOpenAI: (...args: unknown[]) => Promise<string> }, 'callOpenAI');
    return { db, tasks, service, call };
}
describe('AI task conversations', () => {
    it('uses Gemini generateContent when Gemini is the configured provider', async () => {
        const db = { subscription: { findUnique: jest.fn() } };
        const config = {
            get: jest.fn((key: string) => ({
                AI_PROVIDER: 'gemini',
                GEMINI_API_KEY: 'test-gemini-key',
                GEMINI_MODEL: 'gemini-2.5-flash',
            }[key])),
        };
        const tasks = {};
        const service = new AIChatService(db as never, config as never, tasks as never);
        const post = jest.spyOn(axios, 'post').mockResolvedValue({
            data: { candidates: [{ content: { parts: [{ text: '{"message":"Chào bạn","actions":[]}' }] } }] },
        } as never);

        const response = await (service as unknown as { callOpenAI: (system: string, message: string) => Promise<string> })
            .callOpenAI('Hệ thống', 'Xin chào');

        expect(service.getProviderStatus()).toEqual({ configured: true, mode: 'cloud' });
        expect(response).toContain('Chào bạn');
        expect(post).toHaveBeenCalledWith(
            'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
            expect.objectContaining({
                systemInstruction: { parts: [{ text: 'Hệ thống' }] },
                contents: [{ role: 'user', parts: [{ text: 'Xin chào' }] }],
            }),
            expect.objectContaining({ headers: expect.objectContaining({ 'x-goog-api-key': 'test-gemini-key' }) }),
        );
        post.mockRestore();
    });

    it.each([{ tier: 'FREE', messages: 12 }, { tier: 'PRO', messages: 40 }, { tier: 'PLUS', messages: 40 }])('preserves $tier conversation allowance', async plan => {
        const { db, tasks, service, call } = setup(plan.tier);
        call.mockResolvedValue('{"message":"Bạn muốn lên lịch công việc nào?", "actions":[]}');
        await service.processMessage('u1', { message: 'Giúp tôi lên lịch', timeZone: 'Asia/Ho_Chi_Minh' });
        expect(db.chatMessage.findMany).toHaveBeenCalledWith(expect.objectContaining({ take: plan.messages }));
        expect(tasks.context).toHaveBeenCalledWith('u1', 'Asia/Ho_Chi_Minh');
        expect(tasks.retrieveRelevant).toHaveBeenCalledWith('u1', 'Giúp tôi lên lịch');
        expect(tasks.execute).not.toHaveBeenCalled();
    });
    it('looks up older tasks before answering', async () => {
        const { tasks, service, call } = setup();
        call.mockResolvedValueOnce('{"message":"", "actions":[{"type":"find_tasks","data":{"search":"Báo cáo"}}]}').mockResolvedValueOnce('{"message":"Bạn có công việc Báo cáo.", "actions":[]}');
        const result = await service.processMessage('u1', { message: 'Task báo cáo cũ thế nào?' });
        expect(tasks.lookup).toHaveBeenCalledWith('u1', { type: 'find_tasks', data: { search: 'Báo cáo' } });
        expect(call.mock.calls[1][0]).toContain('old-task');
        expect(result.message).toBe('Bạn có công việc Báo cáo.');
        expect(tasks.execute).not.toHaveBeenCalled();
    });
    it('replaces optimistic model claims with actual results', async () => {
        const { tasks, service, call } = setup();
        call.mockResolvedValue('{"message":"Đã tạo thành công", "actions":[{"type":"create_task","data":{"title":"Báo cáo"}}]}');
        tasks.execute.mockResolvedValue({ message: 'Không thể hoàn tất: thiếu thời gian' });
        const result = await service.processMessage('u1', { message: 'Tạo task báo cáo' });
        expect(result.message).toContain('thiếu thời gian');
        expect(result.actions).toEqual([]);
    });
    it('preserves saved action IDs for follow-up references', async () => {
        const { db, service, call } = setup();
        db.chatMessage.findMany.mockResolvedValue([{ role: 'ASSISTANT', content: 'Đã tạo báo cáo', actions: [{ type: 'create_task', status: 'completed', data: { taskId: 'saved-task-id' } }] }]);
        call.mockResolvedValue('{"message":"Bạn muốn đổi sang mấy giờ?", "actions":[]}');
        await service.processMessage('u1', { message: 'Đổi giờ task đó' });
        expect(JSON.stringify(call.mock.calls[0][2])).toContain('saved-task-id');
    });
    it('persists and returns only successfully executed actions', async () => {
        const { db, tasks, service, call } = setup();
        const action = { type: 'create_task', status: 'completed', data: { taskId: 'saved-task-id' } };
        call.mockResolvedValue('{"message":"Đang tạo", "actions":[{"type":"create_task","data":{"title":"Báo cáo"}}]}');
        tasks.execute.mockResolvedValue({ action, message: 'Đã tạo công việc Báo cáo.' });
        const result = await service.processMessage('u1', { message: 'Tạo báo cáo lúc 9h đến 10h mai' });
        expect(result.actions).toEqual([action]);
        expect(db.chatMessage.create).toHaveBeenLastCalledWith({ data: expect.objectContaining({ role: 'ASSISTANT', actions: [action], content: 'Đã tạo công việc Báo cáo.' }) });
    });
    it('retains project lookup results while retrieving its tasks', async () => {
        const { tasks, service, call } = setup();
        tasks.lookup.mockResolvedValueOnce({ items: [{ id: 'project-one', title: 'Website' }], total: 1 })
            .mockResolvedValueOnce({ items: [{ id: 'task-one', title: 'Thiết kế' }], total: 1 });
        call.mockResolvedValueOnce('{"message":"", "actions":[{"type":"find_projects","data":{"search":"Website"}}]}')
            .mockResolvedValueOnce('{"message":"", "actions":[{"type":"find_tasks","data":{"projectId":"project-one"}}]}')
            .mockResolvedValueOnce('{"message":"Website có công việc Thiết kế.", "actions":[]}');
        await service.processMessage('u1', { message: 'Các task của dự án Website?' });
        expect(call.mock.calls[2][0]).toContain('Website');
        expect(call.mock.calls[2][0]).toContain('Thiết kế');
    });
    it('bounds repeated lookups and refuses mixed read/write output', async () => {
        const { tasks, service, call } = setup();
        call.mockResolvedValue('{"message":"", "actions":[{"type":"find_tasks","data":{}}]}');
        const reply = await service.processMessage('u1', { message: 'Tìm công việc' });
        expect(call).toHaveBeenCalledTimes(5);
        expect(reply.message).toContain('Phạm vi tra cứu');
        call.mockResolvedValue('{"message":"", "actions":[{"type":"find_tasks","data":{}},{"type":"create_task","data":{}}]}');
        await service.processMessage('u1', { message: 'Tạo công việc' });
        expect(tasks.execute).not.toHaveBeenCalled();
    });
});
