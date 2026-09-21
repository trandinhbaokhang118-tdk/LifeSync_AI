import { Module } from '@nestjs/common';
import { LandingContentModule } from './landing-content/landing-content.module';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TasksModule } from './tasks/tasks.module';
import { TagsModule } from './tags/tags.module';
import { TimeBlocksModule } from './time-blocks/time-blocks.module';
import { RemindersModule } from './reminders/reminders.module';
import { NotificationsModule } from './notifications/notifications.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { SchedulerModule } from './scheduler/scheduler.module';
import { AdminModule } from './admin/admin.module';
import { AIChatModule } from './ai-chat/ai-chat.module';
import { PaymentsModule } from './payments/payments.module';
import { FitnessModule } from './fitness/fitness.module';
import { GpsModule } from './gps/gps.module';
import { HealthController } from './health/health.controller';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

@Module({
    imports: [
        LandingContentModule,
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env',
        }),
        PrismaModule,
        AuthModule,
        UsersModule,
        TasksModule,
        TagsModule,
        TimeBlocksModule,
        RemindersModule,
        NotificationsModule,
        DashboardModule,
        SchedulerModule,
        AdminModule,
        AIChatModule,
        PaymentsModule,
        FitnessModule,
        GpsModule,
    ],
    controllers: [HealthController],
    providers: [
        {
            provide: APP_FILTER,
            useClass: HttpExceptionFilter,
        },
        {
            provide: APP_INTERCEPTOR,
            useClass: LoggingInterceptor,
        },
        {
            provide: APP_INTERCEPTOR,
            useClass: TransformInterceptor,
        },
    ],
})
export class AppModule { }
