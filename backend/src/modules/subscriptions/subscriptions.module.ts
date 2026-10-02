import { Module } from '@nestjs/common';
import { PlansController } from './plans.controller';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
@Module({ controllers: [PlansController, BillingController], providers: [BillingService] })
export class SubscriptionsModule {}
