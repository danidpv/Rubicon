import { z } from 'zod';
export const passwordSchema = z.string().min(12, 'Al menos 12 caracteres').max(128);
export const registerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  username: z.string().trim().min(3).max(32).regex(/^[a-zA-Z0-9_]+$/).transform(v => v.toLowerCase()),
  email: z.email().max(254).transform(v => v.toLowerCase()), password: passwordSchema,
  terms: z.literal(true), privacy: z.literal(true)
}).strict();
export const loginSchema = z.object({ identifier: z.string().trim().min(3).max(254).transform(v => v.toLowerCase()), password: z.string().min(1).max(128) }).strict();
export const tokenSchema = z.object({ token: z.string().regex(/^[a-f0-9]{64}$/) }).strict();
export const emailSchema = z.object({ email: z.email().max(254).transform(v => v.toLowerCase()) }).strict();
export const resetSchema = tokenSchema.extend({ password: passwordSchema });
export const changePasswordSchema = z.object({ currentPassword: z.string().min(1).max(128), password: passwordSchema }).strict();
export const roles = ['USER', 'SUPPORT', 'CONTENT_EDITOR', 'ADMIN', 'SUPERADMIN'] as const;
export type Role = typeof roles[number];
export const profileSchema = z.object({ name: z.string().trim().min(2).max(100), profileType: z.enum(['OPOSITOR', 'POLICIA_ACTIVO', 'HIBRIDO']), province: z.string().max(80), municipality: z.string().max(100), targetCall: z.string().max(150), timezone: z.string().refine(v => { try { new Intl.DateTimeFormat('es', { timeZone: v }); return true; } catch { return false; } }) }).strict();
