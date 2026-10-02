import { Body, Controller, Get, Post, Patch, Req, Res, UseGuards, Inject, UnauthorizedException } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import argon2 from 'argon2';
import { tokenSchema, emailSchema, changePasswordSchema, profileSchema } from 'shared';
import { AuthGuard, type AuthRequest } from '../../common/guards/auth.guard';
import { db } from '../../database/prisma';
import { env } from '../../config/env';
import { AuthService } from './auth.service';
import { publicUser, SessionService, SESSION_ABSOLUTE_MS } from './session.service';
@Controller('auth')
export class AuthController {
  constructor(@Inject(AuthService) private readonly auth: AuthService, @Inject(SessionService) private readonly sessions: SessionService) {}
  @Post('register') @Throttle({ default: { limit: 5, ttl: 60000 } }) register(@Body() body: unknown) { return this.auth.register(body); }
  @Post('login') @Throttle({ default: { limit: 8, ttl: 60000 } }) async login(@Body() body: unknown, @Res({ passthrough: true }) res: Response) {
    const result = await this.auth.login(body);
    res.cookie(env.SESSION_COOKIE_NAME, result.token, { httpOnly: true, secure: env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: SESSION_ABSOLUTE_MS });
    return result.user;
  }
  @Post('verify-email') verify(@Body() body: unknown) { return this.auth.verify(tokenSchema.parse(body).token); }
  @Post('forgot-password') @Throttle({ default: { limit: 3, ttl: 60000 } }) forgot(@Body() body: unknown) { return this.auth.forgot(emailSchema.parse(body).email); }
  @Post('resend-verification') @Throttle({ default: { limit: 3, ttl: 60000 } }) resend(@Body() body: unknown) { return this.auth.resend(emailSchema.parse(body).email); }
  @Post('reset-password') @Throttle({ default: { limit: 5, ttl: 60000 } }) reset(@Body() body: unknown) { return this.auth.reset(body); }
  @Get('me') @UseGuards(AuthGuard) me(@Req() req: AuthRequest) { return publicUser(req.user); }
  @Post('logout') @UseGuards(AuthGuard) async logout(@Req() req: AuthRequest, @Res({ passthrough: true }) res: Response) {
    await db.authSession.update({ where: { id: req.sessionId }, data: { revokedAt: new Date() } });
    res.clearCookie(env.SESSION_COOKIE_NAME, { path: '/', secure: env.NODE_ENV === 'production', httpOnly: true, sameSite: 'lax' }); return { ok: true };
  }
  @Post('logout-others') @UseGuards(AuthGuard) async others(@Req() req: AuthRequest) { await this.sessions.revoke(req.user.id, req.sessionId); return { ok: true }; }
  @Patch('profile') @UseGuards(AuthGuard) async profile(@Req() req: AuthRequest, @Body() body: unknown) { const { name, ...profile } = profileSchema.parse(body); return publicUser(await db.user.update({ where: { id: req.user.id }, data: { name, profile } })); }
  @Post('change-password') @UseGuards(AuthGuard) async change(@Req() req: AuthRequest, @Body() body: unknown) {
    const data = changePasswordSchema.parse(body);
    if (!await argon2.verify(req.user.passwordHash, data.currentPassword)) throw new UnauthorizedException();
    await db.$transaction([db.user.update({ where: { id: req.user.id }, data: { passwordHash: await argon2.hash(data.password, { type: argon2.argon2id }) } }), db.authSession.updateMany({ where: { userId: req.user.id }, data: { revokedAt: new Date() } })]);
    return { message: 'Contraseña actualizada. Inicia sesión de nuevo.' };
  }
}
