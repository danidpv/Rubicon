import { ForbiddenException, Injectable } from '@nestjs/common';
import { db } from '../../database/prisma';
export function grantsAccess(planModules: string[], grants: { module: string; expiresAt: Date | null; revokedAt: Date | null }[], module: string, now = new Date()) { return planModules.includes(module) || grants.some(g => g.module === module && !g.revokedAt && (!g.expiresAt || g.expiresAt > now)); }
@Injectable()
export class EntitlementService {
  async current(userId: string) {
    const [subscription, grants] = await Promise.all([db.subscription.findUnique({ where: { userId }, include: { plan: true } }), db.manualEntitlement.findMany({ where: { userId, revokedAt: null, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] } })]);
    const active = subscription?.status === 'ACTIVE' && (!subscription.currentPeriodEnd || subscription.currentPeriodEnd > new Date());
    return { plan: subscription?.plan ?? null, status: subscription?.status ?? 'NONE', provider: subscription?.provider ?? null, modules: [...new Set([...(active ? subscription.plan.modules : []), ...grants.map(g => g.module)])], free: !subscription || subscription.plan.code === 'GRATIS' };
  }
  async require(userId: string, module: string, freeContent = false) { const access = await this.current(userId); if (!access.modules.includes(module) && !(freeContent && access.free)) throw new ForbiddenException({ code: 'ENTITLEMENT_REQUIRED', message: 'Este contenido no está incluido en tu plan.' }); return access; }
}
