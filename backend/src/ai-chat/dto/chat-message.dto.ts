import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';

export interface ChatContextMessage {
    role: string;
    content: string;
}

export interface ChatAction {
    type: 'create_task' | 'update_task' | 'schedule' | 'reminder';
    data: Record<string, unknown>;
}

export class ChatMessageDto {
    @IsString()
    @IsNotEmpty()
    message: string;

    @IsArray()
    @IsOptional()
    context?: ChatContextMessage[];
}

export class ChatResponseDto {
    message: string;
    suggestions?: string[];
    actions?: ChatAction[];
}
