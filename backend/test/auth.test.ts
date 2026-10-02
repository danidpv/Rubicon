import { describe, expect, it } from 'vitest';
import { sessionIsValid } from '../src/modules/auth/session.service';
import { roleAllowed } from '../src/common/guards/auth.guard';
describe('seguridad de sesión y RBAC', () => {
  const now = Date.now();
  const session = { revokedAt: null, expiresAt: new Date(now + 10000), lastSeenAt: new Date(now) };
  it('rechaza revocación, suspensión, expiración e inactividad', () => {
    expect(sessionIsValid(session, 'ACTIVE', now)).toBe(true);
    expect(sessionIsValid(session, 'DISABLED', now)).toBe(false);
    expect(sessionIsValid({ ...session, revokedAt: new Date(now) }, 'ACTIVE', now)).toBe(false);
    expect(sessionIsValid({ ...session, expiresAt: new Date(now - 1) }, 'ACTIVE', now)).toBe(false);
    expect(sessionIsValid({ ...session, lastSeenAt: new Date(now - 86400001) }, 'ACTIVE', now)).toBe(false);
  });
  it('no eleva roles por implicación', () => { expect(roleAllowed('ADMIN', ['SUPERADMIN'])).toBe(false); expect(roleAllowed('USER', ['SUPPORT', 'ADMIN'])).toBe(false); });
});
