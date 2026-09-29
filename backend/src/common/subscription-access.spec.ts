import { effectiveTier } from './subscription-access';
import { SubscriptionStatus, SubscriptionTier } from '@prisma/client';

describe('effective subscription access', () => {
  const now = new Date('2026-09-30T00:00:00Z');
  const valid = { tier: SubscriptionTier.PRO, status: SubscriptionStatus.ACTIVE, currentPeriodEnd: new Date(+now + 1000) };
  it('gives Free access without a subscription', () => expect(effectiveTier(null, now)).toBe('FREE'));
  it.each(['PRO', 'PLUS'] as const)('allows current %s subscriptions', tier => expect(effectiveTier({ ...valid, tier }, now)).toBe(tier));
  it('allows a current trial', () => expect(effectiveTier({ ...valid, status: SubscriptionStatus.TRIALING }, now)).toBe('PRO'));
  it('expires at the exact period boundary', () => expect(effectiveTier({ ...valid, currentPeriodEnd: now }, now)).toBe('FREE'));
  it('rejects future subscriptions', () => expect(effectiveTier({ ...valid, currentPeriodStart: new Date(+now + 100) }, now)).toBe('FREE'));
  it.each(['CANCELED', 'PAST_DUE'] as const)('rejects %s', status => expect(effectiveTier({ ...valid, status }, now)).toBe('FREE'));
});
