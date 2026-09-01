import { InMemoryOtpStore } from './in-memory-otp.store';

describe('InMemoryOtpStore', () => {
    let store: InMemoryOtpStore;

    afterEach(() => {
        // Always tear down the sweep timer.
        store?.onModuleDestroy();
    });

    it('stores and retrieves an OTP record', async () => {
        store = new InMemoryOtpStore();
        await store.set('0900000000', { otp: '123456', expiresAt: Date.now() + 60_000, attempts: 0 }, 60_000);

        const record = await store.get('0900000000');
        expect(record).not.toBeNull();
        expect(record?.otp).toBe('123456');
        expect(record?.attempts).toBe(0);
    });

    it('returns null and drops the record once it is expired', async () => {
        store = new InMemoryOtpStore();
        // Already-expired timestamp.
        await store.set('0900000001', { otp: '111111', expiresAt: Date.now() - 1, attempts: 0 }, 1);

        const record = await store.get('0900000001');
        expect(record).toBeNull();
    });

    it('deletes a record explicitly', async () => {
        store = new InMemoryOtpStore();
        await store.set('0900000002', { otp: '222222', expiresAt: Date.now() + 60_000, attempts: 0 }, 60_000);
        await store.delete('0900000002');

        expect(await store.get('0900000002')).toBeNull();
    });

    it('sweeps abandoned expired records so memory cannot grow unbounded', async () => {
        jest.useFakeTimers();
        try {
            store = new InMemoryOtpStore();

            // Two OTPs that expire almost immediately but are never verified.
            await store.set('0900000003', { otp: '333333', expiresAt: Date.now() + 10, attempts: 0 }, 10);
            await store.set('0900000004', { otp: '444444', expiresAt: Date.now() + 10, attempts: 0 }, 10);

            // Move past expiry, then run the periodic sweep (60s interval).
            jest.setSystemTime(Date.now() + 20);
            jest.advanceTimersByTime(60_000);

            // Access the private map to confirm the sweep physically removed them.
            const internal = (store as unknown as { store: Map<string, unknown> }).store;
            expect(internal.size).toBe(0);
        } finally {
            jest.useRealTimers();
        }
    });
});
