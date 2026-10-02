import type { Role } from 'shared';
export interface User { id: string; name: string; username: string; email: string; role: Role; verified: boolean; profile: { profileType?: 'OPOSITOR' | 'POLICIA_ACTIVO' | 'HIBRIDO'; timezone?: string; province?: string; municipality?: string; targetCall?: string }; }
export interface Plan { id: string; code: string; name: string; priceCents: number; modules: string[]; active: boolean; }
export interface Access { plan: Plan | null; modules: string[]; free: boolean; provider: string; status: string; }
export interface Page<T> { items: T[]; total: number; page: number; limit: number; }
export interface ContentSummary { id: string; slug: string; title: string; summary: string; category: string; format: string; minutes: number; difficulty: number; isDemo: boolean; free: boolean; status: string; version: number; kind: string; }
