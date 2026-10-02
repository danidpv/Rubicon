import { Inject, Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Worker, type Job } from 'bullmq';
import { z } from 'zod';
import { snapshotSchema } from 'shared';
import { queueConnection } from '../database/redis';
import { db } from '../database/prisma';
import { env } from '../config/env';
import { createAiProvider } from '../modules/ai/providers';
import { scoreEvaluation } from '../modules/practical-cases/scoring';
import { evaluationQueue } from '../modules/practical-cases/attempt.service';
import { KnowledgeService } from '../modules/knowledge/knowledge.service';
import { evaluateExam } from './exam-evaluation';
import { updateMastery } from '../modules/error-bank/review-scheduling.service';
import pino from 'pino';
const logger = pino();
@Injectable()
export class EvaluationWorker implements OnModuleInit, OnModuleDestroy {
  private worker?: Worker; private recovery?: ReturnType<typeof setInterval>;
  constructor(@Inject(KnowledgeService) private readonly knowledge: KnowledgeService) {}
  async onModuleInit() {
    this.worker = new Worker('case-evaluation', job => this.process(job), { connection: queueConnection, concurrency: 2 });
    this.worker.on('failed', (job) => { if (job && job.attemptsMade >= 2) { const operation = job.data.target === 'EXAM' ? db.examAttempt.updateMany({ where: { id: String(job.data.attemptId), status: { in: ['QUEUED', 'PROCESSING'] } }, data: { status: 'FAILED' } }) : db.caseAttempt.updateMany({ where: { id: String(job.data.attemptId), status: { in: ['QUEUED', 'PROCESSING'] } }, data: { status: 'FAILED' } }); void operation.catch(() => logger.error({ event: 'job_failure_persistence_failed' })); } });
    this.worker.on('error', () => logger.error({ event: 'worker_connection_error' }));
    await this.recover();
    this.recovery = setInterval(() => { void this.recover().catch(() => logger.error({ event: 'queue_recovery_failed' })); }, 30000);
  }
  private async recover() {
    const pending = await db.caseAttempt.findMany({ where: { status: 'QUEUED' }, select: { id: true }, take: 100 });
    for (const a of pending) await evaluationQueue.add('evaluate', { attemptId: a.id }, { jobId: a.id, attempts: 2, backoff: { type: 'exponential', delay: 2000 }, removeOnComplete: 500 });
    const exams = await db.examAttempt.findMany({ where: { status: 'QUEUED' }, select: { id: true }, take: 100 });
    for (const a of exams) await evaluationQueue.add('evaluate-exam', { attemptId: a.id, target: 'EXAM' }, { jobId: `exam-${a.id}`, attempts: 2, backoff: { type: 'exponential', delay: 2000 }, removeOnComplete: 500 });
  }
  private async process(job: Job) {
    const { attemptId, target } = z.object({ attemptId: z.uuid(), target: z.enum(['CASE', 'EXAM']).default('CASE') }).parse(job.data);
    if (target === 'EXAM') return evaluateExam(attemptId, this.knowledge);
    const a = await db.caseAttempt.findUniqueOrThrow({ where: { id: attemptId } });
    if (a.status === 'COMPLETED') return;
    const snapshot = snapshotSchema.parse(a.snapshot); if (!snapshot.data.rubric) throw new Error('Missing rubric');
    await db.caseAttempt.update({ where: { id: a.id }, data: { status: 'PROCESSING' } });
    const started = Date.now(); const sources = await this.knowledge.retrieve(snapshot.body, false);
    const result = scoreEvaluation(await createAiProvider().evaluate({ statement: snapshot.body, rubric: snapshot.data.rubric, answer: a.answer, modelAnswer: snapshot.data.modelAnswer ?? '', sources }), snapshot.data.rubric, sources.map(s => s.sourceId));
    await db.$transaction(async tx => {
      const claimed = await tx.caseAttempt.updateMany({ where: { id: a.id, status: { not: 'COMPLETED' } }, data: { status: 'COMPLETED', evaluation: result.evaluation, score: result.score, completedAt: new Date() } }); if (!claimed.count) return;
      await tx.$queryRaw`SELECT "PK_USUARIO" FROM "T_PLA_D_USUARIO" WHERE "PK_USUARIO" = ${a.userId}::uuid FOR UPDATE`;
      for (const c of result.evaluation.criterionScores) {
        const old = await tx.userSkillProgress.findUnique({ where: { userId_skill: { userId: a.userId, skill: c.criterionId } } });
        await tx.userSkillProgress.upsert({ where: { userId_skill: { userId: a.userId, skill: c.criterionId } }, create: { userId: a.userId, skill: c.criterionId, mastery: c.score, lastScore: c.score }, update: { mastery: updateMastery(old?.mastery ?? c.score, c.score), lastScore: c.score, sampleCount: { increment: 1 } } });
        if (env.AI_PROVIDER === 'real' && c.score < 60) await tx.errorBankItem.upsert({ where: { userId_concept: { userId: a.userId, concept: c.criterionId } }, create: { userId: a.userId, concept: c.criterionId, category: snapshot.category, originId: a.contentId, action: `Revisa ${snapshot.data.theorySlug ?? 'metodo-universal'}: ${c.missingConcepts.join(', ')}`, severity: c.score < 30 ? 'SEVERE' : 'ERROR', nextReview: new Date(Date.now() + (c.score < 30 ? 1 : 2) * 86400000) }, update: { count: { increment: 1 }, status: 'ACTIVE', lastAt: new Date(), nextReview: new Date(Date.now() + 86400000) } });
      }
      await tx.aiUsageRecord.create({ data: { userId: a.userId, operation: 'CASE_CORRECTOR', model: env.AI_PROVIDER === 'mock' ? 'mock-fixed-fixture' : env.AI_EVALUATION_MODEL, latencyMs: Date.now() - started, outcome: 'COMPLETED' } });
    });
  }
  async onModuleDestroy() { if (this.recovery) clearInterval(this.recovery); await this.worker?.close(); }
}
