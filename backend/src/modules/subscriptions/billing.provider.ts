import { BadRequestException, NotFoundException } from '@nestjs/common';
import Stripe from 'stripe';
import { z } from 'zod';
import { db } from '../../database/prisma';
import { env } from '../../config/env';
export interface BillingProvider { checkout(userId: string, planCode: string): Promise<{ url: string; mock: boolean }>; portal(userId: string): Promise<{ url: string; mock: boolean }>; }
export class MockBillingProvider implements BillingProvider {
  async checkout(userId: string, planCode: string) {
    const plan = await db.plan.findFirst({ where: { code: planCode, active: true } }); if (!plan) throw new NotFoundException();
    await db.subscription.upsert({ where: { userId }, create: { userId, planId: plan.id, provider: 'mock' }, update: { planId: plan.id, provider: 'mock', status: 'ACTIVE', currentPeriodEnd: null } });
    return { url: '/app/suscripcion?actualizado=1', mock: true };
  }
  async portal(_userId: string) { return { url: '/app/suscripcion', mock: true }; }
}
export class StripeBillingProvider implements BillingProvider {
  readonly stripe = new Stripe(env.STRIPE_SECRET_KEY);
  readonly prices = z.record(z.string(), z.string().startsWith('price_')).parse(JSON.parse(env.STRIPE_PRICE_MAP));
  async checkout(userId: string, planCode: string) {
    const plan = await db.plan.findFirst({ where: { code: planCode, active: true } }); if (!plan) throw new NotFoundException();
    const current = await db.subscription.findUnique({ where: { userId } });
    if (current?.externalId) return this.portal(userId);
    if (!this.prices[plan.code]) throw new BadRequestException({ code: 'BILLING_NOT_CONFIGURED', message: 'Este plan todavía no tiene un precio de pago configurado.' });
    const user = await db.user.findUniqueOrThrow({ where: { id: userId } });
    const customerId = current?.customerId ?? (await this.stripe.customers.create({ email: user.email, metadata: { userId } }, { idempotencyKey: `splocal-customer-${userId}` })).id;
    const free = await db.plan.findUniqueOrThrow({ where: { code: 'GRATIS' } });
    await db.subscription.upsert({ where: { userId }, create: { userId, planId: free.id, provider: 'stripe', customerId }, update: { customerId } });
    const session = await this.stripe.checkout.sessions.create({ customer: customerId, mode: 'subscription', line_items: [{ price: this.prices[plan.code], quantity: 1 }], subscription_data: { metadata: { userId } }, success_url: `${env.FRONTEND_URL}/app/suscripcion`, cancel_url: `${env.FRONTEND_URL}/app/suscripcion` }, { idempotencyKey: `checkout-${userId}-${plan.code}-${Math.floor(Date.now() / 300000)}` });
    if (!session.url) throw new Error('No checkout URL'); return { url: session.url, mock: false };
  }
  async portal(userId: string) { const s = await db.subscription.findUnique({ where: { userId } }); if (!s?.customerId) throw new BadRequestException({ code: 'NO_CUSTOMER', message: 'Todavía no tienes una suscripción de pago.' }); const portal = await this.stripe.billingPortal.sessions.create({ customer: s.customerId, return_url: `${env.FRONTEND_URL}/app/suscripcion` }); return { url: portal.url, mock: false }; }
}
