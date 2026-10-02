import { expect, it } from 'vitest';
import { canSaveExam } from '../src/modules/exams/exam.service';
it('no admite respuestas al alcanzar la expiración ni tras la entrega', () => { const now = new Date(); expect(canSaveExam('DRAFT', new Date(now.getTime() + 1), now)).toBe(true); expect(canSaveExam('DRAFT', now, now)).toBe(false); expect(canSaveExam('COMPLETED', new Date(now.getTime() + 1000), now)).toBe(false); });
