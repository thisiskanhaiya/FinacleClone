import { describe, it, expect } from 'vitest';
import { OPERATIONS, getOperation } from '../../src/data/operationSpecifications/operations.js';
import { isValidRole } from '../../src/domain/enums/roles.js';
import { isValidModule } from '../../src/domain/enums/modules.js';
import { isValidMode } from '../../src/domain/enums/operationModes.js';

describe('operation registry integrity', () => {
  it('registers the full catalogue (69 operations)', () => {
    expect(OPERATIONS.length).toBe(69);
  });

  it('has unique operation codes', () => {
    const codes = OPERATIONS.map((o) => o.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it('every entry has the mandatory registry fields', () => {
    for (const op of OPERATIONS) {
      expect(op.code, op.code).toMatch(/^[A-Z0-9-]+$/);
      expect(op.name.length, op.code).toBeGreaterThan(2);
      expect(isValidModule(op.module), op.code).toBe(true);
      expect(Array.isArray(op.keywords), op.code).toBe(true);
      expect(op.route, op.code).toContain(op.code);
      expect(op.allowedRoles.length, op.code).toBeGreaterThan(0);
      expect(op.modes.length, op.code).toBeGreaterThan(0);
      expect(typeof op.makerChecker, op.code).toBe('boolean');
      expect(typeof op.financial, op.code).toBe('boolean');
      expect(['BEGINNER', 'INTERMEDIATE', 'ADVANCED'], op.code).toContain(op.difficulty);
      expect(op.phase, op.code).toBeGreaterThanOrEqual(1);
    }
  });

  it('uses only valid roles and modes', () => {
    for (const op of OPERATIONS) {
      for (const role of op.allowedRoles) expect(isValidRole(role), `${op.code}:${role}`).toBe(true);
      for (const mode of op.modes) expect(isValidMode(mode), `${op.code}:${mode}`).toBe(true);
    }
  });

  it('contains all operations required by the specification', () => {
    const required = [
      'CIF-CREATE-001', 'CIF-CORP-001', 'CIF-MODIFY-001', 'CIF-INQUIRY-001', 'CIF-KYC-001',
      'CIF-NOMINEE-001', 'CIF-ADDRESS-001', 'CIF-RISK-001',
      'ACCT-SAV-OPEN-001', 'ACCT-CUR-OPEN-001', 'ACCT-INQUIRY-001', 'ACCT-CLOSE-001',
      'ACCT-FREEZE-001', 'ACCT-UNFREEZE-001', 'ACCT-DEBIT-FREEZE-001', 'ACCT-CREDIT-FREEZE-001',
      'ACCT-LIEN-001', 'ACCT-LIEN-RELEASE-001', 'ACCT-DORMANT-001',
      'TEL-SESSION-OPEN-001', 'TEL-CASH-DEPOSIT-001', 'TEL-CASH-WITHDRAWAL-001',
      'TEL-CASH-POSITION-001', 'TEL-SESSION-CLOSE-001',
      'PAY-INTERNAL-001', 'PAY-NEFT-001', 'PAY-RTGS-001',
      'PAY-SI-CREATE-001', 'PAY-SI-EXECUTE-001', 'PAY-SI-CANCEL-001',
      'TD-CREATE-001', 'TD-INQUIRY-001', 'TD-MATURITY-001', 'TD-RENEW-001', 'TD-PREMATURE-001', 'TD-CLOSE-001',
      'LOAN-APPLY-001', 'LOAN-ASSESS-001', 'LOAN-SANCTION-001', 'LOAN-DISBURSE-001',
      'LOAN-EMI-INQUIRY-001', 'LOAN-EMI-RECOVER-001', 'LOAN-PARTPAY-001', 'LOAN-PRECLOSE-001',
      'LOAN-OVERDUE-001', 'LOAN-CLOSE-001',
      'TXN-INQUIRY-001', 'TXN-REVERSE-001', 'TXN-FAILED-001', 'TXN-EXCEPTION-001',
      'GL-JOURNAL-INQUIRY-001', 'GL-ACCOUNT-INQUIRY-001', 'GL-TRIAL-BALANCE-001',
      'GL-SUSPENSE-001', 'GL-OFFICE-ACCOUNT-001',
      'EOD-PRECHECK-001', 'EOD-TELLER-001', 'EOD-BATCH-001', 'EOD-CLOSE-001', 'EOD-REPORT-001',
      'AUT-QUEUE-001',
    ];
    for (const code of required) {
      expect(getOperation(code), code).not.toBeNull();
    }
  });
});
