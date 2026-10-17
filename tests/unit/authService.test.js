import { describe, it, expect, beforeEach } from 'vitest';
import { AuthService } from '../../src/services/authService.js';
import { MemoryStorageAdapter } from '../../src/repositories/adapters/MemoryStorageAdapter.js';
import { ROLES } from '../../src/domain/enums/roles.js';
import { AUDIT_ACTIONS } from '../../src/domain/enums/auditActions.js';
import employees from '../../src/data/seed/employees.json';

function makeService() {
  const data = new MemoryStorageAdapter();
  const session = new MemoryStorageAdapter();
  data.set('employees', structuredClone(employees));
  return { service: new AuthService(data, session), data, session };
}

function auditEvents() {
  // AuthService audits through the app-level audit facade (localStorage in jsdom).
  return JSON.parse(globalThis.localStorage.getItem('cbte:auditEvents') ?? '[]');
}

beforeEach(() => {
  globalThis.localStorage.clear();
  globalThis.sessionStorage.clear();
  // Seed bank parameters so sessions receive a business date.
  globalThis.localStorage.setItem(
    'cbte:bankParameters',
    JSON.stringify([{ id: 'BANK-PARAMS', businessDate: '2026-10-17' }]),
  );
});

describe('auth service', () => {
  it('logs in a demo user and writes a LOGIN audit event', async () => {
    const { service } = makeService();
    const session = await service.login('teller01', 'Teller@123');
    expect(session.role).toBe(ROLES.TELLER);
    expect(session.branch).toBe('BR001');
    expect(session.businessDate).toBeTruthy();

    const events = auditEvents();
    expect(events.some((e) => e.action === AUDIT_ACTIONS.LOGIN && e.performedBy === 'teller01')).toBe(true);
  });

  it('rejects a wrong password and audits LOGIN_FAILED', async () => {
    const { service } = makeService();
    await expect(service.login('teller01', 'wrong')).rejects.toThrow(/invalid/i);
    const events = auditEvents();
    expect(events.some((e) => e.action === AUDIT_ACTIONS.LOGIN_FAILED && e.result === 'FAILURE')).toBe(true);
  });

  it('rejects unknown users without revealing which part failed', async () => {
    const { service } = makeService();
    await expect(service.login('nosuchuser', 'x')).rejects.toThrow(/invalid username or password/i);
  });

  it('validates empty credentials before hitting the repository', async () => {
    const { service } = makeService();
    await expect(service.login('', '')).rejects.toThrow(/enter username and password/i);
  });

  it('session persists in the session adapter (survives refresh)', async () => {
    const { service } = makeService();
    await service.login('maker01', 'Maker@123');
    const restored = await service.getCurrentSession();
    expect(restored.username).toBe('maker01');
    expect(restored.role).toBe(ROLES.CUSTOMER_SERVICE_MAKER);
  });

  it('logout clears the session and writes a LOGOUT audit event', async () => {
    const { service } = makeService();
    await service.login('manager01', 'Manager@123');
    await service.logout();
    expect(await service.getCurrentSession()).toBeNull();
    const events = auditEvents();
    expect(events.some((e) => e.action === AUDIT_ACTIONS.LOGOUT && e.performedBy === 'manager01')).toBe(true);
  });

  it('switchDemoUser ends the old session and creates a newly audited session', async () => {
    const { service } = makeService();
    await service.login('teller01', 'Teller@123');
    const next = await service.switchDemoUser('tellerauthoriser01');
    expect(next.role).toBe(ROLES.TELLER_AUTHORISER);
    expect(next.via).toBe('SWITCH');

    const events = auditEvents();
    expect(events.some((e) => e.action === AUDIT_ACTIONS.SESSION_SWITCH)).toBe(true);
    const switches = events.filter((e) => e.action === AUDIT_ACTIONS.LOGIN);
    expect(switches.some((e) => e.performedBy === 'tellerauthoriser01' && e.details.via === 'SWITCH')).toBe(true);
  });

  it('switchDemoUser refuses unknown users', async () => {
    const { service } = makeService();
    await service.login('teller01', 'Teller@123');
    await expect(service.switchDemoUser('ghost')).rejects.toThrow(/demo users/i);
    expect((await service.getCurrentSession()).username).toBe('teller01');
  });

  it('all 11 demo roles from the specification exist', () => {
    const roles = new Set(employees.map((e) => e.role));
    for (const role of Object.values(ROLES)) {
      expect(roles.has(role), role).toBe(true);
    }
    expect(employees.length).toBe(11);
  });
});
