import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  UseGuards,
  Param,
  Req,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentProvider, SubscriptionStatus, SubscriptionTier } from '@prisma/client';
import { PaymentsService } from './payments.service';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { CreateSubscriptionPlanDto } from './dto/create-subscription-plan.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser, CurrentUserData } from '../common/decorators/current-user.decorator';

@ApiTags('payments')
@Controller('payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get('plans')
  @Roles('USER')
  @ApiOperation({ summary: 'Get all subscription plans' })
  async getPlans() {
    return this.paymentsService.getPlans();
  }

  @Post('plans')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create a subscription plan (admin only)' })
  async createPlan(@Body() dto: CreateSubscriptionPlanDto) {
    return this.paymentsService.createPlan(dto);
  }

  @Get('subscription')
  @Roles('USER')
  @ApiOperation({ summary: 'Get current user subscription' })
  async getSubscription(@CurrentUser() user: CurrentUserData) {
    return this.paymentsService.getSubscription(user.id);
  }

  @Post('checkout')
  @Roles('USER')
  @ApiOperation({ summary: 'Create checkout session' })
  async createCheckout(@CurrentUser() user: CurrentUserData, @Body() dto: CreateCheckoutDto) {
    return this.paymentsService.createCheckout(user.id, dto);
  }

  @Post('cancel')
  @Roles('USER')
  @ApiOperation({ summary: 'Cancel subscription' })
  async cancelSubscription(@CurrentUser() user: CurrentUserData) {
    return this.paymentsService.cancelSubscription(user.id);
  }

  @Post('trial')
  @Roles('USER')
  @ApiOperation({ summary: 'Start a 7-day Plus trial' })
  async startTrial(@CurrentUser() user: CurrentUserData) {
    return this.paymentsService.startTrial(user.id, SubscriptionTier.PLUS);
  }

  @Post('webhook/:provider')
  @HttpCode(HttpStatus.OK)
  @Public()
  @ApiOperation({ summary: 'Handle payment provider webhook' })
  async handleWebhook(
    @Param('provider') provider: string,
    @Body() payload: Record<string, unknown>,
    @Req() request: Request & { rawBody?: Buffer },
  ) {
    const normalizedProvider = provider.toUpperCase() as PaymentProvider;
    const signature =
      normalizedProvider === PaymentProvider.SEPAY
        ? (request.header('x-secret-key') ?? request.header('authorization'))
        : request.header('stripe-signature');
    if (normalizedProvider === PaymentProvider.STRIPE && !request.rawBody) {
      throw new BadRequestException('Webhook request body is unavailable.');
    }
    const result = await this.paymentsService.handleWebhook(
      normalizedProvider,
      payload,
      request.rawBody,
      signature,
    );
    if (normalizedProvider === PaymentProvider.SEPAY) {
      // The response interceptor skips objects containing `data`; undefined is
      // omitted by JSON serialization, leaving SePay's required {success:true}.
      return { success: true, data: undefined };
    }
    return result;
  }

  @Post('verify')
  @Roles('USER')
  @ApiOperation({ summary: 'Verify payment' })
  async verifyPayment(@CurrentUser() user: CurrentUserData, @Body('paymentId') paymentId: string) {
    return this.paymentsService.verifyPayment(user.id, paymentId);
  }

  // Admin endpoints
  @Get('admin/subscriptions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get all subscriptions (admin only)' })
  async getAllSubscriptions() {
    return this.paymentsService.getAllSubscriptions();
  }

  @Get('admin/subscriptions/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get user subscription by ID (admin only)' })
  async getUserSubscription(@Param('userId') userId: string) {
    return this.paymentsService.getUserSubscriptionById(userId);
  }

  @Put('admin/subscriptions/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update user subscription (admin only)' })
  async updateSubscription(
    @Param('userId') userId: string,
    @Body() data: { tier?: SubscriptionTier; status?: SubscriptionStatus },
  ) {
    return this.paymentsService.updateSubscription(userId, data);
  }
}
