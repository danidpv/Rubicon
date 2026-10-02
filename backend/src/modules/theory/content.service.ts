import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { contentDataSchema, pageSchema, slugSchema, snapshotSchema } from 'shared';
import { db } from '../../database/prisma';
import { EntitlementService } from '../subscriptions/entitlement.service';
import type { Content, ContentKind } from '../../generated/prisma/client';
export const contentModule = { THEORY: 'TEMARIO_PRACTICO', CASE: 'SUPUESTOS', EXAM: 'SUPUESTOS', MANUAL: 'MANUAL_PROFESIONAL' };
export const summarySelect = { id: true, slug: true, title: true, summary: true, category: true, format: true, minutes: true, difficulty: true, isDemo: true, free: true, status: true, version: true, kind: true } as const;
export const makeSnapshot = (c: Content) => snapshotSchema.parse({ id: c.id, title: c.title, body: c.body, category: c.category, format: c.format, version: c.version, data: c.data });
export function publicData(data: unknown, free = false) { const parsed = contentDataSchema.parse(data); return { ...parsed, modelAnswer: undefined, questions: (free ? parsed.questions.slice(0, 3) : parsed.questions).map(q => ({ id: q.id, prompt: q.prompt, options: q.options })) }; }
@Injectable()
export class ContentService {
  constructor(@Inject(EntitlementService) private readonly access: EntitlementService) {}
  async list(kind: ContentKind, input: unknown) {
    const q = pageSchema.parse(input);
    const where = { kind, status: 'PUBLISHED' as const, ...(q.q ? { OR: [{ title: { contains: q.q, mode: 'insensitive' as const } }, { summary: { contains: q.q, mode: 'insensitive' as const } }] } : {}), ...(q.category ? { category: q.category } : {}), ...(q.format ? { format: q.format } : {}) };
    const [items, total] = await Promise.all([db.content.findMany({ where, select: summarySelect, orderBy: { createdAt: 'asc' }, skip: (q.page - 1) * q.limit, take: q.limit }), db.content.count({ where })]);
    return { items, total, page: q.page, limit: q.limit };
  }
  async get(kind: ContentKind, slug: string, userId: string) {
    const c = await db.content.findFirst({ where: { slug: slugSchema.parse(slug), kind, status: 'PUBLISHED' }, include: { sources: { include: { source: { select: { id: true, title: true, url: true, status: true, reviewedAt: true } } } } } });
    if (!c) throw new NotFoundException();
    const access = await this.access.require(userId, contentModule[kind], c.free);
    const [study, favorite] = await Promise.all([db.studySession.findUnique({ where: { userId_contentId: { userId, contentId: c.id } } }), db.favorite.findUnique({ where: { userId_contentId: { userId, contentId: c.id } } })]);
    return { ...c, data: publicData(c.data, access.free && !access.modules.includes(contentModule[kind])), completed: !!study, favorite: !!favorite };
  }
  async complete(slug: string, userId: string) { const c = await this.get('THEORY', slug, userId); await db.studySession.upsert({ where: { userId_contentId: { userId, contentId: c.id } }, create: { userId, contentId: c.id }, update: { completedAt: new Date() } }); return { ok: true }; }
}
