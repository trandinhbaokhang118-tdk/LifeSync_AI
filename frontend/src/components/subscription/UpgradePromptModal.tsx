import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Sparkles, Check, X, Gift, ArrowRight } from 'lucide-react';
import { Button } from '../ui';
import { showToast } from '../ui/toast';
import { paymentsService } from '../../services/payments.service';
import { useAuthStore } from '../../store/auth.store';

const DISMISS_KEY = 'upgradePromptDismissedAt';
// Re-show the prompt at most once every 24h after dismissal.
const DISMISS_TTL = 24 * 60 * 60 * 1000;

const planHighlights = [
    'GPS Tracking & Track Lab cao cấp',
    'Trợ lý AI nâng cao không giới hạn',
    'Đồng bộ Apple Health / Google Fit',
    'Đồng bộ đám mây & xuất dữ liệu',
];

export function UpgradePromptModal() {
    const navigate = useNavigate();
    const location = useLocation();
    const queryClient = useQueryClient();
    const { isAuthenticated } = useAuthStore();
    const [open, setOpen] = useState(false);
    const suppressPrompt =
        location.pathname.startsWith('/app/gps-tracking') ||
        location.pathname.startsWith('/app/pricing') ||
        location.pathname.startsWith('/app/subscription');

    const { data: subscription } = useQuery({
        queryKey: ['subscription'],
        queryFn: paymentsService.getSubscription,
        enabled: isAuthenticated,
    });

    const { data: plansData } = useQuery({
        queryKey: ['subscription-plans'],
        queryFn: paymentsService.getPlans,
        enabled: isAuthenticated,
    });

    const plusPlan = plansData?.data.find((p) => p.tier === 'PLUS');

    // Decide whether to show the prompt once we know the subscription state.
    useEffect(() => {
        if (suppressPrompt) {
            setOpen(false);
            return;
        }

        if (!isAuthenticated || !subscription) return;

        // Only prompt free users who are not already trialing/paid.
        if (subscription.tier !== 'FREE') return;

        const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) || 0);
        if (Date.now() - dismissedAt < DISMISS_TTL) return;

        const timer = setTimeout(() => setOpen(true), 900);
        return () => clearTimeout(timer);
    }, [isAuthenticated, subscription, suppressPrompt]);

    const trialMutation = useMutation({
        mutationFn: paymentsService.startTrial,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['subscription'] });
            showToast.success('Dùng thử đã kích hoạt', 'Bạn đã mở khóa Plus trong 7 ngày.');
            dismiss();
        },
        onError: (error: { response?: { data?: { error?: { message?: string } } } }) => {
            const message = error.response?.data?.error?.message || 'Không thể kích hoạt bản dùng thử.';
            showToast.error(message);
        },
    });

    const dismiss = () => {
        localStorage.setItem(DISMISS_KEY, String(Date.now()));
        setOpen(false);
    };

    const goToPricing = () => {
        dismiss();
        navigate('/app/pricing');
    };

    const monthlyPrice = plusPlan ? `${plusPlan.priceVND.toLocaleString('vi-VN')}₫` : '199.000₫';
    const yearlyPrice = plusPlan ? `${(plusPlan.priceVND * 10).toLocaleString('vi-VN')}₫` : '1.990.000₫';

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    className="fixed inset-0 z-[120] flex items-center justify-center p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-md"
                        onClick={dismiss}
                    />

                    {/* Card */}
                    <motion.div
                        className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface-1)] shadow-2xl"
                        initial={{ scale: 0.9, y: 24, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        exit={{ scale: 0.9, y: 24, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                    >
                        {/* Header */}
                        <div className="relative overflow-hidden bg-gradient-to-br from-purple-500 via-fuchsia-500 to-pink-500 p-6 text-white">
                            <button
                                onClick={dismiss}
                                aria-label="Đóng"
                                className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 transition-colors hover:bg-white/30"
                            >
                                <X className="h-4 w-4" />
                            </button>
                            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider">
                                <Crown className="h-3.5 w-3.5" />
                                LifeSync Plus
                            </div>
                            <h2 className="text-2xl font-bold">Mở khóa toàn bộ sức mạnh</h2>
                            <p className="mt-1 text-sm text-white/90">
                                Dùng thử Plus miễn phí 7 ngày, hoặc đăng ký theo tháng/năm.
                            </p>
                            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
                        </div>

                        {/* Body */}
                        <div className="space-y-5 p-6">
                            {/* Features */}
                            <div className="space-y-2.5">
                                {planHighlights.map((feature) => (
                                    <div key={feature} className="flex items-start gap-3">
                                        <div className="mt-0.5 flex-shrink-0 rounded-full bg-green-500/20 p-1">
                                            <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                                        </div>
                                        <span className="text-sm text-[var(--text-2)]">{feature}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Pricing chips */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-3 text-center">
                                    <p className="text-xs text-[var(--text-3)]">Hàng tháng</p>
                                    <p className="mt-1 text-lg font-bold text-[var(--text)]">{monthlyPrice}</p>
                                    <p className="text-[11px] text-[var(--text-3)]">/tháng</p>
                                </div>
                                <div className="relative rounded-2xl border border-[var(--primary)]/50 bg-[var(--surface-2)] p-3 text-center ring-1 ring-[var(--primary)]/20">
                                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-green-500 px-2 py-0.5 text-[10px] font-bold text-white">
                                        -17%
                                    </span>
                                    <p className="text-xs text-[var(--text-3)]">Hàng năm</p>
                                    <p className="mt-1 text-lg font-bold text-[var(--text)]">{yearlyPrice}</p>
                                    <p className="text-[11px] text-[var(--text-3)]">/năm</p>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="space-y-2.5">
                                <Button
                                    onClick={() => trialMutation.mutate()}
                                    loading={trialMutation.isPending}
                                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg hover:shadow-xl"
                                >
                                    <Gift className="mr-2 h-4 w-4" />
                                    Dùng thử Plus 7 ngày miễn phí
                                </Button>
                                <Button onClick={goToPricing} variant="outline" className="w-full">
                                    <Sparkles className="mr-2 h-4 w-4" />
                                    Xem các gói & đăng ký
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                                <button
                                    onClick={dismiss}
                                    className="w-full pt-1 text-center text-sm text-[var(--text-3)] transition-colors hover:text-[var(--text-2)]"
                                >
                                    Để sau
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
