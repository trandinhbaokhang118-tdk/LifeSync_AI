import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum PaymentProvider {
  STRIPE = 'STRIPE',
  SEPAY = 'SEPAY',
  VNPAY = 'VNPAY',
  MOMO = 'MOMO',
  ZALOPAY = 'ZALOPAY',
}

export enum SubscriptionTier {
  FREE = 'FREE',
  PRO = 'PRO',
  PLUS = 'PLUS',
}

export class CreateCheckoutDto {
  @ApiProperty({ enum: SubscriptionTier })
  @IsEnum(SubscriptionTier)
  @IsNotEmpty()
  tier: SubscriptionTier;

  @ApiProperty({ enum: PaymentProvider, default: PaymentProvider.STRIPE })
  @IsEnum(PaymentProvider)
  provider: PaymentProvider = PaymentProvider.STRIPE;
}
