import { Body, Controller, Get, Post, Param, Query, Req, UseGuards, Inject, NotFoundException } from '@nestjs/common';
import { z } from 'zod';
import { idSchema, pageSchema } from 'shared';
import { db } from '../../database/prisma';
import { env } from '../../config/env';
import { AuthGuard, type AuthRequest } from '../../common/guards/auth.guard';
import { ReviewSchedulingService } from '../error-bank/review-scheduling.service';
@Controller() @UseGuards(AuthGuard)
export class ProgressController {
  constructor(@Inject(ReviewSchedulingService) private readonly schedule: ReviewSchedulingService) {}
  @Get('progress') async progress(@Req() r: AuthRequest, @Query() input: unknown) {
    const { days } = z.object({ days: z.coerce.number().int().refine(v => [7, 30, 0].includes(v)).default(30) }).strict().parse(input);
    const since = days ? new Date(Date.now() - days * 86400000) : new Date(0); const userId = r.user.id;
    const [history, exams, skills, studied, due, errors] = await Promise.all([
      db.caseAttempt.findMany({ where: { userId, status: 'COMPLETED', completedAt: { gte: since } }, select: { id: true, score: true, completedAt: true, content: { select: { title: true, slug: true, category: true, format: true } } }, orderBy: { completedAt: 'desc' }, take: 100 }),
      db.examAttempt.findMany({ where: { userId, status: 'COMPLETED', submittedAt: { gte: since } }, select: { id: true, contentId: true, score: true, submittedAt: true }, orderBy: { submittedAt: 'desc' }, take: 100 }),
      db.userSkillProgress.findMany({ where: { userId }, orderBy: { mastery: 'asc' } }), db.studySession.count({ where: { userId } }),
      db.errorBankItem.count({ where: { userId, status: { not: 'MASTERED' }, nextReview: { lte: new Date() } } }), db.errorBankItem.count({ where: { userId, status: { not: 'MASTERED' } } })
    ]);
    const mean = (window: number) => { const scores = history.filter(h => h.completedAt && h.completedAt.getTime() >= Date.now() - window * 86400000).map(h => h.score ?? 0); return scores.length ? scores.reduce((s, v) => s + v, 0) / scores.length : null; };
    return { history, exams, skills, studied, due, errors, mean7: mean(7), mean30: mean(30), simulated: env.AI_PROVIDER === 'mock', recommendation: { title: due ? 'Vuelve sobre tus errores pendientes' : skills.length ? 'Refuerza tu respuesta, paso a paso' : 'Empieza por el método universal', href: due ? '/app/errores' : '/app/temario/metodo-universal', description: due ? `Tienes ${due} conceptos con revisión pendiente. Revisa la ficha y comprueba tu respuesta.` : 'Dedica una sesión a ordenar hechos, fundamentos, actuación y garantías.' } };
  }
  @Get('progress/skills') skills(@Req() r: AuthRequest) { return db.userSkillProgress.findMany({ where: { userId: r.user.id } }); }
  @Get('error-bank') async errors(@Req() r: AuthRequest, @Query() input: unknown) { const q = pageSchema.parse(input); const where = { userId: r.user.id, ...(q.status ? { status: z.enum(['ACTIVE', 'REVIEWING', 'MASTERED']).parse(q.status) } : {}) }; const [items, total] = await Promise.all([db.errorBankItem.findMany({ where, orderBy: { nextReview: 'asc' }, take: q.limit, skip: (q.page - 1) * q.limit }), db.errorBankItem.count({ where })]); return { items, total, page: q.page, limit: q.limit }; }
  @Post('error-bank/:id/review') async review(@Req() r: AuthRequest, @Param('id') id: string, @Body() b: unknown) { const { rating } = z.object({ rating: z.enum(['SEVERE', 'ERROR', 'DOUBT', 'CORRECT', 'MASTERED']) }).strict().parse(b); const updated = await db.errorBankItem.updateMany({ where: { id: idSchema.parse(id), userId: r.user.id }, data: { status: rating === 'MASTERED' ? 'MASTERED' : 'REVIEWING', nextReview: this.schedule.next(rating) } }); if (!updated.count) throw new NotFoundException(); return { ok: true }; }
}
