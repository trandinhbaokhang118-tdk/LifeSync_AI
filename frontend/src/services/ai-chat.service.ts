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
    conversationId?: string;
}

export interface ChatResponse {
    conversationId: string;
    userMessageId: string;
    assistantMessageId: string;
    message: string;
    createdAt: string;
    suggestions?: string[];
    actions?: ChatAction[];
}

export interface ChatConversation {
    id: string;
    title: string;
    createdAt: string;
    updatedAt: string;
    messageCount: number;
}

export interface PersistedChatMessage {
    id: string;
    role: 'USER' | 'ASSISTANT';
    content: string;
    createdAt: string;
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

    async getStatus(): Promise<{ configured: boolean; mode: 'cloud' | 'local' | 'unavailable' }> {
        const response = await api.get<ApiResponse<{ configured: boolean; mode: 'cloud' | 'local' | 'unavailable' }>>('/ai-chat/status');
        return response.data.data;
    }

    async getConversations(): Promise<ChatConversation[]> {
        const response = await api.get<ApiResponse<{ conversations: ChatConversation[] }>>('/ai-chat/conversations');
        return response.data.data.conversations;
    }

    async getConversationMessages(conversationId: string): Promise<PersistedChatMessage[]> {
        const response = await api.get<ApiResponse<{ messages: PersistedChatMessage[] }>>(
            `/ai-chat/conversations/${conversationId}/messages`,
        );
        return response.data.data.messages;
    }

    async deleteConversation(conversationId: string): Promise<void> {
        await api.delete(`/ai-chat/conversations/${conversationId}`);
    }

    async getImageStatus(): Promise<{ enabled: boolean }> {
        const response = await api.get<ApiResponse<{ enabled: boolean }>>('/ai-chat/image/status');
        return response.data.data;
    }

    async generateImage(prompt: string): Promise<{ dataUrl: string; mimeType: string }> {
        const response = await api.post<ApiResponse<{ dataUrl: string; mimeType: string }>>(
            '/ai-chat/image',
            { prompt },
        );
        return response.data.data;
    }
}

export const aiChatService = new AIChatService();
