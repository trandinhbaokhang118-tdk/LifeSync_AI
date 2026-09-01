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
      order_amount: '99000.00',
      order_invoice_number: 'LS-PRO-TEST',
    },
    transaction: {
      id: 'sepay-transaction-id',
      transaction_id: 'transaction-123',
      transaction_status: 'APPROVED',
      transaction_amount: '99000',
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
      amountVND: 99_000,
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
      transferAmount: 99_000,
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
