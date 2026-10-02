import { examAnswersSchema, mcqAnswersSchema } from 'shared';
export function readExamAnswers(input: unknown) { const current = examAnswersSchema.safeParse(input); return current.success ? current.data : { answers: mcqAnswersSchema.shape.answers.parse(input), development: '' }; }
