import { describe, it, expect } from 'vitest';
import {
  hasCapability,
  canAccessOperation,
  canMakeOperation,
  canAuthoriseOperation,
  isReadOnlyRole,
  CAPABILITIES,
} from '../../src/domain/rules/permissionRules.js';
import { ROLES } from '../../src/domain/enums/roles.js';
import { getOperation } from '../../src/data/operationSpecifications/operations.js';

describe('role permission enforcement', () => {
  it('grants maker capabilities to maker roles only', () => {
    expect(hasCapability(ROLES.CUSTOMER_SERVICE_MAKER, CAPABILITIES.MAKE_REQUEST)).toBe(true);
    expect(hasCapability(ROLES.OPERATIONS_CHECKER, CAPABILITIES.MAKE_REQUEST)).toBe(false);
    expect(hasCapability(ROLES.TELLER, CAPABILITIES.TELLER_TRANSACT)).toBe(true);
  });

  it('auditor is strictly read-only', () => {
    expect(isReadOnlyRole(ROLES.AUDITOR)).toBe(true);
    expect(hasCapability(ROLES.AUDITOR, CAPABILITIES.MAKE_REQUEST)).toBe(false);
    expect(hasCapability(ROLES.AUDITOR, CAPABILITIES.AUTHORISE_REQUEST)).toBe(false);
    expect(hasCapability(ROLES.AUDITOR, CAPABILITIES.POST_FINANCIAL)).toBe(false);
    expect(hasCapability(ROLES.AUDITOR, CAPABILITIES.ADMINISTER)).toBe(false);
    expect(hasCapability(ROLES.AUDITOR, CAPABILITIES.INQUIRE)).toBe(true);
    expect(hasCapability(ROLES.AUDITOR, CAPABILITIES.VIEW_AUDIT)).toBe(true);
  });

  it('blocks unauthorised roles from operations at the rule level', () => {
    const cifCreate = getOperation('CIF-CREATE-001');
    expect(canAccessOperation(ROLES.CUSTOMER_SERVICE_MAKER, cifCreate)).toBe(true);
    expect(canAccessOperation(ROLES.TELLER, cifCreate)).toBe(false);
    expect(canAccessOperation(ROLES.AUDITOR, cifCreate)).toBe(false);
  });

  it('enforces maker-checker split on CIF creation', () => {
    const cifCreate = getOperation('CIF-CREATE-001');
    expect(canMakeOperation(ROLES.CUSTOMER_SERVICE_MAKER, cifCreate)).toBe(true);
    expect(canMakeOperation(ROLES.OPERATIONS_CHECKER, cifCreate)).toBe(false);
    expect(canAuthoriseOperation(ROLES.OPERATIONS_CHECKER, cifCreate)).toBe(true);
    expect(canAuthoriseOperation(ROLES.CUSTOMER_SERVICE_MAKER, cifCreate)).toBe(false);
  });

  it('restricts admin operations to SYSTEM_ADMIN', () => {
    const reset = getOperation('ADMIN-RESET-001');
    expect(canAccessOperation(ROLES.SYSTEM_ADMIN, reset)).toBe(true);
    expect(canAccessOperation(ROLES.BRANCH_MANAGER, reset)).toBe(false);
  });

  it('denies everything when role or operation is missing', () => {
    expect(canAccessOperation(null, getOperation('CIF-CREATE-001'))).toBe(false);
    expect(canAccessOperation(ROLES.TELLER, null)).toBe(false);
  });
});
