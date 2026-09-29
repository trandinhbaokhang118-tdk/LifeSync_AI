import { Body, Controller, Delete, Get, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserData } from '../common/decorators/current-user.decorator';
import { GoogleCalendarService } from './google-calendar.service';
import { CalendarRangeDto, CompleteCalendarDto } from './google-calendar.dto';

@Controller('calendar-integrations/google')
@UseGuards(JwtAuthGuard)
export class GoogleCalendarController {
    constructor(private readonly google: GoogleCalendarService) {}
    @Get('status') status(@CurrentUser() user: CurrentUserData) { return this.google.status(user.id); }
    @Post('connect') connect(@CurrentUser() user: CurrentUserData) { return this.google.connect(user.id); }
    @Post('complete') complete(@CurrentUser() user: CurrentUserData, @Body() dto: CompleteCalendarDto) { return this.google.complete(user.id, dto); }
    @Delete() disconnect(@CurrentUser() user: CurrentUserData) { return this.google.disconnect(user.id); }
    @Get('busy') busy(@CurrentUser() user: CurrentUserData, @Query() query: CalendarRangeDto) {
        return this.google.busy(user.id, new Date(query.startDate), new Date(query.endDate));
    }
}
