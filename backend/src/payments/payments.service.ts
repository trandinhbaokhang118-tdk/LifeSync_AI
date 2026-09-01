import {
  Injectable,
  NotFoundException,
  NotImplementedException,
  ServiceUnavailableException,
  ConflictException,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as crypto from 'crypto';
import {
  PaymentOrder,
  PaymentOrderStatus,
  PaymentProvider,
  Prisma,
  SubscriptionStatus,
  SubscriptionTier,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { CreateSubscriptionPlanDto } from './dto/create-subscription-plan.dto';

interface StripeWebhookPayload {
  type?: string;
  data?: {
    object?: {
      id?: string;
      payment_status?: string;
      status?: string;
      subscription?: string;
      metadata?: { userId?: string; tier?: SubscriptionTier };
    };
  };
}

interface SePayIpnPayload {
  timestamp?: number;
  notification_type?: string;
  order?: {
    id?: string;
    order_status?: string;
    order_currency?: string;
    order_amount?: string;
    order_invoice_number?: string;
  };
  transaction?: {
    id?: string;
    transaction_id?: string;
    transaction_status?: string;
    transaction_amount?: string;
    transaction_currency?: string;
  };
  customer?: {
    id?: string;
    customer_id?: string;
  };
}

interface SePayBankWebhookPayload {
  id?: number | string;
  gateway?: string;
  transactionDate?: string;
  accountNumber?: string;
  subAccount?: string | null;
  code?: string | null;
  content?: string;
  transferType?: string;
  description?: string;
  transferAmount?: number;
  accumulated?: number;
  referenceCode?: string;
}

interface StripeSubscription {
  id: string;
  status: string;
  current_period_start: number;
  current_period_end: number;
  customer: string | null;
}

interface UpdateSubscriptionInput {
  tier?: SubscriptionTier;
  status?: SubscriptionStatus;
}

@Injectable()
export class PaymentsService implements OnModuleInit {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  // Ensure the catalog of plans exists so the pricing page always has data.
  async onModuleInit() {
    try {
      await this.seedPlans();
    } catch {
      // Non-fatal: pricing page will simply show no plans if seeding fails.
    }
  }

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

    if (dto.provider === PaymentProvider.SEPAY) {
      return this.createSePayCheckout(user, plan);
    }

    if (dto.provider !== PaymentProvider.STRIPE) {
      throw new NotImplementedException(
        `Provider ${dto.provider} is not configured. Stripe is the supported live checkout provider for this deployment.`,
      );
    }

    const priceId = this.getStripePriceId(plan.tier);
    const frontendUrl = this.getRequiredConfig('FRONTEND_URL');
    const successUrl = new URL('/app/pricing', frontendUrl);
    successUrl.searchParams.set('checkout', 'success');
    successUrl.searchParams.set('session_id', '{CHECKOUT_SESSION_ID}');
    const cancelUrl = new URL('/app/pricing', frontendUrl);
    cancelUrl.searchParams.set('checkout', 'cancelled');

    const payload = new URLSearchParams({
      mode: 'subscription',
      success_url: successUrl.toString(),
      cancel_url: cancelUrl.toString(),
      customer_email: user.email,
      'line_items[0][price]': priceId,
      'line_items[0][quantity]': '1',
      'metadata[userId]': userId,
      'metadata[tier]': plan.tier,
    });
    const session = await this.stripeRequest<{
      id: string;
      url: string | null;
    }>('/checkout/sessions', 'post', payload);

    if (!session.url) {
      throw new ServiceUnavailableException('Stripe did not return a checkout URL.');
    }

    return {
      provider: PaymentProvider.STRIPE,
      checkoutUrl: session.url,
      sessionId: session.id,
      paymentId: session.id,
    };
  }

  async startTrial(userId: string, tier: SubscriptionTier = SubscriptionTier.PLUS) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const existing = await this.prisma.subscription.findUnique({
      where: { userId },
    });

    // Only allow a trial for users who have never had a paid/trial subscription.
    if (existing && existing.tier !== SubscriptionTier.FREE) {
      throw new ConflictException('Bạn đã sử dụng gói trả phí hoặc bản dùng thử trước đó.');
    }
    if (existing?.trialUsed) {
      throw new ConflictException('Bạn đã dùng thử trước đó. Vui lòng nâng cấp để tiếp tục.');
    }

    const now = new Date();
    const trialEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    return this.prisma.subscription.upsert({
      where: { userId },
      update: {
        tier,
        status: SubscriptionStatus.TRIALING,
        currentPeriodStart: now,
        currentPeriodEnd: trialEnd,
        canceledAt: null,
        trialUsed: true,
      },
      create: {
        userId,
        tier,
        status: SubscriptionStatus.TRIALING,
        currentPeriodStart: now,
        currentPeriodEnd: trialEnd,
        trialUsed: true,
      },
    });
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

  async handleWebhook(
    provider: PaymentProvider,
    payload: unknown,
    rawBody?: Buffer,
    signature?: string,
  ) {
    this.assertPaymentsEnabled();
    if (provider === PaymentProvider.SEPAY) {
      const sePayPayload = payload as SePayIpnPayload;
      if (sePayPayload.notification_type || sePayPayload.order) {
        return this.handleSePayIpn(sePayPayload, signature);
      }
      return this.handleSePayBankWebhook(payload as SePayBankWebhookPayload, signature);
    }
    if (provider !== PaymentProvider.STRIPE) {
      throw new NotImplementedException(`Webhook provider ${provider} is not configured.`);
    }
    if (!rawBody) {
      throw new ConflictException('Stripe webhook request body is unavailable.');
    }
    this.verifyStripeWebhookSignature(rawBody, signature);

    const stripePayload = payload as StripeWebhookPayload;
    const eventType = stripePayload.type ?? 'unknown';
    if (eventType !== 'checkout.session.completed') {
      return { received: true, processed: false, provider, eventType };
    }

    const session = stripePayload.data?.object;
    if (
      !session ||
      !['paid', 'no_payment_required'].includes(session.payment_status ?? '') ||
      !session.subscription ||
      !session.metadata?.userId ||
      !session.metadata.tier
    ) {
      throw new ConflictException('Stripe checkout event is missing completed subscription data.');
    }

    const stripeSubscription = await this.getStripeSubscription(session.subscription);
    const subscription = await this.upsertStripeSubscription(
      session.metadata.userId,
      session.metadata.tier,
      stripeSubscription,
    );

    return {
      received: true,
      processed: true,
      provider,
      eventType,
      subscriptionId: subscription.id,
    };
  }

  async verifyPayment(userId: string, paymentId: string) {
    this.assertPaymentsEnabled();
    if (!paymentId || paymentId.length > 255) {
      throw new NotFoundException('Payment session not found');
    }

    const sePayOrder = await this.prisma.paymentOrder.findUnique({
      where: { invoiceNumber: paymentId },
    });
    if (sePayOrder) {
      if (sePayOrder.userId !== userId) {
        throw new NotFoundException('Payment session not found');
      }
      if (sePayOrder.status !== PaymentOrderStatus.PAID) {
        throw new ConflictException('SePay payment is still pending confirmation.');
      }
      const subscription = await this.prisma.subscription.findUnique({ where: { userId } });
      return { verified: true, provider: PaymentProvider.SEPAY, subscription };
    }

    const session = await this.stripeRequest<{
      id: string;
      payment_status: string;
      status: string | null;
      subscription: string | null;
      metadata: { userId?: string; tier?: SubscriptionTier };
    }>(`/checkout/sessions/${encodeURIComponent(paymentId)}`, 'get');

    if (session.metadata?.userId !== userId) {
      throw new NotFoundException('Payment session not found');
    }
    if (session.payment_status !== 'paid' || !session.subscription || !session.metadata?.tier) {
      throw new ConflictException('Payment has not completed yet.');
    }

    const subscription = await this.upsertStripeSubscription(
      userId,
      session.metadata.tier,
      await this.getStripeSubscription(session.subscription),
    );

    return { verified: true, subscription };
  }

  private async createSePayCheckout(
    user: { id: string; email: string; name: string },
    plan: { tier: SubscriptionTier; priceVND: number },
  ) {
    if (plan.tier === SubscriptionTier.FREE || plan.priceVND <= 0) {
      throw new ConflictException('The Free plan does not require checkout.');
    }

    const merchantId = this.getRequiredConfig('SEPAY_MERCHANT_ID');
    const secretKey = this.getRequiredConfig('SEPAY_MERCHANT_SECRET_KEY');
    const environment =
      this.configService.get<string>('SEPAY_ENVIRONMENT')?.trim().toLowerCase() ?? 'production';
    if (!['sandbox', 'production'].includes(environment)) {
      throw new ServiceUnavailableException('SEPAY_ENVIRONMENT must be sandbox or production.');
    }

    const invoiceNumber = `LS-${plan.tier}-${Date.now().toString(36)}-${crypto.randomBytes(6).toString('hex')}`;
    const frontendUrl = this.getRequiredConfig('FRONTEND_URL');
    const successUrl = new URL('/app/pricing', frontendUrl);
    successUrl.searchParams.set('checkout', 'success');
    successUrl.searchParams.set('session_id', invoiceNumber);
    const errorUrl = new URL('/app/pricing', frontendUrl);
    errorUrl.searchParams.set('checkout', 'error');
    const cancelUrl = new URL('/app/pricing', frontendUrl);
    cancelUrl.searchParams.set('checkout', 'cancelled');

    const checkoutFields: Record<string, string> = {
      order_amount: String(plan.priceVND),
      merchant: merchantId,
      currency: 'VND',
      operation: 'PURCHASE',
      order_description: `LifeSync AI ${plan.tier} subscription`,
      order_invoice_number: invoiceNumber,
      customer_id: user.id,
      payment_method: 'BANK_TRANSFER',
      success_url: successUrl.toString(),
      error_url: errorUrl.toString(),
      cancel_url: cancelUrl.toString(),
    };
    checkoutFields.signature = this.signSePayCheckout(checkoutFields, secretKey);

    await this.prisma.paymentOrder.create({
      data: {
        userId: user.id,
        provider: PaymentProvider.SEPAY,
        invoiceNumber,
        tier: plan.tier,
        amountVND: plan.priceVND,
      },
    });

    const checkoutUrl =
      environment === 'sandbox'
        ? 'https://pay-sandbox.sepay.vn/v1/checkout/init'
        : 'https://pay.sepay.vn/v1/checkout/init';

    return {
      provider: PaymentProvider.SEPAY,
      checkoutUrl,
      checkoutFields,
      sessionId: invoiceNumber,
      paymentId: invoiceNumber,
      receiver: {
        bankName: this.getRequiredConfig('SEPAY_BANK_NAME'),
        accountNumber: this.getRequiredConfig('SEPAY_BANK_ACCOUNT_NUMBER'),
        accountName: this.getRequiredConfig('SEPAY_BANK_ACCOUNT_NAME'),
      },
    };
  }

  private signSePayCheckout(fields: Record<string, string>, secretKey: string) {
    const signedFieldNames = [
      'order_amount',
      'merchant',
      'currency',
      'operation',
      'order_description',
      'order_invoice_number',
      'customer_id',
      'payment_method',
      'success_url',
      'error_url',
      'cancel_url',
    ];
    const signedString = signedFieldNames
      .filter((fieldName) => fields[fieldName] !== undefined)
      .map((fieldName) => `${fieldName}=${fields[fieldName]}`)
      .join(',');
    return crypto.createHmac('sha256', secretKey).update(signedString).digest('base64');
  }

  private async handleSePayIpn(payload: SePayIpnPayload, suppliedSecret?: string) {
    this.verifySePaySecret(suppliedSecret);

    const invoiceNumber = payload.order?.order_invoice_number;
    if (!invoiceNumber) {
      throw new ConflictException('SePay IPN is missing order_invoice_number.');
    }

    const paymentOrder = await this.prisma.paymentOrder.findUnique({
      where: { invoiceNumber },
    });
    if (!paymentOrder || paymentOrder.provider !== PaymentProvider.SEPAY) {
      throw new NotFoundException('SePay payment order not found.');
    }

    if (payload.notification_type === 'TRANSACTION_VOID') {
      await this.prisma.$transaction(async (transaction) => {
        await transaction.paymentOrder.update({
          where: { id: paymentOrder.id },
          data: { status: PaymentOrderStatus.VOID },
        });
        await transaction.subscription.updateMany({
          where: {
            userId: paymentOrder.userId,
            provider: PaymentProvider.SEPAY,
            providerSubId: paymentOrder.providerOrderId ?? payload.order?.id ?? invoiceNumber,
          },
          data: {
            status: SubscriptionStatus.CANCELED,
            canceledAt: new Date(),
          },
        });
      });
      return { success: true, processed: true, eventType: payload.notification_type };
    }

    if (payload.notification_type !== 'ORDER_PAID') {
      return { success: true, processed: false, eventType: payload.notification_type ?? 'unknown' };
    }

    const orderAmount = this.parseSePayAmount(payload.order?.order_amount, 'order_amount');
    const transactionAmount = this.parseSePayAmount(
      payload.transaction?.transaction_amount,
      'transaction_amount',
    );
    if (
      payload.order?.order_status !== 'CAPTURED' ||
      payload.transaction?.transaction_status !== 'APPROVED' ||
      payload.order?.order_currency !== 'VND' ||
      payload.transaction?.transaction_currency !== 'VND' ||
      orderAmount !== paymentOrder.amountVND ||
      transactionAmount !== paymentOrder.amountVND
    ) {
      throw new ConflictException('SePay IPN payment details do not match the pending order.');
    }

    const transactionId = payload.transaction?.transaction_id ?? payload.transaction?.id;
    if (!transactionId) {
      throw new ConflictException('SePay IPN is missing transaction ID.');
    }
    const result = await this.activateSePayOrder(
      paymentOrder,
      payload.order?.id ?? invoiceNumber,
      transactionId,
      payload.customer?.customer_id ?? payload.customer?.id,
    );

    return {
      success: true,
      processed: result.processed,
      eventType: payload.notification_type,
      subscriptionId: result.subscriptionId,
    };
  }

  private async handleSePayBankWebhook(payload: SePayBankWebhookPayload, authorization?: string) {
    this.verifySePayWebhookApiKey(authorization);

    if (
      payload.transferType !== 'in' ||
      payload.accountNumber !== this.getRequiredConfig('SEPAY_BANK_ACCOUNT_NUMBER') ||
      this.normalizeBankName(payload.gateway) !==
        this.normalizeBankName(this.getRequiredConfig('SEPAY_BANK_NAME'))
    ) {
      return { success: true, processed: false, eventType: 'BANK_TRANSACTION_IGNORED' };
    }

    const invoiceNumber = this.extractSePayInvoiceNumber(payload);
    if (!invoiceNumber) {
      return { success: true, processed: false, eventType: 'BANK_TRANSACTION_UNMATCHED' };
    }

    const paymentOrder = await this.prisma.paymentOrder.findUnique({
      where: { invoiceNumber },
    });
    if (!paymentOrder || paymentOrder.provider !== PaymentProvider.SEPAY) {
      return { success: true, processed: false, eventType: 'BANK_TRANSACTION_UNMATCHED' };
    }
    if (
      !Number.isSafeInteger(payload.transferAmount) ||
      payload.transferAmount !== paymentOrder.amountVND
    ) {
      throw new ConflictException('SePay webhook amount does not match the pending order.');
    }
    if (payload.id === undefined || payload.id === null) {
      throw new ConflictException('SePay webhook is missing transaction ID.');
    }

    const result = await this.activateSePayOrder(
      paymentOrder,
      String(payload.id),
      `sepay-bank-${payload.id}`,
    );
    return {
      success: true,
      processed: result.processed,
      eventType: 'BANK_TRANSACTION_IN',
      subscriptionId: result.subscriptionId,
    };
  }

  private async activateSePayOrder(
    paymentOrder: PaymentOrder,
    providerOrderId: string,
    transactionId: string,
    customerId?: string,
  ) {
    if (paymentOrder.status === PaymentOrderStatus.PAID) {
      if (paymentOrder.transactionId !== transactionId) {
        throw new ConflictException('SePay payment order was already paid by another transaction.');
      }
      return { processed: false, subscriptionId: undefined as string | undefined };
    }
    if (paymentOrder.status !== PaymentOrderStatus.PENDING) {
      throw new ConflictException(`SePay payment order is ${paymentOrder.status.toLowerCase()}.`);
    }

    return this.prisma.$transaction(async (transaction) => {
      const claimed = await transaction.paymentOrder.updateMany({
        where: { id: paymentOrder.id, status: PaymentOrderStatus.PENDING },
        data: {
          status: PaymentOrderStatus.PAID,
          providerOrderId,
          transactionId,
          paidAt: new Date(),
        },
      });
      if (claimed.count === 0) {
        return { processed: false, subscriptionId: undefined as string | undefined };
      }

      const now = new Date();
      const existingSubscription = await transaction.subscription.findUnique({
        where: { userId: paymentOrder.userId },
      });
      const periodStart =
        existingSubscription?.status === SubscriptionStatus.ACTIVE &&
        existingSubscription.currentPeriodEnd > now
          ? existingSubscription.currentPeriodEnd
          : now;
      const periodEnd = new Date(periodStart.getTime() + 30 * 24 * 60 * 60 * 1000);
      const subscription = await transaction.subscription.upsert({
        where: { userId: paymentOrder.userId },
        update: {
          tier: paymentOrder.tier,
          status: SubscriptionStatus.ACTIVE,
          provider: PaymentProvider.SEPAY,
          providerSubId: providerOrderId,
          providerCustomerId: customerId,
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
          canceledAt: null,
        },
        create: {
          userId: paymentOrder.userId,
          tier: paymentOrder.tier,
          status: SubscriptionStatus.ACTIVE,
          provider: PaymentProvider.SEPAY,
          providerSubId: providerOrderId,
          providerCustomerId: customerId,
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
        },
      });
      return { processed: true, subscriptionId: subscription.id };
    });
  }

  private verifySePaySecret(suppliedSecret?: string) {
    const expectedSecret =
      this.configService.get<string>('SEPAY_IPN_SECRET_KEY')?.trim() ||
      this.getRequiredConfig('SEPAY_SECRET_KEY');
    if (!suppliedSecret) {
      throw new UnauthorizedException('Missing SePay secret key.');
    }
    const expected = Buffer.from(expectedSecret);
    const actual = Buffer.from(suppliedSecret);
    if (expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual)) {
      throw new UnauthorizedException('Invalid SePay secret key.');
    }
  }

  private verifySePayWebhookApiKey(authorization?: string) {
    const expectedApiKey = this.getRequiredConfig('SEPAY_WEBHOOK_API_KEY');
    if (!authorization?.startsWith('Apikey ')) {
      throw new UnauthorizedException('Missing SePay webhook API key.');
    }
    const suppliedApiKey = authorization.slice('Apikey '.length).trim();
    const expected = Buffer.from(expectedApiKey);
    const actual = Buffer.from(suppliedApiKey);
    if (expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual)) {
      throw new UnauthorizedException('Invalid SePay webhook API key.');
    }
  }

  private extractSePayInvoiceNumber(payload: SePayBankWebhookPayload) {
    const code = payload.code?.trim();
    if (code?.toUpperCase().startsWith('LS-')) {
      return code;
    }
    return payload.content?.match(/LS-(?:PRO|PLUS)-[a-z0-9]+-[a-f0-9]{12}/i)?.[0];
  }

  private normalizeBankName(value?: string) {
    return value?.replace(/[^a-z0-9]/gi, '').toLowerCase() ?? '';
  }

  private parseSePayAmount(value: string | undefined, fieldName: string) {
    const amount = Number(value);
    if (!Number.isSafeInteger(amount) || amount <= 0) {
      throw new ConflictException(`Invalid SePay ${fieldName}.`);
    }
    return amount;
  }

  private async getStripeSubscription(subscriptionId: string): Promise<StripeSubscription> {
    const stripeSubscription = await this.stripeRequest<StripeSubscription>(
      `/subscriptions/${encodeURIComponent(subscriptionId)}`,
      'get',
    );
    if (!['active', 'trialing'].includes(stripeSubscription.status)) {
      throw new ConflictException('Stripe subscription is not active.');
    }
    return stripeSubscription;
  }

  private async upsertStripeSubscription(
    userId: string,
    tier: SubscriptionTier,
    stripeSubscription: StripeSubscription,
  ) {
    const status =
      stripeSubscription.status === 'trialing'
        ? SubscriptionStatus.TRIALING
        : SubscriptionStatus.ACTIVE;
    return this.prisma.subscription.upsert({
      where: { userId },
      update: {
        tier,
        status,
        provider: PaymentProvider.STRIPE,
        providerSubId: stripeSubscription.id,
        providerCustomerId: stripeSubscription.customer,
        currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
        canceledAt: null,
      },
      create: {
        userId,
        tier,
        status,
        provider: PaymentProvider.STRIPE,
        providerSubId: stripeSubscription.id,
        providerCustomerId: stripeSubscription.customer,
        currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
      },
    });
  }

  private getRequiredConfig(key: string) {
    const value = this.configService.get<string>(key)?.trim();
    if (!value) {
      throw new ServiceUnavailableException(`${key} is not configured.`);
    }
    return value;
  }

  private getStripePriceId(tier: SubscriptionTier) {
    if (tier === SubscriptionTier.PRO) return this.getRequiredConfig('STRIPE_PRO_PRICE_ID');
    if (tier === SubscriptionTier.PLUS) return this.getRequiredConfig('STRIPE_PLUS_PRICE_ID');
    throw new ConflictException('The Free plan does not require checkout.');
  }

  private verifyStripeWebhookSignature(rawBody: Buffer, signature?: string) {
    const webhookSecret = this.getRequiredConfig('STRIPE_WEBHOOK_SECRET');
    if (!signature) {
      throw new ConflictException('Missing Stripe webhook signature.');
    }

    const parts = new Map(
      signature.split(',').map((part) => {
        const [key, value] = part.split('=', 2);
        return [key, value];
      }),
    );
    const timestamp = parts.get('t');
    const expectedSignature = parts.get('v1');
    if (!timestamp || !expectedSignature || !/^\d+$/.test(timestamp)) {
      throw new ConflictException('Invalid Stripe webhook signature.');
    }
    if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) {
      throw new ConflictException('Expired Stripe webhook signature.');
    }

    const computed = crypto
      .createHmac('sha256', webhookSecret)
      .update(`${timestamp}.${rawBody.toString('utf8')}`)
      .digest('hex');
    const expected = Buffer.from(expectedSignature, 'hex');
    const actual = Buffer.from(computed, 'hex');
    if (expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual)) {
      throw new ConflictException('Invalid Stripe webhook signature.');
    }
  }

  private async stripeRequest<T>(
    path: string,
    method: 'get' | 'post',
    data?: URLSearchParams,
  ): Promise<T> {
    const secretKey = this.getRequiredConfig('STRIPE_SECRET_KEY');
    try {
      const response = await axios.request<T>({
        method,
        url: `https://api.stripe.com/v1${path}`,
        data,
        headers: {
          Authorization: `Bearer ${secretKey}`,
          ...(data ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}),
        },
        timeout: 15_000,
      });
      return response.data;
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.error?.message || error.message
        : (error as Error).message;
      throw new ServiceUnavailableException(`Stripe request failed: ${message}`);
    }
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
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Upsert so admins can set a tier/status for users who have no
    // subscription row yet (getSubscription returns a synthetic FREE tier,
    // so most users never persist one until an admin changes it).
    const now = new Date();
    const oneMonthLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    return this.prisma.subscription.upsert({
      where: { userId },
      update: data,
      create: {
        userId,
        tier: data.tier ?? SubscriptionTier.FREE,
        status: data.status ?? SubscriptionStatus.ACTIVE,
        currentPeriodStart: now,
        currentPeriodEnd: oneMonthLater,
      },
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
