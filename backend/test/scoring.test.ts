import { describe, expect, it } from 'vitest';
import { scoreEvaluation, scoreMcq, syntheticEvaluation } from '../src/modules/practical-cases/scoring';
import { rubric, questions } from '../prisma/seed/content';
import { snapshotSchema } from 'shared';
describe('puntuaciones autoritativas', () => {
  it('limita notas y recalcula sin confiar en el LLM', () => { const e = syntheticEvaluation(rubric, 'ejemplo'); e.criterionScores[0].score = 900; expect(scoreEvaluation(e, rubric).score).toBe(55); e.criterionScores.pop(); expect(() => scoreEvaluation(e, rubric)).toThrow(); });
  it('descarta citas inventadas', () => { const e = syntheticEvaluation(rubric, 'ejemplo'); e.citations.push({ sourceId: '550e8400-e29b-41d4-a716-446655440000', locator: '1', claim: 'x' }); const out = scoreEvaluation(e, rubric); expect(out.evaluation.citations).toHaveLength(0); expect(out.evaluation.abstentions.length).toBe(2); });
  it('penaliza errores sin penalizar blancos ni aceptar preguntas ajenas', () => { const s = snapshotSchema.parse({ id: '550e8400-e29b-41d4-a716-446655440000', title: 'Test', body: '', category: 'METODO', format: 'MCQ', version: 1, data: { questions: questions.slice(0, 2), penalty: .25 } }); expect(scoreMcq(s, { hechos: 1, competencia: 0 }).score).toBe(37.5); expect(scoreMcq(s, { hechos: 1 }).score).toBe(50); expect(() => scoreMcq(s, { foreign: 0 })).toThrow(); });
});
