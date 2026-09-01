import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import type Redis from 'ioredis';
import { OtpRecord, OtpStore } from './otp-store.interface';

/**
 * Redis-backed OTP store for production / multi-instance deployments.
 *
 * Benefits over the in-memory store:
 *  - Shared across every app instance behind a load balancer.
 *  - Survives app restarts/redeploys.
 *  - Redis TTL auto-expires codes, so there is nothing to sweep and no leak.
 *
 * Keys are namespaced as `otp:<phone>` and set with PX (millisecond TTL) so the
 * record disappears exactly when the OTP expires.
 */
@Injectable()
export class RedisOtpStore implements OtpStore, OnModuleDestroy {
    private readonly logger = new Logger(RedisOtpStore.name);

    constructor(private readonly redis: Redis) {
        this.logger.log('OTP store: Redis (shared, multi-instance ready).');
    }

    private key(phone: string): string {
        return `otp:${phone}`;
    }

    async set(phone: string, record: OtpRecord, ttlMs: number): Promise<void> {
        // PX sets an expiry in milliseconds; Redis removes the key automatically.
        await this.redis.set(this.key(phone), JSON.stringify(record), 'PX', Math.max(ttlMs, 1));
    }

    async get(phone: string): Promise<OtpRecord | null> {
        const raw = await this.redis.get(this.key(phone));
        if (!raw) {
            return null;
        }
        try {
            return JSON.parse(raw) as OtpRecord;
        } catch {
            // Corrupt entry: drop it so the caller can start fresh.
            await this.redis.del(this.key(phone));
            return null;
        }
    }

    async delete(phone: string): Promise<void> {
        await this.redis.del(this.key(phone));
    }

    onModuleDestroy(): void {
        // Close the connection so the process can exit cleanly.
        void this.redis.quit();
    }
}
