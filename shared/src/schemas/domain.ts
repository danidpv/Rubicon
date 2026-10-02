import { z } from 'zod';
export const modules = ['TEMARIO_PRACTICO', 'SUPUESTOS', 'MANUAL_PROFESIONAL'] as const;
export const skills = ['ISSUE_SPOTTING', 'LEGAL_BASIS', 'JURISDICTION_COMPETENCE', 'PROCEDURE', 'GUARANTEES', 'DOCUMENTATION', 'ARGUMENTATION', 'WRITING_CLARITY'] as const;
export const skillLabels: Record<typeof skills[number], string> = { ISSUE_SPOTTING: 'Hechos relevantes', LEGAL_BASIS: 'Fundamento jurídico', JURISDICTION_COMPETENCE: 'Competencia', PROCEDURE: 'Procedimiento', GUARANTEES: 'Garantías', DOCUMENTATION: 'Documentación', ARGUMENTATION: 'Argumentación', WRITING_CLARITY: 'Claridad' };
export const categories = ['METODO', 'POLICIA_ADMINISTRATIVA', 'SEGURIDAD_CIUDADANA', 'TRAFICO', 'PENAL_PROCESAL'] as const;
export const categoryLabels: Record<typeof categories[number], string> = { METODO: 'Método', POLICIA_ADMINISTRATIVA: 'Policía administrativa', SEGURIDAD_CIUDADANA: 'Seguridad ciudadana', TRAFICO: 'Tráfico', PENAL_PROCESAL: 'Penal / Procesal' };
export const idSchema = z.uuid();
export const slugSchema = z.string().regex(/^[a-z0-9-]{1,100}$/);
export const pageSchema = z.object({ page: z.coerce.number().int().min(1).default(1), limit: z.coerce.number().int().min(1).max(50).default(20), q: z.string().trim().max(150).default(''), category: z.enum(categories).optional(), format: z.enum(['DEVELOPMENT', 'MCQ', 'MIXED']).optional(), status: z.string().max(30).optional() }).strict();
export const answerSchema = z.object({ answer: z.string().max(30000) }).strict();
export const mcqAnswersSchema = z.object({ answers: z.record(z.string().max(100), z.number().int().min(0).max(5).nullable()) }).strict();
export const examAnswersSchema = mcqAnswersSchema.extend({ development: z.string().max(30000).default('') });
export const messageSchema = z.object({ body: z.string().trim().min(1).max(6000) }).strict();
export const threadSchema = messageSchema.extend({ subject: z.string().trim().min(3).max(150), category: z.enum(['SUPUESTO', 'TEORIA', 'EXAMEN', 'FACTURACION', 'TECNICO', 'OTRO']) });
export const rubricSchema = z.array(z.object({ criterionId: z.enum(skills), weight: z.number().min(0).max(100) })).min(1).max(8).refine(v => new Set(v.map(x => x.criterionId)).size === v.length && Math.abs(v.reduce((s, x) => s + x.weight, 0) - 100) < 0.001);
export const evaluationSchema = z.object({
  criterionScores: z.array(z.object({ criterionId: z.enum(skills), score: z.number().finite(), feedback: z.string().max(2000), evidenceFromAnswer: z.string().max(2000), missingConcepts: z.array(z.string().max(300)).max(20) }).strict()).min(1).max(8),
  strengths: z.array(z.string()).max(20), weaknesses: z.array(z.string()).max(20), legalIssues: z.array(z.string()).max(20),
  citations: z.array(z.object({ sourceId: z.uuid(), locator: z.string(), claim: z.string() }).strict()).max(30),
  writingFeedback: z.object({ structure: z.string(), clarity: z.string(), precision: z.string(), legalLanguage: z.string() }).strict(),
  nextActions: z.array(z.string()).max(20), abstentions: z.array(z.string()).max(20)
}).strict();
export type Evaluation = z.infer<typeof evaluationSchema>;
export type Rubric = z.infer<typeof rubricSchema>;
