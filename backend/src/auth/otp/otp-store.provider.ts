import { Logger, Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OTP_STORE } from './otp-store.interface';
import { InMemoryOtpStore } from './in-memory-otp.store';
import { RedisOtpStore } from './redis-otp.store';

/**
 * Chooses the OTP storage backend at startup based on configuration:
 *  - REDIS_URL set  -> RedisOtpStore (shared, production/multi-instance).
 *  - otherwise      -> InMemoryOtpStore (single instance / development).
 *
 * ioredis is imported lazily so the dependency is only required when Redis is
 * actually configured. If REDIS_URL is set but the driver/connection fails, we
 * fail safe to the in-memory store rather than crashing auth entirely.
 */
export const otpStoreProvider: Provider = {
    provide: OTP_STORE,
    inject: [ConfigService],
    useFactory: async (configService: ConfigService) => {
        const logger = new Logger('OtpStoreProvider');
        const redisUrl = configService.get<string>('REDIS_URL');

        if (!redisUrl) {
            return new InMemoryOtpStore();
        }

        try {
            // Lazy require so projects without Redis don't need the package.
            const { default: Redis } = await import('ioredis');
            const client = new Redis(redisUrl, {
                lazyConnect: false,
                maxRetriesPerRequest: 2,
            });

            client.on('error', (err: Error) => {
                logger.error(`Redis error: ${err.message}`);
            });

            return new RedisOtpStore(client);
        } catch (err) {
            logger.error(
                `Failed to initialise Redis OTP store (${(err as Error).message}). ` +
                'Falling back to in-memory store.',
            );
            return new InMemoryOtpStore();
        }
    },
};
