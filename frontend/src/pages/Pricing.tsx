import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
    Check,
    Crown,
    Zap,
    Star,
    ArrowRight,
    Sparkles,
    Shield,
    TrendingUp,
    Users,
    Heart,
} from 'lucide-react';
import { Button } from '../components/ui';
import { showToast } from '../components/ui/toast';
import { cn } from '../lib/utils';
import { paymentsService, redirectToCheckout } from '../services/payments.service';
import type { SubscriptionPlan, SubscriptionTier } from '../types';

const tierIcons = {
    FREE: Users,
    PRO: Zap,
    PLUS: Crown,
};

const tierColors = {
    FREE: 'from-gray-500 to-gray-600',
    PRO: 'from-blue-500 to-cyan-600',
    PLUS: 'from-purple-500 to-pink-600',
};

const tierGlows = {
    FREE: 'shadow-gray-500/20',
    PRO: 'shadow-blue-500/30',
    PLUS: 'shadow-purple-500/40',
};

export function Pricing() {
    const [billingCycle, setBillingCycle] = useState<'month' | 'year'>('month');
    const [isProcessing, setIsProcessing] = useState<string | null>(null);
    const [searchParams, setSearchParams] = useSearchParams();

    const { data: plans, isLoading } = useQuery({
        queryKey: ['subscription-plans'],
        queryFn: paymentsService.getPlans,
    });

    const { data: currentSubscription } = useQuery({
        queryKey: ['subscription'],
        queryFn: paymentsService.getSubscription,
    });

    useEffect(() => {
        const sessionId = searchParams.get('session_id');
        if (searchParams.get('checkout') !== 'success' || !sessionId) return;

        void paymentsService.verifyPayment(sessionId)
            .then(() => showToast.success('Thanh toán thành công', 'Gói của bạn đã được kích hoạt.'))
            .catch(() => showToast.error('Chưa thể xác minh thanh toán', 'Vui lòng thử lại sau ít phút.'))
            .finally(() => {
                setSearchParams({}, { replace: true });
            });
    }, [searchParams, setSearchParams]);

    const checkoutMutation = useMutation({
        mutationFn: (tier: SubscriptionTier) =>
            paymentsService.createCheckout({ tier, provider: 'SEPAY' }),
        onSuccess: (data) => {
            if (data.checkoutUrl) {
                redirectToCheckout(data);
            }
        },
        onError: () => {
            showToast.error('Không thể tạo phiên thanh toán');
            setIsProcessing(null);
        },
    });

    const handleUpgrade = async (tier: SubscriptionTier) => {
        setIsProcessing(tier);
        try {
            if (tier === 'FREE') {
                showToast.info('Bạn đang sử dụng gói miễn phí');
                setIsProcessing(null);
                return;
            }
            await checkoutMutation.mutateAsync(tier);
        } catch (error) {
            console.error('Upgrade error:', error);
        }
    };

    const formatPrice = (plan: SubscriptionPlan) => {
        if (plan.priceVND === 0) return 'Miễn phí';
        const price = billingCycle === 'year' ? plan.priceVND * 10 : plan.priceVND;
        return `${price.toLocaleString('vi-VN')}₫`;
    };

    if (isLoading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-[var(--primary)] border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="space-y-12 pb-20 md:pb-0">
            {/* Hero Section */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-gradient-to-br from-[var(--primary)]/10 via-[var(--surface-1)] to-[var(--surface-2)] p-12 text-center shadow-2xl backdrop-blur-xl"
            >
                <div className="relative z-10">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: 'spring' }}
                        className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[var(--primary)]/20 to-[var(--primary)]/10 px-4 py-2 text-sm font-medium text-[var(--primary)]"
                    >
                        <Sparkles className="h-4 w-4" />
                        Nâng cấp năng suất của bạn
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="mb-4 text-4xl font-bold text-[var(--text)] md:text-5xl"
                    >
                        Chọn gói phù hợp với bạn
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="mx-auto max-w-2xl text-lg text-[var(--text-2)]"
                    >
                        Tối ưu hóa thời gian và nâng cao hiệu suất công việc với các tính năng AI thông minh
                    </motion.p>
                </div>

                {/* Decorative Elements */}
                <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-[var(--primary)]/20 blur-3xl" />
                <div className="absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-[var(--primary)]/10 blur-3xl" />
            </motion.div>

            {/* Billing Toggle */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex items-center justify-center gap-4"
            >
                <span className={cn('text-sm font-medium', billingCycle === 'month' ? 'text-[var(--text)]' : 'text-[var(--text-2)]')}>
                    Hàng tháng
                </span>
                <button
                    onClick={() => setBillingCycle(billingCycle === 'month' ? 'year' : 'month')}
                    role="switch"
                    aria-checked={billingCycle === 'year'}
                    aria-label="Chuyển đổi chu kỳ thanh toán"
                    className={cn(
                        'relative flex h-7 w-12 items-center rounded-full px-1 transition-colors duration-300',
                        billingCycle === 'year' ? 'bg-[var(--primary)]' : 'bg-[var(--surface-3)]'
                    )}
                >
                    <motion.span
                        className="h-5 w-5 rounded-full bg-white shadow-md"
                        animate={{ x: billingCycle === 'year' ? 20 : 0 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 32 }}
                    />
                </button>
                <span className={cn('text-sm font-medium', billingCycle === 'year' ? 'text-[var(--text)]' : 'text-[var(--text-2)]')}>
                    Hàng năm
                    <span className="ml-2 inline-flex items-center rounded-full bg-green-500/20 px-2 py-0.5 text-xs text-green-600 dark:text-green-400">
                        Tiết kiệm 17%
                    </span>
                </span>
            </motion.div>

            {/* Pricing Cards */}
            <div className="grid gap-8 lg:grid-cols-3">
                {plans?.data.map((plan, index) => {
                    const Icon = tierIcons[plan.tier as keyof typeof tierIcons];
                    const isCurrentPlan = currentSubscription?.tier === plan.tier;
                    const isPopular = plan.tier === 'PRO';

                    return (
                        <motion.div
                            key={plan.id}
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 + index * 0.1 }}
                            className="relative"
                        >
                            {isPopular && (
                                <div className="absolute -top-4 left-1/2 z-20 -translate-x-1/2">
                                    <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-blue-500 to-cyan-600 px-4 py-1 text-xs font-bold text-white shadow-lg">
                                        <Star className="h-3 w-3 fill-white" />
                                        PHỔ BIẾN NHẤT
                                    </span>
                                </div>
                            )}

                            <motion.div
                                whileHover={{ scale: 1.02, y: -8 }}
                                className={cn(
                                    'relative h-full overflow-hidden rounded-2xl border bg-[var(--surface-1)] p-8 shadow-xl backdrop-blur-xl transition-all',
                                    isPopular && 'border-[var(--primary)]/50 ring-2 ring-[var(--primary)]/20',
                                    !isPopular && 'border-[var(--border)]'
                                )}
                            >
                                {/* Icon & Name */}
                                <div className="mb-6">
                                    <div
                                        className={cn(
                                            'mb-4 inline-flex items-center justify-center rounded-xl bg-gradient-to-br p-3 shadow-lg',
                                            tierColors[plan.tier as keyof typeof tierColors],
                                            tierGlows[plan.tier as keyof typeof tierGlows]
                                        )}
                                    >
                                        <Icon className="h-6 w-6 text-white" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-[var(--text)]">{plan.name}</h3>
                                    <p className="mt-2 text-sm text-[var(--text-2)]">{plan.description}</p>
                                </div>

                                {/* Price */}
                                <div className="mb-6">
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-4xl font-bold text-[var(--text)]">{formatPrice(plan)}</span>
                                        {plan.priceVND > 0 && (
                                            <span className="text-[var(--text-2)]">/{billingCycle === 'year' ? 'năm' : 'tháng'}</span>
                                        )}
                                    </div>
                                    {billingCycle === 'year' && plan.priceVND > 0 && (
                                        <p className="mt-1 text-sm text-[var(--text-3)]">
                                            ~{Math.round(plan.priceVND * 10 / 12).toLocaleString('vi-VN')}₫/tháng
                                        </p>
                                    )}
                                </div>

                                {/* CTA Button */}
                                <Button
                                    onClick={() => handleUpgrade(plan.tier as SubscriptionTier)}
                                    disabled={isCurrentPlan || isProcessing === plan.tier}
                                    loading={isProcessing === plan.tier}
                                    className={cn(
                                        'mb-6 w-full',
                                        isPopular && !isCurrentPlan && 'bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 shadow-lg hover:shadow-xl'
                                    )}
                                    variant={isCurrentPlan ? 'outline' : isPopular ? 'default' : 'outline'}
                                >
                                    {isCurrentPlan ? (
                                        <>
                                            <Shield className="mr-2 h-4 w-4" />
                                            Gói hiện tại
                                        </>
                                    ) : (
                                        <>
                                            {plan.tier === 'FREE' ? 'Bắt đầu miễn phí' : 'Nâng cấp ngay'}
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </>
                                    )}
                                </Button>

                                {/* Features */}
                                <div className="space-y-3 border-t border-[var(--border)] pt-6">
                                    <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-2)]">
                                        Tính năng bao gồm:
                                    </p>
                                    {Array.isArray(plan.features) && plan.features.map((feature, idx) => (
                                        <motion.div
                                            key={idx}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.8 + idx * 0.05 }}
                                            className="flex items-start gap-3"
                                        >
                                            <div className="flex-shrink-0 rounded-full bg-green-500/20 p-1">
                                                <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                                            </div>
                                            <span className="text-sm text-[var(--text-2)]">{feature}</span>
                                        </motion.div>
                                    ))}
                                </div>

                                {/* Decorative glow */}
                                <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br from-[var(--primary)]/10 to-transparent blur-2xl" />
                            </motion.div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Trust Badges */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
                className="rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-8 backdrop-blur-xl"
            >
                <div className="grid gap-6 text-center md:grid-cols-3">
                    <div>
                        <div className="mx-auto mb-3 inline-flex items-center justify-center rounded-full bg-blue-500/20 p-3">
                            <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h4 className="mb-1 font-semibold text-[var(--text)]">Thanh toán an toàn</h4>
                        <p className="text-sm text-[var(--text-2)]">Mã hóa SSL 256-bit</p>
                    </div>
                    <div>
                        <div className="mx-auto mb-3 inline-flex items-center justify-center rounded-full bg-green-500/20 p-3">
                            <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
                        </div>
                        <h4 className="mb-1 font-semibold text-[var(--text)]">Hủy bất kỳ lúc nào</h4>
                        <p className="text-sm text-[var(--text-2)]">Không ràng buộc dài hạn</p>
                    </div>
                    <div>
                        <div className="mx-auto mb-3 inline-flex items-center justify-center rounded-full bg-purple-500/20 p-3">
                            <Heart className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <h4 className="mb-1 font-semibold text-[var(--text)]">Hỗ trợ 24/7</h4>
                        <p className="text-sm text-[var(--text-2)]">Đội ngũ hỗ trợ tận tâm</p>
                    </div>
                </div>
            </motion.div>

            {/* FAQ or Additional Info could go here */}
        </div>
    );
}
