import { SubscriptionStatus, SubscriptionTier } from '@prisma/client';

type SubscriptionAccess = {
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  currentPeriodEnd: Date;
  currentPeriodStart?: Date;
};

export function effectiveTier(subscription: SubscriptionAccess | null, now = new Date()): SubscriptionTier {
  if (!subscription ||
      !([SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING] as SubscriptionStatus[]).includes(subscription.status) ||
      subscription.currentPeriodEnd <= now ||
      (subscription.currentPeriodStart && subscription.currentPeriodStart > now)) {
    return SubscriptionTier.FREE;
  }
  return subscription.tier;
}

export function hasProAccess(subscription: SubscriptionAccess | null): boolean {
  return effectiveTier(subscription) !== SubscriptionTier.FREE;
}
