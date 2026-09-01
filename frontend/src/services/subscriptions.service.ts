import api from './api';
import type {
    Subscription,
    SubscriptionPlan,
    CreateCheckoutRequest,
    ApiResponse,
    SubscriptionStatus,
    SubscriptionTier,
    CheckoutResponse,
} from '../types';

type AdminSubscription = Subscription & {
    user: { id: string; email: string; name: string };
};

export const subscriptionsService = {
    async getPlans(): Promise<SubscriptionPlan[]> {
        const response = await api.get<ApiResponse<SubscriptionPlan[]>>('/payments/plans');
        return response.data.data;
    },

    async getSubscription(): Promise<Subscription> {
        const response = await api.get<ApiResponse<Subscription>>('/payments/subscription');
        return response.data.data;
    },

    async createCheckout(data: CreateCheckoutRequest): Promise<CheckoutResponse> {
        const response = await api.post<ApiResponse<CheckoutResponse>>('/payments/checkout', data);
        return response.data.data;
    },

    async cancelSubscription(): Promise<Subscription> {
        const response = await api.post<ApiResponse<Subscription>>('/payments/cancel');
        return response.data.data;
    },

    async verifyPayment(paymentId: string): Promise<{ verified: boolean; paymentId: string }> {
        const response = await api.post<ApiResponse<{ verified: boolean; paymentId: string }>>('/payments/verify', { paymentId });
        return response.data.data;
    },

    // Admin methods
    async getAllSubscriptions(): Promise<AdminSubscription[]> {
        const response = await api.get<ApiResponse<AdminSubscription[]>>('/payments/admin/subscriptions');
        return response.data.data;
    },

    async getUserSubscription(userId: string): Promise<AdminSubscription | null> {
        const response = await api.get<ApiResponse<AdminSubscription | null>>(`/payments/admin/subscriptions/${userId}`);
        return response.data.data;
    },

    async updateSubscription(
        userId: string,
        data: { tier?: SubscriptionTier; status?: SubscriptionStatus },
    ): Promise<Subscription> {
        const response = await api.put<ApiResponse<Subscription>>(`/payments/admin/subscriptions/${userId}`, data);
        return response.data.data;
    },
};
