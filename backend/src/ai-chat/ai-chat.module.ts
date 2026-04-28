import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AIChatService } from './ai-chat.service';
import { AIChatController } from './ai-chat.controller';

@Module({
    imports: [PrismaModule],
    controllers: [AIChatController],
    providers: [AIChatService],
    exports: [AIChatService],
})
export class AIChatModule { }
