import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AdminSessionGuard } from '../auth/guards/admin-session.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AdminService } from './admin.service';
import { UpdateAdminUserDto } from './dto/update-admin-user.dto';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, AdminSessionGuard, RolesGuard)
@ApiBearerAuth()
export class AdminController {
    constructor(private adminService: AdminService) { }

    @Get('stats')
    @Roles('ADMIN', 'MODERATOR')
    @ApiOperation({ summary: 'Get system statistics' })
    async getStats() {
        return this.adminService.getSystemStats();
    }

    @Get('users')
    @Roles('ADMIN', 'MODERATOR')
    @ApiOperation({ summary: 'Get all users' })
    async getAllUsers() {
        return this.adminService.getAllUsers();
    }

    @Patch('users/:id')
    @Roles('ADMIN')
    @ApiOperation({ summary: 'Update user account' })
    async updateUser(@Param('id') id: string, @Body() body: UpdateAdminUserDto) {
        return this.adminService.updateUser(id, body);
    }

    @Patch('users/:id/role')
    @Roles('ADMIN')
    @ApiOperation({ summary: 'Update user role' })
    async updateUserRole(
        @Param('id') id: string,
        @Body() body: { role: string },
        @CurrentUser('id') actingAdminId: string,
    ) {
        return this.adminService.updateUserRole(id, body.role, actingAdminId);
    }

    @Delete('users/:id')
    @Roles('ADMIN')
    @ApiOperation({ summary: 'Delete user' })
    async deleteUser(@Param('id') id: string, @CurrentUser('id') actingAdminId: string) {
        return this.adminService.deleteUser(id, actingAdminId);
    }

    @Get('activity-logs')
    @Roles('ADMIN', 'MODERATOR')
    @ApiOperation({ summary: 'Get activity logs' })
    async getActivityLogs() {
        return this.adminService.getActivityLogs();
    }

    @Post('backup')
    @Roles('ADMIN')
    @ApiOperation({ summary: 'Create database backup' })
    async createBackup() {
        return this.adminService.createBackup();
    }
}
