import api from './api';
import type { ApiResponse } from '../types';

export interface ChatContextMessage {
    role: string;
    content: string;
}

export interface ChatAction {
    type: 'create_task' | 'update_task' | 'schedule' | 'reminder';
    data: Record<string, unknown>;
}

export interface ChatMessage {
    message: string;
    context?: ChatContextMessage[];
}

export interface ChatResponse {
    message: string;
    suggestions?: string[];
    actions?: ChatAction[];
}

class AIChatService {
    async sendMessage(data: ChatMessage): Promise<ChatResponse> {
        const response = await api.post<ApiResponse<ChatResponse>>('/ai-chat/message', data);
        return response.data.data;
    }

    async getSuggestions(): Promise<{ suggestions: string[] }> {
        const response = await api.post<ApiResponse<{ suggestions: string[] }>>('/ai-chat/suggestions', {});
        return response.data.data;
    }
}

export const aiChatService = new AIChatService();
