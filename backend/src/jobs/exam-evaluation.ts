import { snapshotSchema } from 'shared';
import { db } from '../database/prisma';
import { env } from '../config/env';
import { KnowledgeService } from '../modules/knowledge/knowledge.service';
import { createAiProvider } from '../modules/ai/providers';
import { scoreEvaluation, scoreMcq, syntheticEvaluation } from '../modules/practical-cases/scoring';
import { readExamAnswers } from '../modules/exams/exam-answers';
import { updateMastery } from '../modules/error-bank/review-scheduling.service';
export async function evaluateExam(id: string, knowledge: KnowledgeService) {
  const a = await db.examAttempt.findUniqueOrThrow({ where: { id } }); if (a.status === 'COMPLETED') return;
  const snapshot = snapshotSchema.parse(a.snapshot); if (!snapshot.data.rubric) throw new Error('Missing rubric');
  await db.examAttempt.update({ where: { id }, data: { status: 'PROCESSING' } });
  const started = Date.now(); const responses = readExamAnswers(a.answers); const sources = await knowledge.retrieve(snapshot.body, false);
  const blank = syntheticEvaluation(snapshot.data.rubric, ''); blank.criterionScores.forEach(c => { c.score = 0; c.feedback = 'Respuesta en blanco.'; }); blank.abstentions = ['No hay respuesta de desarrollo que evaluar.'];
  const evaluation = responses.development.trim() ? await createAiProvider().evaluate({ statement: snapshot.body, answer: responses.development, rubric: snapshot.data.rubric, modelAnswer: snapshot.data.modelAnswer ?? '', sources }) : blank;
  const development = scoreEvaluation(evaluation, snapshot.data.rubric, sources.map(s => s.sourceId));
  const mcq = scoreMcq(snapshot, responses.answers); const score = snapshot.format === 'MIXED' ? Math.round((mcq.score + development.score) * 50) / 100 : development.score;
  const result = { score, development: development.evaluation, developmentScore: development.score, ...(snapshot.format === 'MIXED' ? { mcq } : {}) };
  await db.$transaction(async tx => {
    const claimed = await tx.examAttempt.updateMany({ where: { id, status: { not: 'COMPLETED' } }, data: { status: 'COMPLETED', score, result } }); if (!claimed.count) return;
    await tx.$queryRaw`SELECT "PK_USUARIO" FROM "T_PLA_D_USUARIO" WHERE "PK_USUARIO" = ${a.userId}::uuid FOR UPDATE`;
    for (const c of development.evaluation.criterionScores) {
      const old = await tx.userSkillProgress.findUnique({ where: { userId_skill: { userId: a.userId, skill: c.criterionId } } });
      await tx.userSkillProgress.upsert({ where: { userId_skill: { userId: a.userId, skill: c.criterionId } }, create: { userId: a.userId, skill: c.criterionId, mastery: c.score, lastScore: c.score }, update: { mastery: updateMastery(old?.mastery ?? c.score, c.score), lastScore: c.score, sampleCount: { increment: 1 } } });
    }
    if (snapshot.format === 'MIXED') for (const q of mcq.details.filter(q => !q.isCorrect)) await tx.errorBankItem.upsert({ where: { userId_concept: { userId: a.userId, concept: q.concept } }, create: { userId: a.userId, concept: q.concept, category: snapshot.category, originId: a.contentId, action: q.recommendation, severity: 'ERROR', nextReview: new Date(Date.now() + 2 * 86400000) }, update: { count: { increment: 1 }, status: 'ACTIVE', lastAt: new Date(), nextReview: new Date(Date.now() + 2 * 86400000) } });
    await tx.aiUsageRecord.create({ data: { userId: a.userId, operation: 'EXAM_CORRECTOR', model: env.AI_PROVIDER === 'mock' ? 'mock-fixed-fixture' : env.AI_EVALUATION_MODEL, latencyMs: Date.now() - started, outcome: 'COMPLETED' } });
  });
}
