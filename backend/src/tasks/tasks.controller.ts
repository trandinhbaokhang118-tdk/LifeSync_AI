import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { QueryTaskDto } from './dto/query-task.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, CurrentUserData } from '../common/decorators/current-user.decorator';

@ApiTags('Tasks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('USER')
@Controller('tasks')
export class TasksController {
    constructor(private tasksService: TasksService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new task' })
    @ApiResponse({ status: 201, description: 'Task created successfully' })
    create(@CurrentUser() user: CurrentUserData, @Body() createTaskDto: CreateTaskDto) {
        return this.tasksService.create(user.id, createTaskDto);
    }

    @Get()
    @ApiOperation({ summary: 'Get all tasks with filtering and pagination' })
    @ApiResponse({ status: 200, description: 'List of tasks' })
    findAll(@CurrentUser() user: CurrentUserData, @Query() query: QueryTaskDto) {
        return this.tasksService.findAll(user.id, query);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a task by ID' })
    @ApiResponse({ status: 200, description: 'Task details' })
    @ApiResponse({ status: 404, description: 'Task not found' })
    findOne(@Param('id') id: string, @CurrentUser() user: CurrentUserData) {
        return this.tasksService.findOne(id, user.id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update a task' })
    @ApiResponse({ status: 200, description: 'Task updated successfully' })
    @ApiResponse({ status: 404, description: 'Task not found' })
    update(
        @Param('id') id: string,
        @CurrentUser() user: CurrentUserData,
        @Body() updateTaskDto: UpdateTaskDto,
    ) {
        return this.tasksService.update(id, user.id, updateTaskDto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a task' })
    @ApiResponse({ status: 200, description: 'Task deleted successfully' })
    @ApiResponse({ status: 404, description: 'Task not found' })
    remove(@Param('id') id: string, @CurrentUser() user: CurrentUserData) {
        return this.tasksService.remove(id, user.id);
    }

    @Post(':id/tags')
    @ApiOperation({ summary: 'Add tags to a task' })
    @ApiResponse({ status: 200, description: 'Tags added successfully' })
    addTags(
        @Param('id') id: string,
        @CurrentUser() user: CurrentUserData,
        @Body() body: { tagIds: string[] },
    ) {
        return this.tasksService.addTags(id, user.id, body.tagIds);
    }

    @Delete(':id/tags/:tagId')
    @ApiOperation({ summary: 'Remove a tag from a task' })
    @ApiResponse({ status: 200, description: 'Tag removed successfully' })
    removeTag(
        @Param('id') id: string,
        @Param('tagId') tagId: string,
        @CurrentUser() user: CurrentUserData,
    ) {
        return this.tasksService.removeTag(id, tagId, user.id);
    }
}
