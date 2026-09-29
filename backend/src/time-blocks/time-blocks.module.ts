import { Module } from '@nestjs/common';
import { TimeBlocksController } from './time-blocks.controller';
import { TimeBlocksService } from './time-blocks.service';
import { PublicCalendarController } from './public-calendar.controller';
import { PublicCalendarService } from './public-calendar.service';
import { CalendarIntegrationsModule } from '../calendar-integrations/calendar-integrations.module';

@Module({
    imports: [CalendarIntegrationsModule],
    controllers: [TimeBlocksController, PublicCalendarController],
    providers: [TimeBlocksService, PublicCalendarService],
    exports: [TimeBlocksService],
})
export class TimeBlocksModule { }
