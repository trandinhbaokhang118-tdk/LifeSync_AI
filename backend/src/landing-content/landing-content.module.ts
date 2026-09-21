import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminSessionGuard } from '../auth/guards/admin-session.guard';
import { PublicLandingController, LandingEditorController } from './landing-content.controller';
@Module({
  imports: [PrismaModule],
  controllers: [PublicLandingController, LandingEditorController],
  providers: [AdminSessionGuard],
})
export class LandingContentModule {}
