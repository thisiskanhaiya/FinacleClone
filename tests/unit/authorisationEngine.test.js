import { describe, it, expect } from 'vitest';
import { authorisationEngine } from '../../src/engine/AuthorisationEngine.js';
import { getOperation } from '../../src/data/operationSpecifications/operations.js';
import { WORKFLOW_STATUS as S } from '../../src/domain/enums/workflowStatus.js';
import { ROLES } from '../../src/domain/enums/roles.js';

const transferOp = getOperation('PAY-INTERNAL-001');

function request(overrides = {}) {
  return {
    id: 'REQ-TEST-1',
    operationCode: 'PAY-INTERNAL-001',
    makerId: 'teller01',
    status: S.PENDING_AUTHORISATION,
    ...overrides,
  };
}

describe('authorisation engine', () => {
  it('allows an eligible checker to decide', () => {
    const checker = { username: 'tellerauthoriser01', role: ROLES.TELLER_AUTHORISER };
    expect(authorisationEngine.assertCanDecide(request(), checker, transferOp)).toBe(true);
  });

  it('blocks maker self-authorisation', () => {
    const maker = { username: 'teller01', role: ROLES.TELLER };
    expect(() => authorisationEngine.assertCanDecide(request(), maker, transferOp))
      .toThrow(/own request/i);
  });

  it('blocks roles without authorisation capability for the operation', () => {
    const loanOfficer = { username: 'loanofficer01', role: ROLES.LOAN_OFFICER };
    expect(() => authorisationEngine.assertCanDecide(request(), loanOfficer, transferOp))
      .toThrow(/cannot authorise/i);
  });

  it('blocks decisions on requests that are not pending', () => {
    const checker = { username: 'tellerauthoriser01', role: ROLES.TELLER_AUTHORISER };
    expect(() => authorisationEngine.assertCanDecide(request({ status: S.APPROVED }), checker, transferOp))
      .toThrow(/duplicate approval/i);
  });

  it('requires remarks for rejection and return, not for approval', () => {
    expect(() => authorisationEngine.assertValidDecision('REJECT', '')).toThrow(/remarks/i);
    expect(() => authorisationEngine.assertValidDecision('RETURN', '  ')).toThrow(/remarks/i);
    expect(authorisationEngine.assertValidDecision('REJECT', 'Amount mismatch')).toBe(true);
    expect(authorisationEngine.assertValidDecision('APPROVE', '')).toBe(true);
  });

  it('rejects unknown decisions', () => {
    expect(() => authorisationEngine.assertValidDecision('MAYBE', 'x')).toThrow(/decision/i);
  });
});
