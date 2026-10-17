import { describe, it, expect } from 'vitest';
import { decideNavigation } from '../../src/router/guards.js';
import { ROLES } from '../../src/domain/enums/roles.js';

const tellerSession = { username: 'teller01', role: ROLES.TELLER, branch: 'BR001' };
const adminSession = { username: 'admin01', role: ROLES.SYSTEM_ADMIN, branch: 'HEAD-OFFICE' };
const auditorSession = { username: 'auditor01', role: ROLES.AUDITOR, branch: 'BR001' };

function route(meta, params = {}, fullPath = '/x') {
  return { meta, params, fullPath };
}

describe('route guard decisions', () => {
  it('allows public routes without a session', () => {
    expect(decideNavigation(route({ public: true }), null).action).toBe('allow');
  });

  it('redirects anonymous users to login with the target preserved', () => {
    const decision = decideNavigation(route({}, {}, '/simulator'), null);
    expect(decision.action).toBe('login');
    expect(decision.redirect).toBe('/simulator');
  });

  it('allows authenticated users onto plain protected routes', () => {
    expect(decideNavigation(route({}, {}, '/simulator'), tellerSession).action).toBe('allow');
  });

  it('blocks roles not listed in route meta, allows listed roles', () => {
    const adminOnly = route({ roles: [ROLES.SYSTEM_ADMIN] }, {}, '/simulator/admin');
    expect(decideNavigation(adminOnly, tellerSession).action).toBe('forbidden');
    expect(decideNavigation(adminOnly, adminSession).action).toBe('allow');
  });

  it('allows permitted roles onto dynamic operation routes', () => {
    const decision = decideNavigation(
      route({ dynamicOperation: true }, { code: 'PAY-INTERNAL-001' }),
      tellerSession,
    );
    expect(decision.action).toBe('allow');
    expect(decision.operationCode).toBe('PAY-INTERNAL-001');
  });

  it('blocks unauthorised roles from dynamic operation routes', () => {
    const decision = decideNavigation(
      route({ dynamicOperation: true }, { code: 'CIF-CREATE-001' }),
      tellerSession,
    );
    expect(decision.action).toBe('forbidden');
    expect(decision.reason).toBe('NOT_AUTHORISED');
  });

  it('treats unknown operation codes as not found', () => {
    const decision = decideNavigation(
      route({ dynamicOperation: true }, { code: 'NOPE-999' }),
      tellerSession,
    );
    expect(decision.action).toBe('notfound');
  });

  it('is case-insensitive for operation codes in the URL', () => {
    const decision = decideNavigation(
      route({ dynamicOperation: true }, { code: 'pay-internal-001' }),
      tellerSession,
    );
    expect(decision.action).toBe('allow');
  });

  it('auditor can reach audit inquiry but not the admin reset', () => {
    expect(decideNavigation(
      route({ dynamicOperation: true }, { code: 'ENQ-AUDIT-001' }), auditorSession,
    ).action).toBe('allow');
    expect(decideNavigation(
      route({ dynamicOperation: true }, { code: 'ADMIN-RESET-001' }), auditorSession,
    ).action).toBe('forbidden');
  });

  it('auditor cannot reach posting operations', () => {
    expect(decideNavigation(
      route({ dynamicOperation: true }, { code: 'TEL-CASH-DEPOSIT-001' }), auditorSession,
    ).action).toBe('forbidden');
  });
});
