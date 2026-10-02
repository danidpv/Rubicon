import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import { db } from '../../database/prisma';
import { cacheDel, cacheSet } from '../../database/redis';
import { env } from '../../config/env';
import type { User } from '../../generated/prisma/client';
export const SESSION_ABSOLUTE_MS = 7 * 86400000;
export const SESSION_IDLE_MS = 24 * 3600000;
export const digest = (token: string) => createHash('sha256').update(token + env.SESSION_SECRET_PEPPER).digest('hex');
export function publicUser(user: User) { return { id: user.id, name: user.name, username: user.username, email: user.email, role: user.role, profile: user.profile, verified: !!user.verifiedAt, createdAt: user.createdAt }; }
export function sessionIsValid(session: { revokedAt: Date | null; expiresAt: Date; lastSeenAt: Date }, status: string, now = Date.now()) { return !session.revokedAt && status === 'ACTIVE' && session.expiresAt.getTime() > now && now - session.lastSeenAt.getTime() < SESSION_IDLE_MS; }
@Injectable()
export class SessionService {
  async create(userId: string) {
    const token = randomBytes(32).toString('hex');
    const session = await db.authSession.create({ data: { userId, tokenHash: digest(token), expiresAt: new Date(Date.now() + SESSION_ABSOLUTE_MS) } });
    await cacheSet(`session:${session.tokenHash}`, JSON.stringify({ id: session.id, userId }), 300);
    await db.user.update({ where: { id: userId }, data: { lastAccessAt: new Date() } });
    return token;
  }
  async authenticate(token: unknown) {
    if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) throw new UnauthorizedException();
    const tokenHash = digest(token);
    const session = await db.authSession.findUnique({ where: { tokenHash }, include: { user: true } });
    if (!session || !sessionIsValid(session, session.user.status)) throw new UnauthorizedException();
    // DB authority on every request means cached records cannot resurrect revoked users.
    if (Date.now() - session.lastSeenAt.getTime() > 60000) {
      await db.authSession.updateMany({ where: { id: session.id, revokedAt: null }, data: { lastSeenAt: new Date() } });
      await cacheSet(`session:${tokenHash}`, JSON.stringify({ id: session.id, userId: session.userId }), 300);
    }
    return { user: session.user, sessionId: session.id };
  }
  async revoke(userId: string, exceptId?: string) {
    const where = { userId, ...(exceptId ? { id: { not: exceptId } } : {}) };
    const sessions = await db.authSession.findMany({ where, select: { tokenHash: true } });
    await db.authSession.updateMany({ where, data: { revokedAt: new Date() } });
    await cacheDel(sessions.map(s => `session:${s.tokenHash}`));
  }
}
