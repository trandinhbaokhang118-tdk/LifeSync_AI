import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { OtpRecord, OtpStore } from './otp-store.interface';

/**
 * In-memory OTP store backed by a Map.
 *
 * Optimised for the single-instance / development case:
 *  - A periodic sweep evicts expired records so abandoned OTPs (sent but never
 *    verified) can't accumulate and exhaust memory — closing an easy DoS.
 *  - The sweep timer is unref'd and cleared on module destroy so it never keeps
 *    the process (or a test runner) alive.
 *
 * Trade-offs (by design): data is lost on restart and is NOT shared across
 * instances. Configure REDIS_URL to use RedisOtpStore in those scenarios.
 */
@Injectable()
export class InMemoryOtpStore implements OtpStore, OnModuleDestroy {
    private readonly logger = new Logger(InMemoryOtpStore.name);
    private readonly store = new Map<string, OtpRecord>();
    private readonly sweepIntervalMs = 60_000; // sweep every minute
    private timer: NodeJS.Timeout | null = null;

    constructor() {
        this.timer = setInterval(() => this.sweepExpired(), this.sweepIntervalMs);
        // Don't let the cleanup timer hold the event loop open.
        this.timer.unref?.();
        this.logger.log('OTP store: in-memory (single instance). Set REDIS_URL for shared storage.');
    }

    // ttlMs is part of the OtpStore contract (Redis needs it); the in-memory
    // store derives expiry from record.expiresAt, so the arg is unused here.
    async set(phone: string, record: OtpRecord, _ttlMs?: number): Promise<void> {
        void _ttlMs;
        this.store.set(phone, record);
    }

    async get(phone: string): Promise<OtpRecord | null> {
        const record = this.store.get(phone);
        if (!record) {
            return null;
        }
        // Treat expired records as absent and drop them eagerly.
        if (record.expiresAt <= Date.now()) {
            this.store.delete(phone);
            return null;
        }
        return record;
    }

    async delete(phone: string): Promise<void> {
        this.store.delete(phone);
    }

    /** Remove all expired records. Bounds memory regardless of verify traffic. */
    private sweepExpired(): void {
        const now = Date.now();
        let removed = 0;
        for (const [phone, record] of this.store.entries()) {
            if (record.expiresAt <= now) {
                this.store.delete(phone);
                removed++;
            }
        }
        if (removed > 0) {
            this.logger.debug(`Swept ${removed} expired OTP record(s).`);
        }
    }

    onModuleDestroy(): void {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }
}
