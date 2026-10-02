import { CanActivate, ExecutionContext, Inject, Injectable, SetMetadata, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import type { User } from '../../generated/prisma/client';
import type { Role } from 'shared';
import { SessionService } from '../../modules/auth/session.service';
import { env } from '../../config/env';
export type AuthRequest = Request & { user: User; sessionId: string };
export const Roles = (...roles: Role[]) => SetMetadata('roles', roles);
export const roleAllowed = (role: Role, allowed: Role[]) => allowed.includes(role);
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(@Inject(SessionService) private readonly sessions: SessionService) {}
  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<AuthRequest>();
    const cookies = req.cookies as Record<string, unknown> | undefined;
    const auth = await this.sessions.authenticate(cookies?.[env.SESSION_COOKIE_NAME]);
    req.user = auth.user; req.sessionId = auth.sessionId;
    return true;
  }
}
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(@Inject(Reflector) private readonly reflector: Reflector) {}
  canActivate(context: ExecutionContext) {
    const roles = this.reflector.getAllAndOverride<Role[]>('roles', [context.getHandler(), context.getClass()]) ?? [];
    if (!roleAllowed(context.switchToHttp().getRequest<AuthRequest>().user.role, roles)) throw new ForbiddenException();
    return true;
  }
}
