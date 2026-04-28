import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TagsService } from './tags.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, CurrentUserData } from '../common/decorators/current-user.decorator';

@ApiTags('Tags')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('USER')
@Controller('tags')
export class TagsController {
    constructor(private tagsService: TagsService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new tag' })
    @ApiResponse({ status: 201, description: 'Tag created successfully' })
    create(@CurrentUser() user: CurrentUserData, @Body() createTagDto: CreateTagDto) {
        return this.tagsService.create(user.id, createTagDto);
    }

    @Get()
    @ApiOperation({ summary: 'Get all tags for current user' })
    @ApiResponse({ status: 200, description: 'List of tags' })
    findAll(@CurrentUser() user: CurrentUserData) {
        return this.tagsService.findAll(user.id);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a tag' })
    @ApiResponse({ status: 200, description: 'Tag deleted successfully' })
    @ApiResponse({ status: 404, description: 'Tag not found' })
    remove(@Param('id') id: string, @CurrentUser() user: CurrentUserData) {
        return this.tagsService.remove(id, user.id);
    }
}
