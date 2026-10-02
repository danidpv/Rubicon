import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { randomBytes } from 'node:crypto';
import argon2 from 'argon2';
import { z } from 'zod';
import { db } from '../database/prisma';
import { digest } from '../modules/auth/session.service';
import { MailService } from '../modules/auth/mail.service';
import { env } from '../config/env';
async function main() {
  const arg = process.argv.indexOf('--email');
  const email = z.email().parse(process.argv[arg + 1]).toLowerCase();
  const rl = createInterface({ input: stdin, output: stdout });
  const name = z.string().min(2).max(100).parse(await rl.question('Nombre del administrador: ')); rl.close();
  const passwordHash = await argon2.hash(randomBytes(48).toString('hex'), { type: argon2.argon2id });
  const token = randomBytes(32).toString('hex');
  await db.user.create({ data: { email, username: `admin_${randomBytes(5).toString('hex')}`, name, role: 'SUPERADMIN', verifiedAt: new Date(), passwordHash, tokens: { create: { tokenHash: digest(token), purpose: 'RESET', expiresAt: new Date(Date.now() + 3600000) } } } });
  await new MailService().send(email, 'Activa tu acceso administrador', `Elige una contraseña en ${env.FRONTEND_URL}/recuperar-password?token=${token}`);
  stdout.write('Cuenta creada. Se ha enviado un enlace de configuración al correo indicado.\n');
}
main().finally(() => db.$disconnect());
