import { Controller, Post, Body, Req, UseGuards, Inject, RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { z } from 'zod';
import { SkipThrottle } from '@nestjs/throttler';
import { AuthGuard, type AuthRequest } from '../../common/guards/auth.guard';
import { BillingService } from './billing.service';
@Controller()
export class BillingController {
  constructor(@Inject(BillingService) private readonly billing: BillingService) {}
  @Post('subscriptions/checkout') @UseGuards(AuthGuard) checkout(@Req() r: AuthRequest, @Body() b: unknown) { return this.billing.provider.checkout(r.user.id, z.object({ planCode: z.string().regex(/^[A-Z_]{1,40}$/) }).strict().parse(b).planCode); }
  @Post('subscriptions/portal') @UseGuards(AuthGuard) portal(@Req() r: AuthRequest) { return this.billing.provider.portal(r.user.id); }
  @Post('billing/webhook') @SkipThrottle() webhook(@Req() r: RawBodyRequest<Request>) { return this.billing.webhook(r.rawBody, typeof r.headers['stripe-signature'] === 'string' ? r.headers['stripe-signature'] : undefined); }
}
