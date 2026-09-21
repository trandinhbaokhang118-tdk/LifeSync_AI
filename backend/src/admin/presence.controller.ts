import { Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AdminService } from './admin.service';
@Controller('presence')
@UseGuards(JwtAuthGuard)
export class PresenceController {
  constructor(private readonly admin: AdminService) {}
  @Post('heartbeat')
  async heartbeat(@CurrentUser('id') userId: string) {
    return this.admin.recordPresence(userId);
  }
}
