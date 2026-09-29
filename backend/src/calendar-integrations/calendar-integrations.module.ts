import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { GoogleCalendarService } from './google-calendar.service';
import { GoogleCalendarController } from './google-calendar.controller';
import { WeatherController } from './weather.controller';
import { WeatherService } from './weather.service';

@Module({ imports: [PrismaModule], controllers: [GoogleCalendarController, WeatherController], providers: [GoogleCalendarService, WeatherService], exports: [GoogleCalendarService] })
export class CalendarIntegrationsModule {}
