import { snapshotSchema } from 'shared';
import { db } from '../database/prisma';
import { env } from '../config/env';
import { createAiProvider } from '../modules/ai/providers';
import { scoreEvaluation } from '../modules/practical-cases/scoring';
import { KnowledgeService } from '../modules/knowledge/knowledge.service';
import { updateMastery } from '../modules/error-bank/review-scheduling.service';

export async function evaluateCaseAttempt(attemptId: string, knowledge: KnowledgeService) {
  const a = await db.caseAttempt.findUniqueOrThrow({ where: { id: attemptId } });
  if (a.status === 'COMPLETED') return;
  const snapshot = snapshotSchema.parse(a.snapshot);
  if (!snapshot.data.rubric) throw new Error('Missing rubric');
  await db.caseAttempt.update({ where: { id: a.id }, data: { status: 'PROCESSING' } });
  const started = Date.now();
  const sources = await knowledge.retrieve(snapshot.body, false);
  const result = scoreEvaluation(await createAiProvider().evaluate({ statement: snapshot.body, rubric: snapshot.data.rubric, answer: a.answer, modelAnswer: snapshot.data.modelAnswer ?? '', sources }), snapshot.data.rubric, sources.map(s => s.sourceId));
  await db.$transaction(async tx => {
    const claimed = await tx.caseAttempt.updateMany({ where: { id: a.id, status: { not: 'COMPLETED' } }, data: { status: 'COMPLETED', evaluation: result.evaluation, score: result.score, completedAt: new Date() } });
    if (!claimed.count) return;
    await tx.$queryRaw`SELECT "PK_USUARIO" FROM "T_PLA_D_USUARIO" WHERE "PK_USUARIO" = ${a.userId}::uuid FOR UPDATE`;
    for (const c of result.evaluation.criterionScores) {
      const old = await tx.userSkillProgress.findUnique({ where: { userId_skill: { userId: a.userId, skill: c.criterionId } } });
      await tx.userSkillProgress.upsert({ where: { userId_skill: { userId: a.userId, skill: c.criterionId } }, create: { userId: a.userId, skill: c.criterionId, mastery: c.score, lastScore: c.score }, update: { mastery: updateMastery(old?.mastery ?? c.score, c.score), lastScore: c.score, sampleCount: { increment: 1 } } });
      if (env.AI_PROVIDER === 'real' && c.score < 60) await tx.errorBankItem.upsert({ where: { userId_concept: { userId: a.userId, concept: c.criterionId } }, create: { userId: a.userId, concept: c.criterionId, category: snapshot.category, originId: a.contentId, action: `Revisa ${snapshot.data.theorySlug ?? 'metodo-universal'}: ${c.missingConcepts.join(', ')}`, severity: c.score < 30 ? 'SEVERE' : 'ERROR', nextReview: new Date(Date.now() + (c.score < 30 ? 1 : 2) * 86400000) }, update: { count: { increment: 1 }, status: 'ACTIVE', lastAt: new Date(), nextReview: new Date(Date.now() + 86400000) } });
    }
    await tx.aiUsageRecord.create({ data: { userId: a.userId, operation: 'CASE_CORRECTOR', model: env.AI_PROVIDER === 'mock' ? 'mock-fixed-fixture' : env.AI_EVALUATION_MODEL, latencyMs: Date.now() - started, outcome: 'COMPLETED' } });
  });
}
