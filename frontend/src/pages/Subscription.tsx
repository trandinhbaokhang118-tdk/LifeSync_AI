import { useEffect, useState } from 'react';
import { cn } from '../lib/utils';
import { showToast } from '../components/ui/toast';
import { subscriptionsService } from '../services/subscriptions.service';
import { useAuthStore } from '../store/auth.store';
import type {
    PaymentProvider,
    Subscription,
    SubscriptionPlan,
    SubscriptionStatus,
    SubscriptionTier,
} from '../types';

type SubscriptionWithUser = Subscription & {
    user?: { id: string; email: string; name: string };
};

const providerLabels: Record<PaymentProvider, string> = {
    STRIPE: 'Stripe',
    VNPAY: 'VNPay',
    MOMO: 'MoMo',
    ZALOPAY: 'ZaloPay',
};

const paymentsEnabled = import.meta.env.VITE_PAYMENTS_ENABLED === 'true';

export function Subscription() {
    const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
    const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [selectedProvider, setSelectedProvider] = useState<PaymentProvider>('STRIPE');
    const [activeTab, setActiveTab] = useState<'my' | 'admin'>('my');
    const [allSubscriptions, setAllSubscriptions] = useState<SubscriptionWithUser[]>([]);
    const [adminLoading, setAdminLoading] = useState(false);
    const [editingSubscription, setEditingSubscription] = useState<string | null>(null);

    const { user } = useAuthStore();
    const isAdmin = user?.role === 'ADMIN';

    useEffect(() => {
        void loadData();
    }, []);

    useEffect(() => {
        if (activeTab === 'admin' && isAdmin && allSubscriptions.length === 0) {
            void loadAllSubscriptions();
        }
    }, [activeTab, allSubscriptions.length, isAdmin]);

    const loadData = async () => {
        try {
            const [plansData, subscriptionData] = await Promise.all([
                subscriptionsService.getPlans(),
                subscriptionsService.getSubscription(),
            ]);
            setPlans(plansData);
            setCurrentSubscription(subscriptionData);
        } catch (error) {
            showToast.error('Load failed', getErrorMessage(error, 'Could not load subscription data.'));
        } finally {
            setLoading(false);
        }
    };

    const loadAllSubscriptions = async () => {
        setAdminLoading(true);
        try {
            const data = await subscriptionsService.getAllSubscriptions();
            setAllSubscriptions(data);
        } catch (error) {
            showToast.error('Load failed', getErrorMessage(error, 'Could not load admin subscription data.'));
        } finally {
            setAdminLoading(false);
        }
    };

    const handleUpgrade = async (tier: SubscriptionTier) => {
        if (tier === 'FREE' || currentSubscription?.tier === tier) {
            return;
        }

        if (!paymentsEnabled) {
            showToast.info(
                'Billing disabled',
                'Online billing is disabled in this deployment. Assign paid plans from the Admin tab if needed.',
            );
            return;
        }

        setProcessing(true);
        try {
            const result = await subscriptionsService.createCheckout({
                tier,
                provider: selectedProvider,
            });

            if (result.checkoutUrl) {
                window.location.assign(result.checkoutUrl);
                return;
            }

            showToast.warning('Checkout unavailable', 'No checkout URL was returned by the server.');
        } catch (error) {
            showToast.error(
                'Checkout unavailable',
                getErrorMessage(error, 'Could not create a checkout session.'),
            );
        } finally {
            setProcessing(false);
        }
    };

    const handleCancel = async () => {
        if (!window.confirm('Cancel the current subscription?')) {
            return;
        }

        setProcessing(true);
        try {
            await subscriptionsService.cancelSubscription();
            showToast.success('Subscription updated', 'The subscription was canceled successfully.');
            await loadData();
        } catch (error) {
            showToast.error('Cancel failed', getErrorMessage(error, 'Could not cancel the subscription.'));
        } finally {
            setProcessing(false);
        }
    };

    const handleUpdateSubscription = async (
        userId: string,
        data: { tier?: SubscriptionTier; status?: SubscriptionStatus },
    ) => {
        try {
            await subscriptionsService.updateSubscription(userId, data);
            showToast.success('Subscription updated', 'Manual subscription update saved.');
            setEditingSubscription(null);
            await loadAllSubscriptions();
        } catch (error) {
            showToast.error('Update failed', getErrorMessage(error, 'Could not update this subscription.'));
        }
    };

    if (loading) {
        return (
            <div className="page-shell flex min-h-[400px] items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                        <div className="h-12 w-12 rounded-full border-4 border-[var(--surface-highlight-border)]" />
                        <div className="absolute left-0 top-0 h-12 w-12 animate-spin rounded-full border-4 border-[var(--primary)] border-t-transparent" />
                    </div>
                    <p className="text-sm text-[var(--text-2)]">Loading subscription plans...</p>
                </div>
            </div>
        );
    }

    const currentTier = currentSubscription?.tier || 'FREE';

    const renderAdminTab = () => {
        if (adminLoading) {
            return (
                <div className="flex h-64 items-center justify-center">
                    <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-[var(--primary)]" />
                </div>
            );
        }

        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-[var(--text)]">Manual subscription management</h2>
                        <p className="text-sm text-[var(--text-2)]">
                            Use this table to assign or correct plans while online billing is disabled.
                        </p>
                    </div>
                    <button onClick={() => void loadAllSubscriptions()} className="btn-neon px-4 py-2 text-sm">
                        Refresh
                    </button>
                </div>

                <div className="surface-panel overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead className="bg-[var(--surface-3)]">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-[var(--text-3)]">
                                        User
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-[var(--text-3)]">
                                        Tier
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-[var(--text-3)]">
                                        Status
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-[var(--text-3)]">
                                        Period end
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-[var(--text-3)]">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--divider)]">
                                {allSubscriptions.map((sub) => {
                                    const subscriptionUserId = sub.userId ?? sub.user?.id ?? null;
                                    const rowKey =
                                        sub.id ??
                                        subscriptionUserId ??
                                        sub.user?.email ??
                                        `${sub.tier}-${sub.status}-${sub.currentPeriodEnd ?? 'none'}`;
                                    const canEdit = Boolean(subscriptionUserId);

                                    return (
                                        <tr key={rowKey} className="transition-colors hover:bg-[var(--surface-3)]">
                                            <td className="whitespace-nowrap px-6 py-4">
                                                <div className="text-sm font-medium text-[var(--text)]">
                                                    {sub.user?.name || 'Unknown'}
                                                </div>
                                                <div className="text-sm text-[var(--text-2)]">
                                                    {sub.user?.email || 'Unknown'}
                                                </div>
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4">
                                                {editingSubscription === subscriptionUserId && canEdit ? (
                                                    <select
                                                        defaultValue={sub.tier}
                                                        onChange={(event) => {
                                                            if (!subscriptionUserId) {
                                                                return;
                                                            }

                                                            void handleUpdateSubscription(subscriptionUserId, {
                                                                tier: event.target.value as SubscriptionTier,
                                                                status: sub.status,
                                                            });
                                                        }}
                                                        className="input h-10 rounded-lg px-3 text-sm"
                                                    >
                                                        <option value="FREE">FREE</option>
                                                        <option value="PRO">PRO</option>
                                                        <option value="PLUS">PLUS</option>
                                                    </select>
                                                ) : (
                                                    <span
                                                        className={cn(
                                                            'inline-flex rounded-full px-3 py-1 text-xs font-semibold',
                                                            getTierBadgeClass(sub.tier),
                                                        )}
                                                    >
                                                        {sub.tier}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4">
                                                {editingSubscription === subscriptionUserId && canEdit ? (
                                                    <select
                                                        defaultValue={sub.status}
                                                        onChange={(event) => {
                                                            if (!subscriptionUserId) {
                                                                return;
                                                            }

                                                            void handleUpdateSubscription(subscriptionUserId, {
                                                                tier: sub.tier,
                                                                status: event.target.value as SubscriptionStatus,
                                                            });
                                                        }}
                                                        className="input h-10 rounded-lg px-3 text-sm"
                                                    >
                                                        <option value="ACTIVE">ACTIVE</option>
                                                        <option value="TRIALING">TRIALING</option>
                                                        <option value="CANCELED">CANCELED</option>
                                                        <option value="PAST_DUE">PAST_DUE</option>
                                                    </select>
                                                ) : (
                                                    <span
                                                        className={cn(
                                                            'inline-flex rounded-full px-3 py-1 text-xs font-semibold',
                                                            getStatusBadgeClass(sub.status),
                                                        )}
                                                    >
                                                        {sub.status}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-[var(--text-2)]">
                                                {sub.currentPeriodEnd
                                                    ? new Date(sub.currentPeriodEnd).toLocaleDateString()
                                                    : 'N/A'}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                                                {editingSubscription === subscriptionUserId && canEdit ? (
                                                    <button
                                                        onClick={() => setEditingSubscription(null)}
                                                        className="text-[var(--text-2)] transition-colors hover:text-[var(--text)]"
                                                    >
                                                        Cancel
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => canEdit && setEditingSubscription(subscriptionUserId)}
                                                        disabled={!canEdit}
                                                        className="text-[var(--primary)] transition-colors hover:text-[var(--text)] disabled:cursor-not-allowed disabled:text-[var(--text-3)]"
                                                    >
                                                        {canEdit ? 'Edit' : 'Unavailable'}
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {allSubscriptions.length === 0 && (
                    <div className="surface-soft p-8 text-center text-[var(--text-2)]">
                        No subscriptions found.
                    </div>
                )}
            </div>
        );
    };

    const renderMySubscriptionTab = () => (
        <>
            <div className="mb-10 text-center">
                <h1 className="mb-3 text-4xl font-bold text-[var(--text)]">
                    <span className="bg-[image:var(--primary-gradient)] bg-clip-text text-transparent">
                        Subscription plans
                    </span>
                </h1>
                <p className="text-lg text-[var(--text-2)]">
                    Pick the right tier for productivity, fitness and premium tools.
                </p>
            </div>

            {!paymentsEnabled && (
                <div className="challenge-banner mb-8 p-6">
                    <div className="relative z-10 flex flex-col gap-3">
                        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--primary)]">
                            Billing status
                        </p>
                        <p className="text-xl font-semibold text-[var(--text)]">
                            Online billing is disabled in this deployment.
                        </p>
                        <p className="max-w-3xl text-sm text-[var(--text-2)]">
                            The product is safe to hand off and deploy without a payment gateway. If you need paid
                            plans immediately, assign them manually from the Admin tab until provider integration is
                            completed.
                        </p>
                    </div>
                </div>
            )}

            {currentTier !== 'FREE' && (
                <div className="challenge-banner mb-8 p-6">
                    <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <p className="text-sm text-[var(--primary)]">Current plan</p>
                            <p className="text-2xl font-bold text-[var(--text)]">
                                {currentSubscription?.tier} Plan
                            </p>
                            {currentSubscription?.currentPeriodEnd && (
                                <p className="text-sm text-[var(--text-2)]">
                                    Expires: {new Date(currentSubscription.currentPeriodEnd).toLocaleDateString()}
                                </p>
                            )}
                        </div>
                        <button
                            onClick={() => void handleCancel()}
                            disabled={processing}
                            className="rounded-lg border border-red-500/30 px-4 py-2 font-medium text-red-500 transition-colors hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            Cancel subscription
                        </button>
                    </div>
                </div>
            )}

            <div className="mb-10">
                <h3 className="mb-4 text-sm font-medium text-[var(--text)]">Payment method</h3>
                {paymentsEnabled ? (
                    <div className="flex flex-wrap gap-3">
                        {(Object.keys(providerLabels) as PaymentProvider[]).map((provider) => (
                            <button
                                key={provider}
                                onClick={() => setSelectedProvider(provider)}
                                className={cn(
                                    'rounded-full border px-5 py-3 text-sm font-medium transition-all duration-300',
                                    selectedProvider === provider
                                        ? 'border-[var(--surface-highlight-border)] bg-[var(--surface-highlight)] text-[var(--primary)] shadow-[var(--shadow-md)]'
                                        : 'border-[var(--border)] bg-[var(--surface-1)] text-[var(--text-2)] hover:border-[var(--surface-highlight-border)] hover:text-[var(--text)]',
                                )}
                            >
                                {providerLabels[provider]}
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-1)] p-4 text-sm text-[var(--text-2)]">
                        Payment providers are intentionally hidden until billing is fully integrated.
                    </div>
                )}
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {plans.map((plan) => {
                    const isCurrentPlan = plan.tier === currentTier;
                    const isPlus = plan.tier === 'PLUS';
                    const isPro = plan.tier === 'PRO';
                    const price =
                        selectedProvider === 'STRIPE'
                            ? `$${(plan.priceUSD / 100).toFixed(2)}`
                            : `${plan.priceVND.toLocaleString('vi-VN')} VND`;

                    return (
                        <div
                            key={plan.id}
                            className={cn(
                                'surface-card-hover relative p-6',
                                isPro && 'border-[var(--surface-highlight-border)] shadow-[var(--primary-glow)]',
                                isPlus && 'border-sky-400/40 shadow-[0_16px_40px_rgba(59,130,246,0.18)]',
                            )}
                        >
                            {isPlus && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-sky-500 via-blue-500 to-violet-500 px-5 py-1.5 text-sm font-semibold text-white shadow-lg">
                                    Best value
                                </div>
                            )}

                            {isPro && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[image:var(--primary-gradient)] px-5 py-1.5 text-sm font-semibold text-[var(--btn-primary-text)] shadow-lg">
                                    Popular
                                </div>
                            )}

                            <div className="mb-6 mt-2 text-center">
                                <h3 className="text-xl font-bold text-[var(--text)]">{plan.name}</h3>
                                <div className="mt-4">
                                    <span className="text-4xl font-bold text-[var(--text)]">{price}</span>
                                    <span className="text-[var(--text-2)]">/month</span>
                                </div>
                                {plan.description && (
                                    <p className="mt-2 text-sm text-[var(--text-2)]">{plan.description}</p>
                                )}
                            </div>

                            <ul className="mb-6 space-y-3">
                                {plan.features.map((feature, index) => (
                                    <li key={index} className="flex items-center gap-3 text-sm text-[var(--text-2)]">
                                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[var(--surface-highlight)] text-[var(--primary)]">
                                            +
                                        </span>
                                        {feature}
                                    </li>
                                ))}
                            </ul>

                            <button
                                onClick={() => void handleUpgrade(plan.tier as SubscriptionTier)}
                                disabled={isCurrentPlan || processing || !paymentsEnabled}
                                className={cn(
                                    'w-full rounded-lg border px-4 py-3 font-semibold transition-all duration-300',
                                    isCurrentPlan &&
                                        'cursor-not-allowed border-[var(--border)] bg-[var(--surface-3)] text-[var(--text-3)]',
                                    !isCurrentPlan &&
                                        !paymentsEnabled &&
                                        'cursor-not-allowed border-[var(--border)] bg-[var(--surface-3)] text-[var(--text-3)]',
                                    !isCurrentPlan &&
                                        paymentsEnabled &&
                                        isPro &&
                                        'border-transparent bg-[image:var(--primary-gradient)] text-[var(--btn-primary-text)] shadow-[var(--primary-glow)] hover:shadow-[var(--primary-glow-hover)]',
                                    !isCurrentPlan &&
                                        paymentsEnabled &&
                                        isPlus &&
                                        'border-transparent bg-gradient-to-r from-sky-500 via-blue-500 to-violet-500 text-white shadow-lg hover:shadow-xl',
                                    !isCurrentPlan &&
                                        paymentsEnabled &&
                                        !isPro &&
                                        !isPlus &&
                                        'border-[var(--border)] bg-[var(--surface-1)] text-[var(--text)] hover:border-[var(--surface-highlight-border)] hover:text-[var(--primary)]',
                                )}
                            >
                                {isCurrentPlan
                                    ? 'Current plan'
                                    : processing
                                      ? 'Processing...'
                                      : paymentsEnabled
                                        ? 'Upgrade'
                                        : 'Billing disabled'}
                            </button>
                        </div>
                    );
                })}
            </div>
        </>
    );

    return (
        <div className="page-shell">
            <div className="mx-auto max-w-6xl space-y-8">
                {isAdmin && (
                    <div className="flex border-b border-[var(--divider)]">
                        <button
                            onClick={() => setActiveTab('my')}
                            className={cn(
                                'px-6 py-3 text-sm font-medium transition-all duration-300',
                                activeTab === 'my'
                                    ? 'border-b-2 border-[var(--primary)] text-[var(--primary)]'
                                    : 'text-[var(--text-2)] hover:text-[var(--text)]',
                            )}
                        >
                            My subscription
                        </button>
                        <button
                            onClick={() => setActiveTab('admin')}
                            className={cn(
                                'px-6 py-3 text-sm font-medium transition-all duration-300',
                                activeTab === 'admin'
                                    ? 'border-b-2 border-[var(--primary)] text-[var(--primary)]'
                                    : 'text-[var(--text-2)] hover:text-[var(--text)]',
                            )}
                        >
                            Admin
                        </button>
                    </div>
                )}

                {activeTab === 'admin' ? renderAdminTab() : renderMySubscriptionTab()}
            </div>
        </div>
    );
}

function getErrorMessage(error: unknown, fallback: string) {
    if (typeof error === 'object' && error !== null && 'response' in error) {
        const response = (error as { response?: { data?: { error?: { message?: string } } } }).response;
        return response?.data?.error?.message ?? fallback;
    }

    if (error instanceof Error && error.message) {
        return error.message;
    }

    return fallback;
}

function getTierBadgeClass(tier: SubscriptionTier) {
    if (tier === 'PLUS') {
        return 'border border-sky-400/30 bg-sky-500/10 text-sky-500';
    }

    if (tier === 'PRO') {
        return 'border border-[var(--surface-highlight-border)] bg-[var(--surface-highlight)] text-[var(--primary)]';
    }

    return 'border border-[var(--border)] bg-[var(--surface-3)] text-[var(--text-2)]';
}

function getStatusBadgeClass(status: SubscriptionStatus) {
    if (status === 'ACTIVE') {
        return 'bg-success-var';
    }

    if (status === 'TRIALING') {
        return 'bg-warning-var';
    }

    if (status === 'CANCELED') {
        return 'bg-danger-var';
    }

    return 'border border-[var(--border)] bg-[var(--surface-3)] text-[var(--text-2)]';
}
