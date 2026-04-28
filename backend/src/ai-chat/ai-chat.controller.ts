import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AIChatService } from './ai-chat.service';
import { ChatMessageDto, ChatResponseDto } from './dto/chat-message.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, CurrentUserData } from '../common/decorators/current-user.decorator';

@Controller('ai-chat')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('USER')
export class AIChatController {
    constructor(private readonly aiChatService: AIChatService) { }

    @Post('message')
    async sendMessage(
        @CurrentUser() user: CurrentUserData,
        @Body() chatMessageDto: ChatMessageDto,
    ): Promise<ChatResponseDto> {
        return this.aiChatService.processMessage(user.id, chatMessageDto);
    }

    @Post('suggestions')
    async getSuggestions(@CurrentUser() user: CurrentUserData): Promise<{ suggestions: string[] }> {
        return this.aiChatService.getQuickSuggestions(user.id);
    }
}
