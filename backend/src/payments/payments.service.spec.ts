import axios from 'axios';
import { PaymentProvider as CheckoutProvider, SubscriptionTier as CheckoutTier } from './dto/create-checkout.dto';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentOrderStatus, PaymentProvider, SubscriptionTier } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentsService } from './payments.service';

describe('PaymentsService SePay IPN', () => {
  const secretKey = 'test-sepay-secret';
  const webhookApiKey = 'test-webhook-api-key';
  const payload = {
    timestamp: 1_757_058_220,
    notification_type: 'ORDER_PAID',
    order: {
      id: 'sepay-order-id',
      order_status: 'CAPTURED',
      order_currency: 'VND',
      order_amount: '1000.00',
      order_invoice_number: 'LS-PRO-TEST',
    },
    transaction: {
      id: 'sepay-transaction-id',
      transaction_id: 'transaction-123',
      transaction_status: 'APPROVED',
      transaction_amount: '1000',
      transaction_currency: 'VND',
    },
    customer: {
      id: 'sepay-customer-id',
      customer_id: 'user-1',
    },
  };

  function createService(orderOverrides: Record<string, unknown> = {}) {
    const paymentOrder = {
      id: 'payment-order-1',
      userId: 'user-1',
      provider: PaymentProvider.SEPAY,
      invoiceNumber: 'LS-PRO-TEST',
      tier: SubscriptionTier.PRO,
      amountVND: 1_000,
      status: PaymentOrderStatus.PENDING,
      providerOrderId: null,
      transactionId: null,
      paidAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...orderOverrides,
    };
    const transaction = {
      paymentOrder: {
        update: jest.fn(),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      subscription: {
        findUnique: jest.fn().mockResolvedValue(null),
        updateMany: jest.fn(),
        upsert: jest.fn().mockResolvedValue({ id: 'subscription-1' }),
      },
    };
    const prisma = {
      paymentOrder: {
        findUnique: jest.fn().mockResolvedValue(paymentOrder),
      },
      $transaction: jest.fn((callback: (client: typeof transaction) => unknown) =>
        callback(transaction),
      ),
    };
    const config = {
      get: jest.fn((key: string) => {
        if (key === 'SEPAY_MERCHANT_ID') return 'merchant-test';
        if (key === 'SEPAY_MERCHANT_SECRET_KEY') return 'merchant-secret-test';
        if (key === 'PAYMENTS_ENABLED') return 'true';
        if (key === 'SEPAY_IPN_SECRET_KEY') return secretKey;
        if (key === 'SEPAY_WEBHOOK_API_KEY') return webhookApiKey;
        if (key === 'SEPAY_BANK_ACCOUNT_NUMBER') return '105879514995';
        if (key === 'SEPAY_BANK_NAME') return 'VietinBank';
        return undefined;
      }),
    };
    const service = new PaymentsService(
      prisma as unknown as PrismaService,
      config as unknown as ConfigService,
    );

    return { service, prisma, transaction };
  }

  afterEach(() => jest.restoreAllMocks());

  const gatewayBank = { id: 85661022, gateway: 'VietinBank', accountNumber: '105879514995', code: 'PAY35766ABBF684D465C', content: '149218253050-SEVQR PAY35766ABBF684D465C', transferType: 'in', transferAmount: 2000 };
  const gatewayOrder = { id: '200168', order_id: 'PAY35766ABBF684D465C', order_invoice_number: 'LS-PRO-TEST', order_currency: 'VND', order_amount: '1000', customer_id: 'user-1', order_status: 'AUTHENTICATION_NOT_NEEDED' };

  it('resolves a hosted checkout reference and activates a verified overpayment', async () => {
    const lookup = jest.spyOn(axios, 'get').mockResolvedValue({ data: { data: gatewayOrder } });
    const { service, transaction, prisma } = createService();
    await expect(service.handleWebhook(PaymentProvider.SEPAY, gatewayBank, undefined, `Apikey ${webhookApiKey}`)).resolves.toMatchObject({ processed: true });
    expect(lookup).toHaveBeenCalledWith('https://pgapi.sepay.vn/v1/order/detail/PAY35766ABBF684D465C', expect.objectContaining({ auth: { username: 'merchant-test', password: 'merchant-secret-test' }, maxRedirects: 0 }));
    expect(prisma.paymentOrder.findUnique).toHaveBeenCalledWith({ where: { invoiceNumber: 'LS-PRO-TEST' } });
    expect(transaction.paymentOrder.updateMany).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ receivedAmountVND: 2000, transactionId: 'sepay-bank-85661022' }) }));
  });

  it.each([{ customer_id: 'other-user' }, { order_amount: '99000' }, { order_currency: 'USD' }, { order_id: 'PAY_OTHER' }, { order_status: 'CANCELLED' }])('rejects inconsistent merchant data %j', async invalid => {
    jest.spyOn(axios, 'get').mockResolvedValue({ data: { data: { ...gatewayOrder, ...invalid } } });
    const { service, transaction } = createService();
    await expect(service.handleWebhook(PaymentProvider.SEPAY, gatewayBank, undefined, `Apikey ${webhookApiKey}`)).rejects.toThrow();
    expect(transaction.subscription.upsert).not.toHaveBeenCalled();
  });

  it('returns an error on gateway lookup failure so the webhook can be retried', async () => {
    jest.spyOn(axios, 'get').mockRejectedValue(new Error('offline'));
    const { service, transaction } = createService();
    await expect(service.handleWebhook(PaymentProvider.SEPAY, gatewayBank, undefined, `Apikey ${webhookApiKey}`)).rejects.toThrow('Unable to verify');
    expect(transaction.subscription.upsert).not.toHaveBeenCalled();
  });

  it('authenticates the bank callback before querying the gateway', async () => {
    const lookup = jest.spyOn(axios, 'get');
    await expect(createService().service.handleWebhook(PaymentProvider.SEPAY, gatewayBank, undefined, 'Apikey wrong')).rejects.toThrow();
    expect(lookup).not.toHaveBeenCalled();
  });

  it('rejects an IPN with the wrong secret', async () => {
    const { service } = createService();

    await expect(
      service.handleWebhook(PaymentProvider.SEPAY, payload, undefined, 'wrong-secret'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('activates the matching subscription exactly once', async () => {
    const { service, transaction } = createService();

    await expect(
      service.handleWebhook(PaymentProvider.SEPAY, payload, undefined, secretKey),
    ).resolves.toMatchObject({ success: true, processed: true, subscriptionId: 'subscription-1' });
    expect(transaction.paymentOrder.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'payment-order-1', status: PaymentOrderStatus.PENDING },
      }),
    );
    expect(transaction.subscription.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'user-1' },
        update: expect.objectContaining({
          tier: SubscriptionTier.PRO,
          provider: PaymentProvider.SEPAY,
        }),
      }),
    );
  });

  it('activates a 1000 VND order from an authenticated 2000 VND IPN and records the received amount', async () => {
    const { service, transaction } = createService();
    const overpaid = { ...payload, transaction: { ...payload.transaction, transaction_amount: '2000' } };
    await expect(service.handleWebhook(PaymentProvider.SEPAY, overpaid, undefined, secretKey)).resolves.toMatchObject({ processed: true });
    expect(transaction.paymentOrder.updateMany).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ receivedAmountVND: 2000 }) }));
    expect(transaction.subscription.upsert).toHaveBeenCalledTimes(1);
  });

  it('still rejects an IPN with a mismatched order total even if the transfer is sufficient', async () => {
    const { service, transaction } = createService();
    const wrongOrder = { ...payload, order: { ...payload.order, order_amount: '2000' }, transaction: { ...payload.transaction, transaction_amount: '2000' } };
    await expect(service.handleWebhook(PaymentProvider.SEPAY, wrongOrder, undefined, secretKey)).rejects.toThrow();
    expect(transaction.subscription.upsert).not.toHaveBeenCalled();
  });

  it.each([1000, 2000])('accepts and records a bank transfer of %i VND for a 1000 VND order', async amount => {
    const { service, transaction } = createService();
    const bank = { id: 92704, gateway: 'VietinBank', accountNumber: '105879514995', code: 'LS-PRO-TEST', transferType: 'in', transferAmount: amount };
    await expect(service.handleWebhook(PaymentProvider.SEPAY, bank, undefined, `Apikey ${webhookApiKey}`)).resolves.toMatchObject({ processed: true });
    expect(transaction.paymentOrder.updateMany).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ receivedAmountVND: amount }) }));
    expect(transaction.subscription.upsert).toHaveBeenCalledTimes(1);
  });

  it.each([500, 0, -2000, 2000.5, 2147483648])('rejects an insufficient or invalid bank amount %i', async amount => {
    const { service, transaction } = createService();
    const bank = { id: 92704, gateway: 'VietinBank', accountNumber: '105879514995', code: 'LS-PRO-TEST', transferType: 'in', transferAmount: amount };
    await expect(service.handleWebhook(PaymentProvider.SEPAY, bank, undefined, `Apikey ${webhookApiKey}`)).rejects.toThrow();
    expect(transaction.subscription.upsert).not.toHaveBeenCalled();
  });

  it('does not activate an overpayment received by the wrong bank account', async () => {
    const { service, transaction } = createService();
    const bank = { id: 92704, gateway: 'VietinBank', accountNumber: 'wrong', code: 'LS-PRO-TEST', transferType: 'in', transferAmount: 2000 };
    await expect(service.handleWebhook(PaymentProvider.SEPAY, bank, undefined, `Apikey ${webhookApiKey}`)).resolves.toMatchObject({ processed: false });
    expect(transaction.subscription.upsert).not.toHaveBeenCalled();
  });

  it('acknowledges a retried overpayment without granting another month', async () => {
    const { service, prisma } = createService({ status: PaymentOrderStatus.PAID, transactionId: 'sepay-bank-92704' });
    const bank = { id: 92704, gateway: 'VietinBank', accountNumber: '105879514995', code: 'LS-PRO-TEST', transferType: 'in', transferAmount: 2000 };
    await expect(service.handleWebhook(PaymentProvider.SEPAY, bank, undefined, `Apikey ${webhookApiKey}`)).resolves.toMatchObject({ processed: false });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('preserves the amount of orders created before the price change', async () => {
    const { service, transaction } = createService({ amountVND: 99000 });
    const oldPayload = { ...payload, order: { ...payload.order, order_amount: '99000' }, transaction: { ...payload.transaction, transaction_amount: '99000' } };
    await expect(service.handleWebhook(PaymentProvider.SEPAY, oldPayload, undefined, secretKey)).resolves.toMatchObject({ processed: true });
    expect(transaction.subscription.upsert).toHaveBeenCalledTimes(1);
  });

  it('rejects an underpaid Pro order without activating access', async () => {
    const { service, transaction } = createService();
    const underpaid = { ...payload, transaction: { ...payload.transaction, transaction_amount: '500' } };
    await expect(service.handleWebhook(PaymentProvider.SEPAY, underpaid, undefined, secretKey)).rejects.toThrow();
    expect(transaction.subscription.upsert).not.toHaveBeenCalled();
  });

  it('acknowledges a retry of the same paid transaction without processing it again', async () => {
    const { service, prisma } = createService({
      status: PaymentOrderStatus.PAID,
      transactionId: 'transaction-123',
    });

    await expect(
      service.handleWebhook(PaymentProvider.SEPAY, payload, undefined, secretKey),
    ).resolves.toMatchObject({ success: true, processed: false });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('accepts an authenticated bank webhook and matches its payment code', async () => {
    const { service, transaction } = createService();
    const bankWebhook = {
      id: 92_704,
      gateway: 'VietinBank',
      transactionDate: '2026-08-24 19:30:00',
      accountNumber: '105879514995',
      code: 'LS-PRO-TEST',
      content: 'LS-PRO-TEST thanh toan LifeSync AI',
      transferType: 'in',
      transferAmount: 1_000,
      referenceCode: 'FT24012345678',
    };

    await expect(
      service.handleWebhook(
        PaymentProvider.SEPAY,
        bankWebhook,
        undefined,
        `Apikey ${webhookApiKey}`,
      ),
    ).resolves.toMatchObject({ success: true, processed: true, eventType: 'BANK_TRANSACTION_IN' });
    expect(transaction.paymentOrder.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ transactionId: 'sepay-bank-92704' }),
      }),
    );
  });
});


