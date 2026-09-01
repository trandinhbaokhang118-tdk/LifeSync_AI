import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AIChatService } from './ai-chat.service';
import { ImageGenerationService } from './image-generation.service';
import { AIChatController } from './ai-chat.controller';
import { aiLimiter } from '../common/middleware/rate-limit.middleware';

@Module({
    imports: [PrismaModule],
    controllers: [AIChatController],
    providers: [AIChatService, ImageGenerationService],
    exports: [AIChatService, ImageGenerationService],
})
export class AIChatModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(aiLimiter).forRoutes(
            { path: 'ai-chat/message', method: RequestMethod.POST },
            { path: 'ai-chat/image', method: RequestMethod.POST },
        );
    }
}
