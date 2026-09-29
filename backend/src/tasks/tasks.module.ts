import { Module } from '@nestjs/common';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { CalendarIntegrationsModule } from '../calendar-integrations/calendar-integrations.module';

@Module({
    imports: [CalendarIntegrationsModule],
    controllers: [TasksController],
    providers: [TasksService],
    exports: [TasksService],
})
export class TasksModule { }
