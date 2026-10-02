import { Inject, Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Worker, type Job } from 'bullmq';
import { z } from 'zod';
import { queueConnection } from '../database/redis';
import { db } from '../database/prisma';
import { evaluationQueue } from '../modules/practical-cases/attempt.service';
import { KnowledgeService } from '../modules/knowledge/knowledge.service';
import { evaluateCaseAttempt } from './case-evaluation';
import { evaluateExam } from './exam-evaluation';
import pino from 'pino';
const logger = pino();
@Injectable()
export class EvaluationWorker implements OnModuleInit, OnModuleDestroy {
  private worker?: Worker; private recovery?: ReturnType<typeof setInterval>;
  constructor(@Inject(KnowledgeService) private readonly knowledge: KnowledgeService) {}
  async onModuleInit() {
    if (!queueConnection || !evaluationQueue) return;
    this.worker = new Worker('case-evaluation', job => this.process(job), { connection: queueConnection, concurrency: 2 });
    this.worker.on('failed', (job) => { if (job && job.attemptsMade >= 2) { const operation = job.data.target === 'EXAM' ? db.examAttempt.updateMany({ where: { id: String(job.data.attemptId), status: { in: ['QUEUED', 'PROCESSING'] } }, data: { status: 'FAILED' } }) : db.caseAttempt.updateMany({ where: { id: String(job.data.attemptId), status: { in: ['QUEUED', 'PROCESSING'] } }, data: { status: 'FAILED' } }); void operation.catch(() => logger.error({ event: 'job_failure_persistence_failed' })); } });
    this.worker.on('error', () => logger.error({ event: 'worker_connection_error' }));
    await this.recover();
    this.recovery = setInterval(() => { void this.recover().catch(() => logger.error({ event: 'queue_recovery_failed' })); }, 30000);
  }
  private async recover() {
    if (!evaluationQueue) return;
    const pending = await db.caseAttempt.findMany({ where: { status: 'QUEUED' }, select: { id: true }, take: 100 });
    for (const a of pending) await evaluationQueue.add('evaluate', { attemptId: a.id }, { jobId: a.id, attempts: 2, backoff: { type: 'exponential', delay: 2000 }, removeOnComplete: 500 });
    const exams = await db.examAttempt.findMany({ where: { status: 'QUEUED' }, select: { id: true }, take: 100 });
    for (const a of exams) await evaluationQueue.add('evaluate-exam', { attemptId: a.id, target: 'EXAM' }, { jobId: `exam-${a.id}`, attempts: 2, backoff: { type: 'exponential', delay: 2000 }, removeOnComplete: 500 });
  }
  private async process(job: Job) {
    const { attemptId, target } = z.object({ attemptId: z.uuid(), target: z.enum(['CASE', 'EXAM']).default('CASE') }).parse(job.data);
    if (target === 'EXAM') return evaluateExam(attemptId, this.knowledge);
    return evaluateCaseAttempt(attemptId, this.knowledge);
  }
  async onModuleDestroy() { if (this.recovery) clearInterval(this.recovery); await this.worker?.close(); }
}
