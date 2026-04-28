import { IsString, IsOptional, IsNumber, IsBoolean, IsArray, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { SubscriptionTier } from '@prisma/client';

export class CreateSubscriptionPlanDto {
  @ApiProperty({ enum: SubscriptionTier })
  @IsEnum(SubscriptionTier)
  tier: SubscriptionTier;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty()
  @IsNumber()
  priceVND: number;

  @ApiProperty()
  @IsNumber()
  priceUSD: number;

  @ApiProperty({ required: false, default: 'month' })
  @IsString()
  @IsOptional()
  interval?: string;

  @ApiProperty({ required: false, type: [String] })
  @IsArray()
  @IsOptional()
  features?: string[];

  @ApiProperty({ required: false, default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({ required: false, default: 0 })
  @IsNumber()
  @IsOptional()
  sortOrder?: number;
}
