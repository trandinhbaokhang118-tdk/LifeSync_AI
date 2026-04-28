import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RemindersService } from './reminders.service';
import { CreateReminderDto } from './dto/create-reminder.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, CurrentUserData } from '../common/decorators/current-user.decorator';

@ApiTags('Reminders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('USER')
@Controller('reminders')
export class RemindersController {
    constructor(private remindersService: RemindersService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new reminder' })
    @ApiResponse({ status: 201, description: 'Reminder created successfully' })
    create(@CurrentUser() user: CurrentUserData, @Body() createDto: CreateReminderDto) {
        return this.remindersService.create(user.id, createDto);
    }

    @Get()
    @ApiOperation({ summary: 'Get all reminders' })
    @ApiResponse({ status: 200, description: 'List of reminders' })
    findAll(@CurrentUser() user: CurrentUserData) {
        return this.remindersService.findAll(user.id);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a reminder' })
    @ApiResponse({ status: 200, description: 'Reminder deleted successfully' })
    remove(@Param('id') id: string, @CurrentUser() user: CurrentUserData) {
        return this.remindersService.remove(id, user.id);
    }
}
