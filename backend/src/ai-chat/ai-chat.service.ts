import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { ChatAction, ChatContextMessage, ChatMessageDto, ChatResponseDto } from './dto/chat-message.dto';
import axios, { AxiosError } from 'axios';

interface TaskPromptItem {
    title: string;
    status: string;
    priority: string;
}

@Injectable()
export class AIChatService {
    private readonly logger = new Logger(AIChatService.name);
    private readonly openaiApiKey: string;
    private readonly openaiModel: string = 'gpt-3.5-turbo';

    constructor(
        private readonly prisma: PrismaService,
        private readonly configService: ConfigService,
    ) {
        this.openaiApiKey = this.configService.get<string>('OPENAI_API_KEY') || '';
    }

    async processMessage(userId: string, dto: ChatMessageDto): Promise<ChatResponseDto> {
        try {
            // Lấy context về tasks của user
            const userTasks = await this.prisma.task.findMany({
                where: { userId },
                take: 10,
                orderBy: { createdAt: 'desc' },
                include: { tags: { include: { tag: true } } },
            });

            // Tạo system prompt
            const systemPrompt = this.buildSystemPrompt(userTasks);

            // Gọi OpenAI API
            const response = await this.callOpenAI(systemPrompt, dto.message, dto.context);

            // Parse response và tạo actions nếu cần
            const actions = this.extractActions(response);

            return {
                message: response,
                suggestions: this.generateSuggestions(response),
                actions,
            };
        } catch (error) {
            this.logger.error('Error processing chat message:', error);
            return {
                message: 'Xin lỗi, tôi gặp sự cố khi xử lý tin nhắn của bạn. Vui lòng thử lại.',
                suggestions: ['Tạo task mới', 'Xem lịch hôm nay', 'Thống kê công việc'],
            };
        }
    }

    private buildSystemPrompt(tasks: TaskPromptItem[]): string {
        const tasksSummary = tasks.map(t =>
            `- ${t.title} (${t.status}, priority: ${t.priority})`
        ).join('\n');

        return `Bạn là trợ lý AI thông minh cho ứng dụng quản lý thời gian Time Manager.

Khả năng của bạn:
1. Trả lời MỌI câu hỏi của người dùng (toán học, kiến thức chung, lập trình, v.v.) như ChatGPT
2. Giúp người dùng quản lý công việc, lịch trình
3. Đề xuất cách tối ưu thời gian
4. Tạo, cập nhật, xóa tasks khi được yêu cầu
5. Phân tích năng suất và đưa ra lời khuyên

Thông tin tasks hiện tại của user:
${tasksSummary || 'Chưa có task nào'}

Quy tắc:
- Trả lời ngắn gọn, thân thiện bằng tiếng Việt
- Có thể trả lời BẤT KỲ câu hỏi nào (không chỉ về quản lý thời gian)
- Khi user muốn tạo task, trả về format: [ACTION:CREATE_TASK] {title, description, priority, dueAt}
- Khi user muốn cập nhật task, trả về: [ACTION:UPDATE_TASK] {taskId, updates}
- Luôn đề xuất 2-3 actions tiếp theo khi liên quan đến task management`;
    }

    private async callOpenAI(
        systemPrompt: string,
        userMessage: string,
        context?: ChatContextMessage[],
    ): Promise<string> {
        if (!this.openaiApiKey) {
            return this.getFallbackResponse(userMessage);
        }

        try {
            const messages = [
                { role: 'system', content: systemPrompt },
                ...(context || []),
                { role: 'user', content: userMessage },
            ];

            // Detect if using OpenRouter (sk-or-v1-...) or OpenAI (sk-...)
            const isOpenRouter = this.openaiApiKey.startsWith('sk-or-');
            const apiUrl = isOpenRouter
                ? 'https://openrouter.ai/api/v1/chat/completions'
                : 'https://api.openai.com/v1/chat/completions';

            const model = isOpenRouter ? 'openai/gpt-3.5-turbo' : this.openaiModel;

            const headers: Record<string, string> = {
                'Authorization': `Bearer ${this.openaiApiKey}`,
                'Content-Type': 'application/json',
            };

            // OpenRouter requires additional headers
            if (isOpenRouter) {
                headers['HTTP-Referer'] = 'http://localhost:5173';
                headers['X-Title'] = 'Time Manager AI';
            }

            this.logger.log(`Calling ${isOpenRouter ? 'OpenRouter' : 'OpenAI'} API with model: ${model}`);

            const response = await axios.post(
                apiUrl,
                {
                    model,
                    messages,
                    temperature: 0.7,
                    max_tokens: 500,
                },
                { headers }
            );

            return response.data.choices[0].message.content;
        } catch (error) {
            const axiosError = error as AxiosError;
            this.logger.error(`OpenAI API error: ${axiosError.message}`);
            if (axiosError.response) {
                this.logger.error(`Response status: ${axiosError.response.status}`);
            }
            return this.getFallbackResponse(userMessage);
        }
    }