describe('Pro monthly catalog and checkout', () => {
  function setup() {
    const db = {
      subscriptionPlan: { upsert: jest.fn(), findUnique: jest.fn().mockResolvedValue({ tier: 'PRO', priceVND: 1000, isActive: true }) },
      user: { findUnique: jest.fn().mockResolvedValue({ id: 'u1', email: 'test@example.com' }) },
      paymentOrder: { create: jest.fn() },
      subscription: { findUnique: jest.fn().mockResolvedValue({ tier: 'PRO', status: 'ACTIVE', currentPeriodEnd: new Date(0) }) },
    };
    const values: Record<string, string> = { PAYMENTS_ENABLED: 'true', SEPAY_MERCHANT_ID: 'test', SEPAY_MERCHANT_SECRET_KEY: 'test-secret', FRONTEND_URL: 'https://example.com', SEPAY_BANK_NAME: 'test', SEPAY_BANK_ACCOUNT_NUMBER: 'test', SEPAY_BANK_ACCOUNT_NAME: 'test' };
    return { db, service: new PaymentsService(db as never, { get: (key: string) => values[key] } as never) };
  }
  it('seeds missing tiers without overwriting existing admin configuration', async () => {
    const { service, db } = setup();
    await service.seedPlans();
    expect(db.subscriptionPlan.upsert).toHaveBeenCalledTimes(3);
    expect(db.subscriptionPlan.upsert).toHaveBeenCalledWith(expect.objectContaining({ where: { tier: 'PRO' }, create: expect.objectContaining({ priceVND: 1000, interval: 'month' }), update: {} }));
  });
  it('charges exactly 1000 VND for a new Pro order', async () => {
    const { service, db } = setup();
    const checkout = await service.createCheckout('u1', { tier: CheckoutTier.PRO, provider: CheckoutProvider.SEPAY });
    expect(checkout).toMatchObject({ checkoutFields: { order_amount: '1000', currency: 'VND' } });
    expect(db.paymentOrder.create).toHaveBeenCalledWith({ data: expect.objectContaining({ userId: 'u1', amountVND: 1000, tier: 'PRO' }) });
  });
  it('does not charge a stale Stripe price for Pro', async () => {
    await expect(setup().service.createCheckout('u1', { tier: CheckoutTier.PRO, provider: CheckoutProvider.STRIPE })).rejects.toThrow('SePay');
  });
  it('returns effective Free access after Pro expires', async () => {
    await expect(setup().service.getSubscription('u1')).resolves.toMatchObject({ tier: 'FREE' });
  });
});
