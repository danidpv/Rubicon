import { BadRequestException, ConflictException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Queue } from 'bullmq';
import { answerSchema, mcqAnswersSchema, snapshotSchema } from 'shared';
import { db } from '../../database/prisma';
import { queueConnection } from '../../database/redis';
import { ContentService, makeSnapshot, publicData } from '../theory/content.service';
import { EntitlementService } from '../subscriptions/entitlement.service';
import { scoreMcq } from './scoring';
export const evaluationQueue = new Queue('case-evaluation', { connection: queueConnection });
@Injectable()
export class AttemptService {
  constructor(@Inject(ContentService) private readonly content: ContentService, @Inject(EntitlementService) private readonly access: EntitlementService) {}
  async create(slug: string, userId: string) {
    const visible = await this.content.get('CASE', slug, userId);
    const content = await db.content.findUniqueOrThrow({ where: { id: visible.id } });
    const access = await this.access.current(userId);
    return db.$transaction(async tx => {
      await tx.$queryRaw`SELECT "PK_USUARIO" FROM "T_PLA_D_USUARIO" WHERE "PK_USUARIO" = ${userId}::uuid FOR UPDATE`;
      const existing = await tx.caseAttempt.findFirst({ where: { userId, contentId: content.id, status: 'DRAFT' } });
      if (existing) return { id: existing.id };
      if (!access.modules.includes('SUPUESTOS') && await tx.caseAttempt.count({ where: { userId, contentId: content.id } })) throw new ForbiddenException({ code: 'FREE_LIMIT', message: 'Has completado la prueba gratuita de este supuesto.' });
      const snapshot = makeSnapshot(content); if (!access.modules.includes('SUPUESTOS')) snapshot.data.questions = snapshot.data.questions.slice(0, 3);
      const attempt = await tx.caseAttempt.create({ data: { userId, contentId: content.id, snapshot } }); return { id: attempt.id };
    });
  }
  async owned(id: string, userId: string) { const a = await db.caseAttempt.findFirst({ where: { id, userId } }); if (!a) throw new NotFoundException(); return a; }
  async get(id: string, userId: string) { const a = await this.owned(id, userId); const s = snapshotSchema.parse(a.snapshot); return { id: a.id, status: a.status, answer: a.answer, answers: a.answers, snapshot: { ...s, data: publicData(s.data) }, evaluation: a.evaluation, score: a.score, createdAt: a.createdAt }; }
  async save(id: string, userId: string, input: unknown) {
    const a = await this.owned(id, userId); const snapshot = snapshotSchema.parse(a.snapshot);
    const data = snapshot.format === 'MCQ' ? mcqAnswersSchema.parse(input) : answerSchema.parse(input);
    if ('answers' in data) { try { scoreMcq(snapshot, data.answers); } catch { throw new BadRequestException(); } }
    const count = await db.caseAttempt.updateMany({ where: { id, userId, status: 'DRAFT' }, data }); if (!count.count) throw new ConflictException({ code: 'ATTEMPT_LOCKED', message: 'El intento ya se ha entregado o no existe.' }); return { savedAt: new Date() };
  }
  async submit(id: string, userId: string, input: unknown) {
    const a = await this.owned(id, userId); const snapshot = snapshotSchema.parse(a.snapshot);
    if (a.status !== 'DRAFT') return { id: a.id, status: a.status };
    const content = await db.content.findUniqueOrThrow({ where: { id: a.contentId } }); await this.access.require(userId, 'SUPUESTOS', content.free);
    if (snapshot.format === 'MCQ') {
      const { answers } = mcqAnswersSchema.parse(input); let result: ReturnType<typeof scoreMcq>;
      try { result = scoreMcq(snapshot, answers); } catch { throw new BadRequestException(); }
      await db.$transaction(async tx => {
        const claimed = await tx.caseAttempt.updateMany({ where: { id, userId, status: 'DRAFT' }, data: { status: 'COMPLETED', answers, score: result.score, evaluation: result, submittedAt: new Date(), completedAt: new Date() } });
        if (!claimed.count) throw new ConflictException();
        for (const q of result.details.filter(q => !q.isCorrect)) await tx.errorBankItem.upsert({ where: { userId_concept: { userId, concept: q.concept } }, create: { userId, concept: q.concept, category: snapshot.category, originId: a.contentId, action: q.recommendation, severity: 'ERROR', nextReview: new Date(Date.now() + 2 * 86400000) }, update: { count: { increment: 1 }, status: 'ACTIVE', lastAt: new Date(), nextReview: new Date(Date.now() + 2 * 86400000), action: q.recommendation } });
      });
      return { id, status: 'COMPLETED' };
    }
    if (a.answer.trim().length < 30) throw new BadRequestException({ code: 'ANSWER_TOO_SHORT', message: 'Escribe al menos 30 caracteres antes de entregar.' });
    const claimed = await db.caseAttempt.updateMany({ where: { id, userId, status: 'DRAFT' }, data: { status: 'QUEUED', submittedAt: new Date() } });
    if (claimed.count) await evaluationQueue.add('evaluate', { attemptId: id }, { jobId: id, attempts: 2, backoff: { type: 'exponential', delay: 2000 }, removeOnComplete: 500, removeOnFail: 500 });
    return { id, status: 'QUEUED' };
  }
}
