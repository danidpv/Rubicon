import { ConflictException, Inject, Injectable, BadRequestException, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import argon2 from 'argon2';
import { registerSchema, loginSchema, resetSchema } from 'shared';
import { db } from '../../database/prisma';
import { env } from '../../config/env';
import { digest, SessionService, publicUser } from './session.service';
import { MailService } from './mail.service';
@Injectable()
export class AuthService {
  constructor(@Inject(SessionService) private readonly sessions: SessionService, @Inject(MailService) private readonly mail: MailService) {}
  async register(input: unknown) {
    const data = registerSchema.parse(input);
    const passwordHash = await argon2.hash(data.password, { type: argon2.argon2id });
    const token = randomBytes(32).toString('hex');
    try {
      await db.$transaction(async tx => {
        const plan = await tx.plan.findUniqueOrThrow({ where: { code: 'GRATIS' } });
        await tx.user.create({ data: { name: data.name, username: data.username, email: data.email, passwordHash, profile: { profileType: 'OPOSITOR', timezone: 'Europe/Madrid', province: '', municipality: '', targetCall: '' }, tokens: { create: { tokenHash: digest(token), purpose: 'VERIFY', expiresAt: new Date(Date.now() + 86400000) } }, subscription: { create: { planId: plan.id, provider: env.BILLING_PROVIDER } } } });
      });
    } catch (error) {
      if (typeof error === 'object' && error && 'code' in error && error.code === 'P2002') throw new ConflictException({ code: 'IDENTITY_TAKEN', message: 'No se puede registrar ese email o nombre de usuario.' });
      throw error;
    }
    await this.mail.send(data.email, 'Verifica tu email · SP Local IA', `Confirma tu email: ${env.FRONTEND_URL}/verificar-email?token=${token}\nEl enlace caduca en 24 horas.`);
    return { message: 'Revisa tu correo para verificar la cuenta.' };
  }
  async login(input: unknown) {
    const data = loginSchema.parse(input);
    const user = await db.user.findFirst({ where: { OR: [{ email: data.identifier }, { username: data.identifier }] } });
    if (!user) { await argon2.hash(data.password, { type: argon2.argon2id }); throw new UnauthorizedException({ code: 'INVALID_LOGIN', message: 'Credenciales incorrectas.' }); }
    if (!await argon2.verify(user.passwordHash, data.password) || user.status !== 'ACTIVE') throw new UnauthorizedException({ code: 'INVALID_LOGIN', message: 'Credenciales incorrectas o cuenta no disponible.' });
    if (!user.verifiedAt) throw new ForbiddenException({ code: 'VERIFY_EMAIL', message: 'Verifica tu email antes de entrar.' });
    return { token: await this.sessions.create(user.id), user: publicUser(user) };
  }
  async verify(token: string) {
    await db.$transaction(async tx => {
      const record = await tx.authToken.findUnique({ where: { tokenHash: digest(token) } });
      if (!record || record.purpose !== 'VERIFY' || record.consumedAt || record.expiresAt < new Date()) throw new BadRequestException({ code: 'INVALID_TOKEN', message: 'Enlace inválido o caducado.' });
      const claimed = await tx.authToken.updateMany({ where: { id: record.id, consumedAt: null }, data: { consumedAt: new Date() } });
      if (!claimed.count) throw new BadRequestException();
      await tx.user.update({ where: { id: record.userId }, data: { verifiedAt: new Date() } });
    });
    return { message: 'Email verificado. Ya puedes iniciar sesión.' };
  }
  async forgot(email: string) {
    const user = await db.user.findUnique({ where: { email } });
    if (user?.status === 'ACTIVE') {
      const token = randomBytes(32).toString('hex');
      await db.authToken.create({ data: { userId: user.id, tokenHash: digest(token), purpose: 'RESET', expiresAt: new Date(Date.now() + 3600000) } });
      await this.mail.send(email, 'Restablecer contraseña · SP Local IA', `Restablece tu contraseña: ${env.FRONTEND_URL}/recuperar-password?token=${token}\nCaduca en una hora. Si no lo solicitaste, ignora este mensaje.`);
    }
    return { message: 'Si la cuenta existe, recibirás un enlace por correo.' };
  }
  async resend(email: string) {
    const user = await db.user.findUnique({ where: { email } });
    if (user?.status === 'ACTIVE' && !user.verifiedAt) {
      const token = randomBytes(32).toString('hex');
      await db.$transaction([db.authToken.updateMany({ where: { userId: user.id, purpose: 'VERIFY', consumedAt: null }, data: { consumedAt: new Date() } }), db.authToken.create({ data: { userId: user.id, purpose: 'VERIFY', tokenHash: digest(token), expiresAt: new Date(Date.now() + 86400000) } })]);
      await this.mail.send(email, 'Verifica tu email · SP Local IA', `Confirma tu email: ${env.FRONTEND_URL}/verificar-email?token=${token}`);
    }
    return { message: 'Si la cuenta está pendiente, recibirás un nuevo enlace.' };
  }
  async reset(input: unknown) {
    const data = resetSchema.parse(input);
    const passwordHash = await argon2.hash(data.password, { type: argon2.argon2id });
    await db.$transaction(async tx => {
      const record = await tx.authToken.findUnique({ where: { tokenHash: digest(data.token) } });
      if (!record || record.purpose !== 'RESET' || record.consumedAt || record.expiresAt < new Date()) throw new BadRequestException({ code: 'INVALID_TOKEN', message: 'Enlace inválido o caducado.' });
      const claimed = await tx.authToken.updateMany({ where: { id: record.id, consumedAt: null }, data: { consumedAt: new Date() } });
      if (!claimed.count) throw new BadRequestException();
      await tx.user.update({ where: { id: record.userId }, data: { passwordHash } });
      await tx.authSession.updateMany({ where: { userId: record.userId }, data: { revokedAt: new Date() } });
      await tx.authToken.updateMany({ where: { userId: record.userId, purpose: 'RESET', consumedAt: null }, data: { consumedAt: new Date() } });
    });
    return { message: 'Contraseña actualizada. Inicia sesión de nuevo.' };
  }
}
