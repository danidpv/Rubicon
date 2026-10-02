import { Controller, Get, Req, UseGuards, Inject } from '@nestjs/common';
import { db } from '../../database/prisma';
import { AuthGuard, type AuthRequest } from '../../common/guards/auth.guard';
import { EntitlementService } from './entitlement.service';
@Controller()
export class PlansController {
  constructor(@Inject(EntitlementService) private readonly access: EntitlementService) {}
  @Get('plans') plans() { return db.plan.findMany({ where: { active: true }, orderBy: { priceCents: 'asc' } }); }
  @Get('subscriptions/me') @UseGuards(AuthGuard) me(@Req() req: AuthRequest) { return this.access.current(req.user.id); }
}
