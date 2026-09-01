import api from './api';
import type {
    CheckoutResponse,
    SubscriptionPlan,
    Subscription,
    SubscriptionTier,
    PaymentProvider,
} from '../types';

interface CreateCheckoutRequest {
    tier: SubscriptionTier;
    provider: PaymentProvider;
}

export const paymentsService = {
    async getPlans() {
        const response = await api.get<{ data: SubscriptionPlan[] }>('/payments/plans');
        return response.data;
    },

    async getSubscription() {
        const response = await api.get<{ data: Subscription }>('/payments/subscription');
        return response.data.data;
    },

    async createCheckout(data: CreateCheckoutRequest) {
        const response = await api.post<{ data: CheckoutResponse }>('/payments/checkout', data);
        return response.data.data;
    },

    async cancelSubscription() {
        const response = await api.post<{ data: Subscription }>('/payments/cancel');
        return response.data.data;
    },

    async startTrial() {
        const response = await api.post<{ data: Subscription }>('/payments/trial');
        return response.data.data;
    },

    async verifyPayment(paymentId: string) {
        const response = await api.post<{ data: { verified: boolean } }>('/payments/verify', { paymentId });
        return response.data.data;
    },
};

export function redirectToCheckout(checkout: CheckoutResponse) {
    if (!checkout.checkoutFields) {
        window.location.assign(checkout.checkoutUrl);
        return;
    }

    const form = document.createElement('form');
    form.method = 'POST';
    form.action = checkout.checkoutUrl;
    form.acceptCharset = 'UTF-8';
    form.style.display = 'none';

    Object.entries(checkout.checkoutFields).forEach(([name, value]) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = name;
        input.value = value;
        form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();
}
