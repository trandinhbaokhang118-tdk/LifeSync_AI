import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminSessionGuard } from '../auth/guards/admin-session.guard';
import { PresenceController } from './presence.controller';

@Module({
    imports: [PrismaModule],
    controllers: [AdminController, PresenceController],
    providers: [AdminService, AdminSessionGuard],
})
export class AdminModule { }
