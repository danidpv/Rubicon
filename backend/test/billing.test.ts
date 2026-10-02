import { it, expect } from 'vitest';
import { isNewerEvent } from '../src/modules/subscriptions/billing.service';
it('no aplica eventos de facturación anteriores al estado persistido', () => { expect(isNewerEvent(new Date(2000), new Date(1000))).toBe(false); expect(isNewerEvent(new Date(1000), new Date(2000))).toBe(true); expect(isNewerEvent(null, new Date(1000))).toBe(true); });
