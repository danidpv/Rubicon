import { config } from 'dotenv';
import { resolve } from 'node:path';
import { z } from 'zod';
config({ path: resolve(process.cwd(), '../.env'), quiet: true });
config({ path: resolve(process.cwd(), '.env'), quiet: true });
export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DEPLOYMENT_ENV: z.enum(['local', 'staging', 'production']).default('local'),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  HOST: z.string().min(1).default('127.0.0.1'),
  FRONTEND_URL: z.url().default('http://localhost:3000'),
  DATABASE_URL: z.string().startsWith('postgresql://'), REDIS_URL: z.url(),
  SESSION_COOKIE_NAME: z.string().regex(/^[a-zA-Z0-9_]+$/).default('splocal_session'),
  SESSION_SECRET_PEPPER: z.string().min(32),
  SMTP_HOST: z.string().min(1), SMTP_PORT: z.coerce.number().default(1025),
  SMTP_USER: z.string().default(''), SMTP_PASSWORD: z.string().default(''), EMAIL_FROM: z.string().min(1),
  BILLING_PROVIDER: z.enum(['mock', 'stripe']).default('mock'), STRIPE_SECRET_KEY: z.string().default(''), STRIPE_WEBHOOK_SECRET: z.string().default(''), STRIPE_PRICE_MAP: z.string().default('{}'),
  AI_PROVIDER: z.enum(['mock', 'real', 'disabled']).default('mock'), AI_API_KEY: z.string().default(''), AI_BASE_URL: z.string().default(''), AI_CHAT_MODEL: z.string().default(''), AI_EVALUATION_MODEL: z.string().default(''), AI_EMBEDDING_MODEL: z.string().default(''),
  SUPPORT_RESPONSE_HOURS: z.coerce.number().min(1).default(48)
}).superRefine((v, ctx) => {
  if (v.BILLING_PROVIDER === 'stripe' && (!v.STRIPE_SECRET_KEY || !v.STRIPE_WEBHOOK_SECRET)) ctx.addIssue({ code: 'custom', message: 'Stripe requiere claves y secreto webhook' });
  if (v.AI_PROVIDER === 'real' && (!v.AI_API_KEY || !v.AI_BASE_URL || !v.AI_CHAT_MODEL || !v.AI_EVALUATION_MODEL)) ctx.addIssue({ code: 'custom', message: 'Falta configuracion de IA real' });
  if (v.NODE_ENV === 'production' && (!v.FRONTEND_URL.startsWith('https://') || (v.DEPLOYMENT_ENV === 'production' && (v.BILLING_PROVIDER === 'mock' || v.AI_PROVIDER === 'mock')))) ctx.addIssue({ code: 'custom', message: 'Production requires HTTPS; DEPLOYMENT_ENV=production requires explicit real/disabled providers' });
});
export const env = envSchema.parse(process.env);