    private getFallbackResponse(message: string): string {
        const lowerMsg = message.toLowerCase();

        if (lowerMsg.includes('tạo') || lowerMsg.includes('thêm')) {
            return 'Tôi có thể giúp bạn tạo task mới. Hãy cho tôi biết: tiêu đề, mô tả, độ ưu tiên và thời hạn nhé!';
        }
        if (lowerMsg.includes('hôm nay') || lowerMsg.includes('today')) {
            return 'Để xem công việc hôm nay, bạn có thể vào trang Dashboard hoặc Tasks. Tôi có thể giúp bạn lọc tasks theo ngày!';
        }
        if (lowerMsg.includes('thống kê') || lowerMsg.includes('báo cáo')) {
            return 'Bạn có thể xem thống kê chi tiết tại trang Analytics. Tôi có thể phân tích năng suất của bạn!';
        }

        return 'Xin chào! Tôi là trợ lý AI của Time Manager. Tôi có thể giúp bạn:\n- Tạo và quản lý tasks\n- Lên lịch công việc\n- Phân tích năng suất\n- Đề xuất tối ưu thời gian\n\nBạn cần tôi giúp gì?';
    }

    private extractActions(response: string): ChatAction[] {
        const actions: ChatAction[] = [];

        // Extract CREATE_TASK action
        const createMatch = response.match(/\[ACTION:CREATE_TASK\]\s*({[^}]+})/);
        if (createMatch) {
            try {
                const data = JSON.parse(createMatch[1]);
                actions.push({ type: 'create_task', data });
            } catch {
                this.logger.warn('Failed to parse CREATE_TASK action');
            }
        }

        // Extract UPDATE_TASK action
        const updateMatch = response.match(/\[ACTION:UPDATE_TASK\]\s*({[^}]+})/);
        if (updateMatch) {
            try {
                const data = JSON.parse(updateMatch[1]);
                actions.push({ type: 'update_task', data });
            } catch {
                this.logger.warn('Failed to parse UPDATE_TASK action');
            }
        }

        return actions;
    }

    private generateSuggestions(response: string): string[] {
        const suggestions = [
            'Tạo task mới',
            'Xem lịch hôm nay',
            'Thống kê công việc',
        ];

        if (response.includes('task') || response.includes('công việc')) {
            suggestions.unshift('Xem tất cả tasks');
        }
        if (response.includes('lịch') || response.includes('schedule')) {
            suggestions.unshift('Mở calendar');
        }

        return suggestions.slice(0, 3);
    }

    async getQuickSuggestions(userId: string): Promise<{ suggestions: string[] }> {
        const now = new Date();
        const todayStart = new Date(now.setHours(0, 0, 0, 0));
        const todayEnd = new Date(now.setHours(23, 59, 59, 999));

        const todayTasks = await this.prisma.task.count({
            where: {
                userId,
                startAt: { gte: todayStart, lte: todayEnd },
            },
        });

        const suggestions = [
            todayTasks > 0 ? `Bạn có ${todayTasks} task hôm nay` : 'Tạo task cho hôm nay',
            'Lên lịch tuần này',
            'Xem thống kê năng suất',
            'Tối ưu thời gian bằng AI',
        ];

        return { suggestions };
    }
}
