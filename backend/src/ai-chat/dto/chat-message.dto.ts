import { IsNotEmpty, IsOptional, IsString, IsUUID, Length, MaxLength } from 'class-validator';

export interface ChatAction {
    type: 'create_task' | 'update_task' | 'schedule' | 'reminder';
    data: Record<string, unknown>;
}

export class ChatMessageDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(2000)
    message: string;

    @IsUUID()
    @IsOptional()
    conversationId?: string;
}

export class ChatResponseDto {
    conversationId: string;
    userMessageId: string;
    assistantMessageId: string;
    message: string;
    createdAt: Date;
    suggestions?: string[];
    actions?: ChatAction[];
}

export class ConversationIdDto {
    @IsUUID()
    id: string;
}

export class GenerateImageDto {
    @IsString()
    @IsNotEmpty()
    @Length(3, 1000)
    prompt: string;
}

export class GenerateImageResponseDto {
    dataUrl: string;
    mimeType: string;
}
