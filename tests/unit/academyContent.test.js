import { describe, it, expect } from 'vitest';
import { OPERATIONS, getOperation } from '../../src/data/operationSpecifications/operations.js';
import {
  OPERATION_CONCEPTS,
  getOperationConcept,
  practiceUsersForOperation,
} from '../../src/data/academyContent/operationConcepts.js';
import { ACADEMY_MODULES, ACADEMY_MODULES_BY_KEY } from '../../src/data/academyContent/modules.js';
import employees from '../../src/data/seed/employees.json';

describe('academy curriculum modules', () => {
  it('has exactly the 9 mandated concept modules', () => {
    expect(ACADEMY_MODULES.length).toBe(9);
    const titles = ACADEMY_MODULES.map((m) => m.title);
    for (const t of ['Customer & CIF', 'Accounts', 'Teller Operations', 'Payments', 'Term Deposits', 'Loans', 'Control & Authorisation', 'Accounting', 'Day End']) {
      expect(titles).toContain(t);
    }
  });

  it('every module has a summary and non-empty concept topics', () => {
    for (const m of ACADEMY_MODULES) {
      expect(m.summary.length).toBeGreaterThan(10);
      expect(m.topics.length).toBeGreaterThanOrEqual(4);
      for (const topic of m.topics) {
        expect(topic.title.length).toBeGreaterThan(2);
        expect(topic.body.length).toBeGreaterThanOrEqual(1);
      }
    }
  });
});

describe('per-operation concept pages (10 sections each)', () => {
  it('every registered simulator operation has a concept page', () => {
    for (const op of OPERATIONS) {
      expect(getOperationConcept(op.code), op.code).not.toBeNull();
    }
  });

  it('every concept page fills all ten sections', () => {
    for (const [code, c] of Object.entries(OPERATION_CONCEPTS)) {
      expect(c.concept, `${code} business concept`).toBeTruthy();
      expect(c.branchScenario, `${code} branch scenario`).toBeTruthy();
      expect(c.roles.length, `${code} roles involved`).toBeGreaterThan(0);
      expect(c.flow.length, `${code} end-to-end flow`).toBeGreaterThan(0);
      expect(c.recordsCreated.length, `${code} records created`).toBeGreaterThan(0);
      expect(c.statusChanges.length, `${code} status changes`).toBeGreaterThan(0);
      expect(c.recovery, `${code} recovery`).toBeTruthy();

      // Simulator practice with realistic training data
      const p = c.practice;
      expect(p, `${code} practice`).toBeDefined();
      expect(p.login, `${code} practice login`).toBeTruthy();
      expect(p.expectedResult, `${code} expected result`).toBeTruthy();
      expect(p.verify.length, `${code} verification list`).toBeGreaterThan(0);
    }
  });

  it('concept codes map 1:1 to the operation registry', () => {
    for (const code of Object.keys(OPERATION_CONCEPTS)) {
      expect(getOperation(code), code).not.toBeNull();
    }
    expect(Object.keys(OPERATION_CONCEPTS).length).toBe(OPERATIONS.length);
  });

  it('financial operations document a debit and credit', () => {
    for (const op of OPERATIONS) {
      const c = OPERATION_CONCEPTS[op.code];
      if (op.financial) {
        expect(c.accounting, op.code).not.toBeNull();
        expect(c.accounting.debit, op.code).toBeTruthy();
        expect(c.accounting.credit, op.code).toBeTruthy();
      }
    }
  });

  it('every concept belongs to a valid academy module, and every module has operations', () => {
    for (const c of Object.values(OPERATION_CONCEPTS)) {
      expect(ACADEMY_MODULES_BY_KEY[c.academyModule], c.academyModule).toBeDefined();
    }
    for (const m of ACADEMY_MODULES) {
      const count = Object.values(OPERATION_CONCEPTS).filter((c) => c.academyModule === m.key).length;
      expect(count, m.key).toBeGreaterThan(0);
    }
  });
});

describe('guide-page credentials for the operation', () => {
  it('CIF creation lists maker first, then authoriser, with credentials', () => {
    const users = practiceUsersForOperation(getOperation('CIF-CREATE-001'), employees);
    expect(users.length).toBeGreaterThanOrEqual(2);
    expect(users[0].involvement).toBe('Maker');
    expect(users[0].username).toBe('maker01');
    expect(users[0].password).toBe('Maker@123');
    expect(users[1].involvement).toBe('Authoriser');
    expect(users[1].username).toBe('checker01');
  });

  it('internal transfer lists the teller and the teller authoriser', () => {
    const users = practiceUsersForOperation(getOperation('PAY-INTERNAL-001'), employees);
    const usernames = users.map((u) => u.username);
    expect(usernames).toContain('teller01');
    expect(usernames).toContain('tellerauthoriser01');
    for (const u of users) {
      expect(u.password).toBeTruthy();
      expect(u.branch).toBeTruthy();
    }
  });

  it('admin operations expose only the system administrator', () => {
    const users = practiceUsersForOperation(getOperation('ADMIN-RESET-001'), employees);
    expect(users.length).toBe(1);
    expect(users[0].username).toBe('admin01');
  });
});
