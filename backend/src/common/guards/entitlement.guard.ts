import { CanActivate, ExecutionContext, Inject, Injectable, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { EntitlementService } from '../../modules/subscriptions/entitlement.service';
import type { AuthRequest } from './auth.guard';
export const ModuleAccess = (module: string) => SetMetadata('moduleAccess', module);
@Injectable()
export class EntitlementGuard implements CanActivate {
  constructor(@Inject(Reflector) private readonly reflector: Reflector, @Inject(EntitlementService) private readonly access: EntitlementService) {}
  async canActivate(context: ExecutionContext) { const module = this.reflector.getAllAndOverride<string>('moduleAccess', [context.getHandler(), context.getClass()]); await this.access.require(context.switchToHttp().getRequest<AuthRequest>().user.id, module); return true; }
}
