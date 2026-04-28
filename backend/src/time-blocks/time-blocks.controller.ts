import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TimeBlocksService } from './time-blocks.service';
import { CreateTimeBlockDto } from './dto/create-time-block.dto';
import { UpdateTimeBlockDto } from './dto/update-time-block.dto';
import { QueryTimeBlockDto } from './dto/query-time-block.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, CurrentUserData } from '../common/decorators/current-user.decorator';

@ApiTags('Time Blocks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('USER')
@Controller('time-blocks')
export class TimeBlocksController {
    constructor(private timeBlocksService: TimeBlocksService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new time block' })
    @ApiResponse({ status: 201, description: 'Time block created successfully' })
    @ApiResponse({ status: 400, description: 'Invalid time range' })
    @ApiResponse({ status: 409, description: 'Time block overlaps' })
    create(@CurrentUser() user: CurrentUserData, @Body() createDto: CreateTimeBlockDto) {
        return this.timeBlocksService.create(user.id, createDto);
    }

    @Get()
    @ApiOperation({ summary: 'Get time blocks for a date range' })
    @ApiResponse({ status: 200, description: 'List of time blocks' })
    findAll(@CurrentUser() user: CurrentUserData, @Query() query: QueryTimeBlockDto) {
        return this.timeBlocksService.findAll(user.id, query);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a time block by ID' })
    @ApiResponse({ status: 200, description: 'Time block details' })
    @ApiResponse({ status: 404, description: 'Time block not found' })
    findOne(@Param('id') id: string, @CurrentUser() user: CurrentUserData) {
        return this.timeBlocksService.findOne(id, user.id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update a time block' })
    @ApiResponse({ status: 200, description: 'Time block updated successfully' })
    @ApiResponse({ status: 409, description: 'Time block overlaps' })
    update(
        @Param('id') id: string,
        @CurrentUser() user: CurrentUserData,
        @Body() updateDto: UpdateTimeBlockDto,
    ) {
        return this.timeBlocksService.update(id, user.id, updateDto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a time block' })
    @ApiResponse({ status: 200, description: 'Time block deleted successfully' })
    remove(@Param('id') id: string, @CurrentUser() user: CurrentUserData) {
        return this.timeBlocksService.remove(id, user.id);
    }
}
