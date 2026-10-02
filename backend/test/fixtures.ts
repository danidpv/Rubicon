import { randomBytes } from 'node:crypto';
import argon2 from 'argon2';
import { db } from '../src/database/prisma';
import type { Role } from 'shared';
export async function createTestAccount(role: Role = 'USER', planCode = 'TOTAL') {
  const suffix = randomBytes(6).toString('hex'); const password = randomBytes(20).toString('hex'); const email = `e2e_${suffix}@example.test`;
  const plan = await db.plan.findUniqueOrThrow({ where: { code: planCode } });
  const user = await db.user.create({ data: { name: 'Alumno de prueba', username: `e2e_${suffix}`, email, passwordHash: await argon2.hash(password, { type: argon2.argon2id }), verifiedAt: new Date(), role, subscription: { create: { planId: plan.id, provider: 'mock' } } } });
  return { id: user.id, email, password };
}
