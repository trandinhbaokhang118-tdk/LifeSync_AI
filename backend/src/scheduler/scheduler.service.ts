import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import * as cron from 'node-cron';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class SchedulerService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(SchedulerService.name);
    private reminderJob?: cron.ScheduledTask;

    constructor(
        private prisma: PrismaService,
        private notificationsService: NotificationsService,
    ) { }

    onModuleInit() {
        this.startReminderJob();
    }

    onModuleDestroy() {
        // Stop the cron task so timers don't leak when the app shuts down
        // (e.g. between e2e test suites or on graceful restart).
        this.reminderJob?.stop();
    }

    private startReminderJob() {
        // Run every minute
        this.reminderJob = cron.schedule('* * * * *', async () => {
            await this.processReminders();
        });

        this.logger.log('Reminder scheduler started');
    }

    private async processReminders() {
        const now = new Date();

        // Find all untriggered reminders that are due
        const dueReminders = await this.prisma.reminder.findMany({
            where: {
                triggered: false,
                triggerAt: { lte: now },
            },
            include: { user: true },
        });

        for (const reminder of dueReminders) {
            try {
                // Create notification
                await this.notificationsService.createNotification(
                    reminder.userId,
                    'Reminder',
                    reminder.message,
                );

                // Mark reminder as triggered
                await this.prisma.reminder.update({
                    where: { id: reminder.id },
                    data: { triggered: true },
                });

                this.logger.log(`Processed reminder ${reminder.id} for user ${reminder.userId}`);
            } catch (error) {
                this.logger.error(`Failed to process reminder ${reminder.id}:`, error);
            }
        }
    }
}
