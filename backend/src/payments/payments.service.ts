import {
  Injectable,
  NotFoundException,
  NotImplementedException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentProvider, Prisma, SubscriptionStatus, SubscriptionTier } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { CreateSubscriptionPlanDto } from './dto/create-subscription-plan.dto';

interface PaymentWebhookPayload {
  type?: string;
  data?: {
    object?: {
      customer_email?: string;
      customer_details?: {
        email?: string;
      };
    };
  };
}

interface UpdateSubscriptionInput {
  tier?: SubscriptionTier;
  status?: SubscriptionStatus;
}

@Injectable()
export class PaymentsService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  private isPaymentsEnabled() {
    return this.configService.get<string>('PAYMENTS_ENABLED') === 'true';
  }

  private assertPaymentsEnabled() {
    if (!this.isPaymentsEnabled()) {
      throw new ServiceUnavailableException(
        'Online billing is disabled for this deployment. Set PAYMENTS_ENABLED=true only after integrating a real payment gateway.',
      );
    }
  }

  async getPlans() {
    return this.prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async createPlan(dto: CreateSubscriptionPlanDto) {
    const planData: Prisma.SubscriptionPlanCreateInput = {
      ...dto,
      features: dto.features ?? [],
    };

    return this.prisma.subscriptionPlan.create({
      data: planData,
    });
  }

  async getSubscription(userId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
      include: { user: { select: { id: true, email: true, name: true } } },
    });

    if (!subscription) {
      // Return default free tier
      return {
        tier: 'FREE',
        status: 'ACTIVE',
        currentPeriodStart: new Date(),
        currentPeriodEnd: null,
      };
    }

    return subscription;
  }

  async createCheckout(userId: string, dto: CreateCheckoutDto) {
    this.assertPaymentsEnabled();

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { tier: dto.tier },
    });
    if (!plan) throw new NotFoundException('Plan not found');

    throw new NotImplementedException(
      `Checkout for ${dto.provider} is not wired in this build. Connect the provider SDK/API before enabling online billing for plan ${plan.tier}.`,
    );
  }

  async cancelSubscription(userId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription) {
      throw new NotFoundException('No active subscription found');
    }

    return this.prisma.subscription.update({
      where: { userId },
      data: {
        status: 'CANCELED',
        canceledAt: new Date(),
      },
    });
  }

  async handleWebhook(provider: PaymentProvider, payload: PaymentWebhookPayload) {
    if (!this.isPaymentsEnabled()) {
      return {
        received: false,
        processed: false,
        message:
          'Payment webhooks are ignored because online billing is disabled for this deployment.',
      };
    }

    return {
      received: true,
      processed: false,
      provider,
      eventType: payload.type ?? 'unknown',
      message:
        'Webhook verification and provider event handling must be implemented before turning on billing in production.',
    };
  }

  async verifyPayment(paymentId: string) {
    this.assertPaymentsEnabled();

    throw new NotImplementedException(
      `Payment verification is not wired in this build. Payment ${paymentId} was not verified.`,
    );
  }

  // Admin methods
  async getAllSubscriptions() {
    return this.prisma.subscription.findMany({
      include: { user: { select: { id: true, email: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getUserSubscriptionById(userId: string) {
    return this.prisma.subscription.findUnique({
      where: { userId },
      include: { user: { select: { id: true, email: true, name: true } } },
    });
  }

  async updateSubscription(userId: string, data: UpdateSubscriptionInput) {
    return this.prisma.subscription.update({
      where: { userId },
      data,
    });
  }

  // Seed default subscription plans
  async seedPlans() {
    const existingPlans = await this.prisma.subscriptionPlan.count();
    if (existingPlans > 0) return;

    const plans: Prisma.SubscriptionPlanCreateManyInput[] = [
      {
        tier: SubscriptionTier.FREE,
        name: 'Free',
        description: 'Basic features for everyone',
        priceVND: 0,
        priceUSD: 0,
        interval: 'month',
        features: ['Tasks & Calendar', 'Basic AI Assistant', '5 Time Blocks/day'],
        isActive: true,
        sortOrder: 1,
      },
      {
        tier: SubscriptionTier.PRO,
        name: 'Pro',
        description: 'Enhanced productivity',
        priceVND: 99000,
        priceUSD: 499,
        interval: 'month',
        features: [
          'Unlimited Tasks & Calendar',
          'Advanced AI Assistant',
          'Unlimited Time Blocks',
          'Basic Fitness Tracking',
          'No Ads',
          'Priority Support',
        ],
        isActive: true,
        sortOrder: 2,
      },
      {
        tier: SubscriptionTier.PLUS,
        name: 'Plus',
        description: 'Full experience with fitness',
        priceVND: 199000,
        priceUSD: 999,
        interval: 'month',
        features: [
          'Everything in Pro',
          'GPS Tracking',
          'Full Fitness Features',
          'Apple Health / Google Fit',
          'Cloud Sync',
          'Data Export',
          'Premium Support',
        ],
        isActive: true,
        sortOrder: 3,
      },
    ];

    await this.prisma.subscriptionPlan.createMany({ data: plans });
  }
}
