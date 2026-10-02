import { Controller, Get, Post, Param, Body, Req, UseGuards, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { z } from 'zod';
import { idSchema, messageSchema } from 'shared';
import { AuthGuard, type AuthRequest } from '../../common/guards/auth.guard';
import { db } from '../../database/prisma';
import { redis } from '../../database/redis';
import { env } from '../../config/env';
import { EntitlementService } from '../subscriptions/entitlement.service';
import { KnowledgeService } from '../knowledge/knowledge.service';
import { createAiProvider } from './providers';
@Controller('ai/conversations') @UseGuards(AuthGuard) @Throttle({ default: { limit: 10, ttl: 60000 } })
export class AiController {
  constructor(@Inject(EntitlementService) private readonly access: EntitlementService, @Inject(KnowledgeService) private readonly knowledge: KnowledgeService) {}
  @Get() list(@Req() r: AuthRequest) { return db.aiConversation.findMany({ where: { userId: r.user.id }, orderBy: { createdAt: 'desc' }, take: 20 }); }
  @Post() async create(@Req() r: AuthRequest, @Body() b: unknown) { const { mode } = z.object({ mode: z.enum(['STUDY_TUTOR', 'PROFESSIONAL_ASSISTANT']) }).strict().parse(b); if (mode === 'PROFESSIONAL_ASSISTANT') await this.access.require(r.user.id, 'MANUAL_PROFESIONAL'); return db.aiConversation.create({ data: { userId: r.user.id, mode } }); }
  private async own(id: string, userId: string) { const c = await db.aiConversation.findFirst({ where: { id: idSchema.parse(id), userId } }); if (!c) throw new NotFoundException(); return c; }
  @Get(':id/messages') async messages(@Param('id') id: string, @Req() r: AuthRequest) { await this.own(id, r.user.id); return db.aiMessage.findMany({ where: { conversationId: id }, orderBy: { createdAt: 'asc' }, take: 100 }); }
  @Post(':id/messages') async ask(@Param('id') id: string, @Req() r: AuthRequest, @Body() b: unknown) {
    const { body } = messageSchema.parse(b); const c = await this.own(id, r.user.id); const professional = c.mode === 'PROFESSIONAL_ASSISTANT';
    if (professional) await this.access.require(r.user.id, 'MANUAL_PROFESIONAL');
    const access = await this.access.current(r.user.id); const limit = access.free ? 3 : 50;
    const key = `ai-limit:${r.user.id}:${new Date().toISOString().slice(0, 10)}`;
    const used = await redis.eval("local n=redis.call('INCR',KEYS[1]); if n==1 then redis.call('EXPIRE',KEYS[1],86400) end; return n", 1, key) as number;
    if (used > limit) throw new ForbiddenException({ code: 'AI_LIMIT', message: 'Has alcanzado el límite diario de consultas IA.' });
    const started = Date.now(); const sources = await this.knowledge.retrieve(body, professional); const result = await createAiProvider().chat(body, sources, professional);
    await db.$transaction([db.aiMessage.create({ data: { conversationId: id, role: 'USER', body } }), db.aiMessage.create({ data: { conversationId: id, role: 'ASSISTANT', body: result.answer, citations: result.citations } }), db.aiUsageRecord.create({ data: { userId: r.user.id, operation: c.mode, model: env.AI_PROVIDER === 'mock' ? 'mock' : env.AI_CHAT_MODEL, latencyMs: Date.now() - started, outcome: 'COMPLETED' } })]);
    return { ...result, sources, provider: env.AI_PROVIDER };
  }
}
