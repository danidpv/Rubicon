import { describe, it, expect } from 'vitest';
import { registerSchema } from './auth';
describe('registro', () => {
  it('normaliza identidades y rechaza campos privilegiados', () => {
    const data = { name: 'Ana Ruiz', username: 'Ana_1', email: 'ANA@example.test', password: 'a-secure-test-password', terms: true, privacy: true };
    expect(registerSchema.parse(data).email).toBe('ana@example.test');
    expect(registerSchema.safeParse({ ...data, role: 'ADMIN' }).success).toBe(false);
    expect(registerSchema.safeParse({ ...data, terms: false }).success).toBe(false);
  });
});
