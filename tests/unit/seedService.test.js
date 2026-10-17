import { describe, it, expect, beforeEach } from 'vitest';
import { SeedService } from '../../src/services/seedService.js';
import { MemoryStorageAdapter } from '../../src/repositories/adapters/MemoryStorageAdapter.js';
import { getRepository, COLLECTIONS } from '../../src/repositories/index.js';
import { AUDIT_ACTIONS } from '../../src/domain/enums/auditActions.js';

let adapter;
let service;

beforeEach(() => {
  adapter = new MemoryStorageAdapter();
  service = new SeedService(adapter);
});

describe('seed loader and environment reset', () => {
  it('loads all seed collections on first boot', async () => {
    expect(await service.isSeeded()).toBe(false);
    const seeded = await service.ensureSeeded();
    expect(seeded).toBe(true);
    expect(await service.isSeeded()).toBe(true);

    expect(await getRepository(COLLECTIONS.EMPLOYEES, adapter).count()).toBe(11);
    expect(await getRepository(COLLECTIONS.CUSTOMERS, adapter).count()).toBeGreaterThanOrEqual(7);
    expect(await getRepository(COLLECTIONS.ACCOUNTS, adapter).count()).toBeGreaterThanOrEqual(8);

    // First boot records an ENVIRONMENT_SEEDED audit event.
    const events = await getRepository(COLLECTIONS.AUDIT_EVENTS, adapter).findAll();
    expect(events.length).toBe(1);
    expect(events[0].action).toBe(AUDIT_ACTIONS.ENVIRONMENT_SEEDED);
  });

  it('is idempotent: does not reseed when the version matches', async () => {
    await service.ensureSeeded();
    const repo = getRepository(COLLECTIONS.CUSTOMERS, adapter);
    await repo.update('CIF000001', { name: 'Changed During Practice' });
    expect(await service.ensureSeeded()).toBe(false);
    expect((await repo.findById('CIF000001')).name).toBe('Changed During Practice');
  });

  it('reset restores seed data, wipes practice data and audits the reset', async () => {
    await service.ensureSeeded();
    const customers = getRepository(COLLECTIONS.CUSTOMERS, adapter);
    const audits = getRepository(COLLECTIONS.AUDIT_EVENTS, adapter);

    await customers.update('CIF000001', { name: 'Changed During Practice' });
    await audits.insert({ id: 'AUD-PRACTICE', action: 'LOGIN', performedBy: 'teller01', timestamp: 'x' });

    await service.resetEnvironment({ performedBy: 'admin01', performedByRole: 'SYSTEM_ADMIN' });

    expect((await customers.findById('CIF000001')).name).toBe('Amit Sharma');
    const events = await audits.findAll();
    expect(events.length).toBe(1);
    expect(events[0].action).toBe(AUDIT_ACTIONS.ENVIRONMENT_RESET);
    expect(events[0].performedBy).toBe('admin01');
    expect(events[0].businessDate).toBe('2026-10-17');
  });

  it('reset does not touch the session storage namespace', async () => {
    globalThis.sessionStorage.setItem('cbte:session:sessions', '[{"id":"SES-1"}]');
    await service.ensureSeeded();
    await service.resetEnvironment({ performedBy: 'admin01' });
    expect(globalThis.sessionStorage.getItem('cbte:session:sessions')).toBe('[{"id":"SES-1"}]');
  });

  it('seed contains the mandated fictional training data', async () => {
    await service.ensureSeeded();
    const accounts = await getRepository(COLLECTIONS.ACCOUNTS, adapter).findAll();
    const byId = Object.fromEntries(accounts.map((a) => [a.id, a]));

    expect(byId.SB000001.availableBalance).toBe(100000);
    expect(byId.SB000002.availableBalance).toBe(50000);
    expect(byId.SB000003.status).toBe('DEBIT_FROZEN');
    expect(byId.SB000005.status).toBe('DORMANT');
    expect(byId.SB000006.status).toBe('FROZEN');
    expect(byId.SB000007.lienAmount).toBe(20000);
    expect(byId.CA000001.category).toBe('CURRENT');

    const customers = await getRepository(COLLECTIONS.CUSTOMERS, adapter).findAll();
    expect(customers.some((c) => c.status === 'PENDING_AUTHORISATION')).toBe(true);
    expect(customers.some((c) => c.kycStatus === 'EXPIRED')).toBe(true);
    expect(customers.some((c) => c.type === 'CORPORATE')).toBe(true);

    const fds = await getRepository(COLLECTIONS.TERM_DEPOSITS, adapter).findAll();
    expect(fds.some((f) => f.status === 'ACTIVE')).toBe(true);
    expect(fds.some((f) => f.status === 'MATURED')).toBe(true);

    const loans = await getRepository(COLLECTIONS.LOANS, adapter).findAll();
    expect(loans.some((l) => l.status === 'ACTIVE')).toBe(true);
    expect(loans.some((l) => l.overdueAmount > 0)).toBe(true);

    const txns = await getRepository(COLLECTIONS.TRANSACTIONS, adapter).findAll();
    expect(txns.some((t) => t.status === 'PENDING_AUTHORISATION')).toBe(true);

    const messages = await getRepository(COLLECTIONS.INTEGRATION_MESSAGES, adapter).findAll();
    expect(messages.some((m) => m.responseStatus === 'FAILED')).toBe(true);
  });
});
