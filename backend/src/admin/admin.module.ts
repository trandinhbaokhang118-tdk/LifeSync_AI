import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminSessionGuard } from '../auth/guards/admin-session.guard';

@Module({
    imports: [PrismaModule],
    controllers: [AdminController],
    providers: [AdminService, AdminSessionGuard],
})
export class AdminModule { }
