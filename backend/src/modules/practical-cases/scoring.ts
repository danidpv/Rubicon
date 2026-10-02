import { evaluationSchema, rubricSchema, type Evaluation, type Rubric, type Snapshot } from 'shared';
export function scoreEvaluation(input: unknown, rubricInput: unknown, retrievedIds: string[] = []) {
  const evaluation = evaluationSchema.parse(input); const rubric = rubricSchema.parse(rubricInput);
  if (evaluation.criterionScores.length !== rubric.length || new Set(evaluation.criterionScores.map(c => c.criterionId)).size !== rubric.length) throw new Error('Invalid criteria coverage');
  let total = 0;
  for (const c of evaluation.criterionScores) { const criterion = rubric.find(r => r.criterionId === c.criterionId); if (!criterion) throw new Error('Unknown criterion'); c.score = Math.max(0, Math.min(100, c.score)); total += c.score * criterion.weight / 100; }
  const invalid = evaluation.citations.filter(c => !retrievedIds.includes(c.sourceId));
  evaluation.citations = evaluation.citations.filter(c => retrievedIds.includes(c.sourceId));
  if (invalid.length) evaluation.abstentions.push('Se han descartado citas ajenas a las fuentes recuperadas. Conclusiones jurídicas no verificadas.');
  return { evaluation, score: Math.round(total * 100) / 100 };
}
export function scoreMcq(snapshot: Snapshot, answers: Record<string, number | null>) {
  const questions = snapshot.data.questions;
  for (const [id, choice] of Object.entries(answers)) { const q = questions.find(x => x.id === id); if (!q || (choice !== null && (choice < 0 || choice >= q.options.length))) throw new Error('Invalid question or choice'); }
  const details = questions.map(q => ({ ...q, selected: answers[q.id] ?? null, correctAnswer: q.correct, isCorrect: answers[q.id] === q.correct }));
  const correct = details.filter(q => q.isCorrect).length; const blank = details.filter(q => q.selected === null).length; const wrong = details.length - correct - blank;
  return { score: questions.length ? Math.max(0, Math.round((correct - wrong * snapshot.data.penalty) / questions.length * 10000) / 100) : 0, correct, wrong, blank, details };
}
export function syntheticEvaluation(rubric: Rubric, answer: string): Evaluation {
  return { criterionScores: rubric.map(c => ({ criterionId: c.criterionId, score: 50, feedback: 'Resultado fijo de prueba: no mide la corrección jurídica de tu respuesta.', evidenceFromAnswer: answer.slice(0, 180), missingConcepts: ['Revisión humana pendiente'] })), strengths: ['Respuesta recibida y almacenada.'], weaknesses: ['La simulación no identifica fortalezas o errores jurídicos reales.'], legalIssues: [], citations: [], writingFeedback: { structure: 'Revisión simulada.', clarity: 'Revisión simulada.', precision: 'Pendiente de evaluación real.', legalLanguage: 'Sin valoración jurídica.' }, nextActions: ['Contrasta tu respuesta con la ficha de teoría y consulta al equipo.'], abstentions: ['Modo mock: puntuaciones sintéticas para probar el circuito. No usar como valoración de conocimientos.'] };
}
