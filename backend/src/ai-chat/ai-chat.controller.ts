import { Controller, Post, Get, Body, UseGuards, Param, Delete } from '@nestjs/common';
import { AIChatService } from './ai-chat.service';
import { ImageGenerationService } from './image-generation.service';
import {
    ChatMessageDto,
    ChatResponseDto,
    GenerateImageDto,
    GenerateImageResponseDto,
    ConversationIdDto,
} from './dto/chat-message.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, CurrentUserData } from '../common/decorators/current-user.decorator';

@Controller('ai-chat')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('USER')
export class AIChatController {
    constructor(
        private readonly aiChatService: AIChatService,
        private readonly imageService: ImageGenerationService,
    ) { }

    @Post('message')
    async sendMessage(
        @CurrentUser() user: CurrentUserData,
        @Body() chatMessageDto: ChatMessageDto,
    ): Promise<ChatResponseDto> {
        return this.aiChatService.processMessage(user.id, chatMessageDto);
    }

    @Get('status')
    async status() {
        return this.aiChatService.getProviderStatus();
    }

    @Get('conversations')
    async conversations(@CurrentUser() user: CurrentUserData) {
        return this.aiChatService.listConversations(user.id);
    }

    @Get('conversations/:id/messages')
    async messages(
        @CurrentUser() user: CurrentUserData,
        @Param() params: ConversationIdDto,
    ) {
        return this.aiChatService.getConversationMessages(user.id, params.id);
    }

    @Delete('conversations/:id')
    async deleteConversation(
        @CurrentUser() user: CurrentUserData,
        @Param() params: ConversationIdDto,
    ) {
        return this.aiChatService.deleteConversation(user.id, params.id);
    }

    @Post('suggestions')
    async getSuggestions(@CurrentUser() user: CurrentUserData): Promise<{ suggestions: string[] }> {
        return this.aiChatService.getQuickSuggestions(user.id);
    }

    @Get('image/status')
    async imageStatus(): Promise<{ enabled: boolean }> {
        return { enabled: this.imageService.isEnabled() };
    }

    @Post('image')
    async generateImage(@Body() dto: GenerateImageDto): Promise<GenerateImageResponseDto> {
        const image = await this.imageService.generateImage(dto.prompt);
        return { dataUrl: image.dataUrl, mimeType: image.mimeType };
    }
}
