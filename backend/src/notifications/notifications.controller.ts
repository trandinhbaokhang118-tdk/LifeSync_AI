import { Controller, Get, Patch, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, CurrentUserData } from '../common/decorators/current-user.decorator';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('USER')
@Controller('notifications')
export class NotificationsController {
    constructor(private notificationsService: NotificationsService) { }

    @Get()
    @ApiOperation({ summary: 'Get all notifications with pagination' })
    @ApiResponse({ status: 200, description: 'List of notifications' })
    findAll(@CurrentUser() user: CurrentUserData, @Query() query: PaginationDto) {
        return this.notificationsService.findAll(user.id, query);
    }

    @Get('unread-count')
    @ApiOperation({ summary: 'Get unread notification count' })
    @ApiResponse({ status: 200, description: 'Unread count' })
    getUnreadCount(@CurrentUser() user: CurrentUserData) {
        return this.notificationsService.getUnreadCount(user.id);
    }

    @Patch(':id/read')
    @ApiOperation({ summary: 'Mark notification as read' })
    @ApiResponse({ status: 200, description: 'Notification marked as read' })
    markAsRead(@Param('id') id: string, @CurrentUser() user: CurrentUserData) {
        return this.notificationsService.markAsRead(id, user.id);
    }

    @Patch('read-all')
    @ApiOperation({ summary: 'Mark all notifications as read' })
    @ApiResponse({ status: 200, description: 'All notifications marked as read' })
    markAllAsRead(@CurrentUser() user: CurrentUserData) {
        return this.notificationsService.markAllAsRead(user.id);
    }
}
