/**
 * Storage abstraction for one-time passwords (OTP).
 *
 * Two implementations exist:
 *  - InMemoryOtpStore: simple Map + periodic cleanup. Good for a single
 *    instance / development. No external dependency.
 *  - RedisOtpStore: shared, survives restarts, works across many instances.
 *    Selected automatically when REDIS_URL is configured.
 *
 * The service depends only on this interface, so switching backends never
 * touches business logic.
 */

/** DI token used to inject the configured OTP store. */
export const OTP_STORE = Symbol('OTP_STORE');

export interface OtpRecord {
    /** The 6-digit code. */
    otp: string;
    /** Epoch milliseconds after which the code is invalid. */
    expiresAt: number;
    /** Number of failed verification attempts so far. */
    attempts: number;
}

export interface OtpStore {
    /** Persist an OTP record for `phone` with a time-to-live in milliseconds. */
    set(phone: string, record: OtpRecord, ttlMs: number): Promise<void>;

    /** Fetch the current OTP record for `phone`, or null if none/expired. */
    get(phone: string): Promise<OtpRecord | null>;

    /** Remove any OTP record for `phone`. */
    delete(phone: string): Promise<void>;
}
