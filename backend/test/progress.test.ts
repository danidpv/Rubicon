import { it, expect } from 'vitest';
import { ReviewSchedulingService, updateMastery } from '../src/modules/error-bank/review-scheduling.service';
import { grantsAccess } from '../src/modules/subscriptions/entitlement.service';
it('actualiza dominio y espacia el refuerzo de forma determinista', () => { expect(updateMastery(80, 40)).toBe(70); const now = new Date('2026-01-01T00:00:00Z'); expect(new ReviewSchedulingService().next('SEVERE', now).toISOString()).toBe('2026-01-02T00:00:00.000Z'); expect(new ReviewSchedulingService().next('MASTERED', now).toISOString()).toBe('2026-01-11T00:00:00.000Z'); });
it('no concede módulos por accesos caducados o revocados', () => { expect(grantsAccess(['TEMARIO_PRACTICO'], [], 'SUPUESTOS')).toBe(false); expect(grantsAccess([], [{ module: 'SUPUESTOS', expiresAt: new Date(0), revokedAt: null }], 'SUPUESTOS')).toBe(false); expect(grantsAccess([], [{ module: 'SUPUESTOS', expiresAt: null, revokedAt: new Date() }], 'SUPUESTOS')).toBe(false); });
