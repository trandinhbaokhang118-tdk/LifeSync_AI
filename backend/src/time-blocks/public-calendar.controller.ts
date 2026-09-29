import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { QueryTimeBlockDto } from './dto/query-time-block.dto';
import { PublicCalendarService } from './public-calendar.service';

@Controller('calendar-sources')
@UseGuards(JwtAuthGuard)
export class PublicCalendarController {
    constructor(private readonly calendars: PublicCalendarService) {}

    @Get('google-public')
    list(@Query() query: QueryTimeBlockDto) {
        return this.calendars.list(query.startDate, query.endDate);
    }
}
