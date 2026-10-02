import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { examAnswersSchema, snapshotSchema } from 'shared';
import { db } from '../../database/prisma';
import { ContentService, makeSnapshot, publicData } from '../theory/content.service';
import { EntitlementService } from '../subscriptions/entitlement.service';
import { scoreMcq } from '../practical-cases/scoring';
import { evaluationQueue } from '../practical-cases/attempt.service';
import { KnowledgeService } from '../knowledge/knowledge.service';
import { evaluateExam } from '../../jobs/exam-evaluation';
import { readExamAnswers } from './exam-answers';
export function canSaveExam(status: string, expiresAt: Date, now = new Date()) { return status === 'DRAFT' && expiresAt > now; }
@Injectable()
export class ExamService {
  constructor(@Inject(ContentService) private readonly content: ContentService, @Inject(EntitlementService) private readonly access: EntitlementService, @Inject(KnowledgeService) private readonly knowledge: KnowledgeService) {}
  async template(id: string, userId: string) { const c = await db.content.findFirst({ where: { id, kind: 'EXAM', status: 'PUBLISHED' } }); if (!c) throw new NotFoundException(); await this.access.require(userId, 'SUPUESTOS'); return { ...c, data: publicData(c.data) }; }
  async start(id: string, userId: string) {
    await this.template(id, userId); const c = await db.content.findUniqueOrThrow({ where: { id } });
    return db.$transaction(async tx => {
      await tx.$queryRaw`SELECT "PK_USUARIO" FROM "T_PLA_D_USUARIO" WHERE "PK_USUARIO" = ${userId}::uuid FOR UPDATE`;
      const active = await tx.examAttempt.findFirst({ where: { userId, contentId: id, status: 'DRAFT', expiresAt: { gt: new Date() } } }); if (active) return { id: active.id };
      const snapshot = makeSnapshot(c); const seed = randomBytes(8).toString('hex');
      const offset = parseInt(seed.slice(0, 4), 16) % Math.max(1, snapshot.data.questions.length); snapshot.data.questions = [...snapshot.data.questions.slice(offset), ...snapshot.data.questions.slice(0, offset)];
      const a = await tx.examAttempt.create({ data: { userId, contentId: id, snapshot, seed, expiresAt: new Date(Date.now() + c.minutes * 60000) } }); return { id: a.id };
    });
  }
  async owned(id: string, userId: string) { const a = await db.examAttempt.findFirst({ where: { id, userId } }); if (!a) throw new NotFoundException(); return a; }
  async get(id: string, userId: string) {
    let a = await this.owned(id, userId); if (a.status === 'DRAFT' && a.expiresAt <= new Date()) { await this.submit(id, userId); a = await this.owned(id, userId); }
    const snapshot = snapshotSchema.parse(a.snapshot); const responses = readExamAnswers(a.answers); return { ...a, answers: responses.answers, development: responses.development, snapshot: { ...snapshot, data: publicData(snapshot.data) }, serverNow: new Date() };
  }
  async save(id: string, userId: string, input: unknown) {
    const responses = examAnswersSchema.parse(input); const a = await this.owned(id, userId);
    try { scoreMcq(snapshotSchema.parse(a.snapshot), responses.answers); } catch { throw new BadRequestException(); }
    const saved = await db.examAttempt.updateMany({ where: { id, userId, status: 'DRAFT', expiresAt: { gt: new Date() } }, data: { answers: responses } });
    if (!saved.count) throw new ConflictException({ code: 'EXAM_EXPIRED', message: 'El examen ha terminado. No se admiten cambios.' }); return { savedAt: new Date() };
  }
  async submit(id: string, userId: string) {
    const outcome = await db.$transaction(async tx => {
      // Lock serializes save/submit: score exactly the committed answers, once.
      await tx.$queryRaw`SELECT "PK_INTENTO_EXAMEN" FROM "T_PLA_F_INTENTO_EXAMEN" WHERE "PK_INTENTO_EXAMEN" = ${id}::uuid FOR UPDATE`;
      const a = await tx.examAttempt.findFirst({ where: { id, userId } }); if (!a) throw new NotFoundException(); if (a.status !== 'DRAFT') return { id, status: a.status };
      const snapshot = snapshotSchema.parse(a.snapshot); const responses = readExamAnswers(a.answers);
      if (snapshot.format !== 'MCQ') { await tx.examAttempt.update({ where: { id }, data: { status: 'QUEUED', submittedAt: new Date() } }); return { id, status: 'QUEUED' }; }
      const result = scoreMcq(snapshot, responses.answers);
      await tx.examAttempt.update({ where: { id }, data: { status: 'COMPLETED', result, score: result.score, submittedAt: new Date() } });
      for (const q of result.details.filter(q => !q.isCorrect)) await tx.errorBankItem.upsert({ where: { userId_concept: { userId, concept: q.concept } }, create: { userId, concept: q.concept, category: snapshot.category, originId: a.contentId, action: q.recommendation, severity: 'ERROR', nextReview: new Date(Date.now() + 2 * 86400000) }, update: { count: { increment: 1 }, status: 'ACTIVE', lastAt: new Date(), nextReview: new Date(Date.now() + 2 * 86400000) } });
      return { id, status: 'COMPLETED' };
    });
    if (outcome.status === 'QUEUED') {
      if (evaluationQueue) await evaluationQueue.add('evaluate-exam', { attemptId: id, target: 'EXAM' }, { jobId: `exam-${id}`, attempts: 2, backoff: { type: 'exponential', delay: 2000 }, removeOnComplete: 500 });
      else { await evaluateExam(id, this.knowledge); return { id, status: 'COMPLETED' }; }
    }
    return outcome;
  }
}
