import { Injectable, BadRequestException } from '@nestjs/common';
import Stripe from 'stripe';
import { db } from '../../database/prisma';
import { env } from '../../config/env';
import { MockBillingProvider, StripeBillingProvider, type BillingProvider } from './billing.provider';
export function isNewerEvent(previous: Date | null, incoming: Date) { return !previous || incoming >= previous; }
@Injectable()
export class BillingService {
  readonly provider: BillingProvider = env.BILLING_PROVIDER === 'stripe' ? new StripeBillingProvider() : new MockBillingProvider();
  async webhook(raw: Buffer | undefined, signature: string | undefined) {
    if (!(this.provider instanceof StripeBillingProvider) || !raw || !signature) throw new BadRequestException();
    let event: Stripe.Event; try { event = this.provider.stripe.webhooks.constructEvent(raw, signature, env.STRIPE_WEBHOOK_SECRET); } catch { throw new BadRequestException({ code: 'INVALID_SIGNATURE', message: 'Firma inválida.' }); }
    const provider = this.provider;
    try {
      await db.$transaction(async tx => {
        await tx.billingEvent.create({ data: { providerEventId: event.id, type: event.type } });
        if (event.type === 'customer.subscription.created' || event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
          const subscription = event.data.object; const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id;
          const local = await tx.subscription.findUnique({ where: { customerId } }); if (!local) throw new Error('Unknown customer');
          const incoming = new Date(event.created * 1000); if (!isNewerEvent(local.providerEventAt, incoming)) return;
          const item = subscription.items.data[0]; const code = Object.keys(provider.prices).find(code => provider.prices[code] === item?.price.id);
          const plan = code ? await tx.plan.findUnique({ where: { code } }) : null;
          const active = ['active', 'trialing'].includes(subscription.status) && !!plan;
          await tx.subscription.update({ where: { id: local.id }, data: { ...(plan ? { planId: plan.id } : {}), externalId: subscription.id, provider: 'stripe', status: active ? 'ACTIVE' : subscription.status.toUpperCase(), currentPeriodEnd: item ? new Date(item.current_period_end * 1000) : new Date(), providerEventAt: incoming } });
        }
        if (event.type === 'invoice.payment_failed') {
          const customer = event.data.object.customer; const customerId = typeof customer === 'string' ? customer : customer?.id;
          if (customerId) await tx.subscription.updateMany({ where: { customerId, OR: [{ providerEventAt: null }, { providerEventAt: { lte: new Date(event.created * 1000) } }] }, data: { status: 'PAST_DUE', providerEventAt: new Date(event.created * 1000) } });
        }
      });
    } catch (error) {
      // Only a confirmed replay is a success; other unique violations must retry.
      if (!(typeof error === 'object' && error && 'code' in error && error.code === 'P2002' && await db.billingEvent.findUnique({ where: { providerEventId: event.id } }))) throw error;
    }
    return { received: true };
  }
}
