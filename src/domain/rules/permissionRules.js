import { ROLES } from '../enums/roles.js';

/**
 * Role capabilities. These are coarse-grained abilities enforced at every
 * layer (router guard, operation search, engines, services). Fine-grained
 * access to a specific operation is governed by the operation registry's
 * allowedRoles list in combination with these capabilities.
 */
export const CAPABILITIES = Object.freeze({
  MAKE_REQUEST: 'MAKE_REQUEST',
  AUTHORISE_REQUEST: 'AUTHORISE_REQUEST',
  POST_FINANCIAL: 'POST_FINANCIAL',
  TELLER_TRANSACT: 'TELLER_TRANSACT',
  RUN_DAY_END: 'RUN_DAY_END',
  ADMINISTER: 'ADMINISTER',
  INQUIRE: 'INQUIRE',
  VIEW_AUDIT: 'VIEW_AUDIT',
});

const ROLE_CAPABILITY_MAP = Object.freeze({
  [ROLES.CUSTOMER_SERVICE_MAKER]: [
    CAPABILITIES.MAKE_REQUEST,
    CAPABILITIES.INQUIRE,
  ],
  [ROLES.OPERATIONS_CHECKER]: [
    CAPABILITIES.AUTHORISE_REQUEST,
    CAPABILITIES.INQUIRE,
    CAPABILITIES.VIEW_AUDIT,
  ],
  [ROLES.TELLER]: [
    CAPABILITIES.MAKE_REQUEST,
    CAPABILITIES.TELLER_TRANSACT,
    CAPABILITIES.INQUIRE,
  ],
  [ROLES.TELLER_AUTHORISER]: [
    CAPABILITIES.AUTHORISE_REQUEST,
    CAPABILITIES.INQUIRE,
    CAPABILITIES.VIEW_AUDIT,
  ],
  [ROLES.DEPOSIT_MAKER]: [
    CAPABILITIES.MAKE_REQUEST,
    CAPABILITIES.INQUIRE,
  ],
  [ROLES.DEPOSIT_CHECKER]: [
    CAPABILITIES.AUTHORISE_REQUEST,
    CAPABILITIES.INQUIRE,
    CAPABILITIES.VIEW_AUDIT,
  ],
  [ROLES.LOAN_OFFICER]: [
    CAPABILITIES.MAKE_REQUEST,
    CAPABILITIES.INQUIRE,
  ],
  [ROLES.LOAN_MANAGER]: [
    CAPABILITIES.AUTHORISE_REQUEST,
    CAPABILITIES.INQUIRE,
    CAPABILITIES.VIEW_AUDIT,
  ],
  [ROLES.BRANCH_MANAGER]: [
    CAPABILITIES.AUTHORISE_REQUEST,
    CAPABILITIES.RUN_DAY_END,
    CAPABILITIES.INQUIRE,
    CAPABILITIES.VIEW_AUDIT,
  ],
  // Auditor is strictly read-only: inquiry + audit viewing, nothing else.
  [ROLES.AUDITOR]: [
    CAPABILITIES.INQUIRE,
    CAPABILITIES.VIEW_AUDIT,
  ],
  [ROLES.SYSTEM_ADMIN]: [
    CAPABILITIES.ADMINISTER,
    CAPABILITIES.INQUIRE,
    CAPABILITIES.VIEW_AUDIT,
  ],
});

export function capabilitiesForRole(role) {
  return ROLE_CAPABILITY_MAP[role] ?? [];
}

export function hasCapability(role, capability) {
  return capabilitiesForRole(role).includes(capability);
}

export function isReadOnlyRole(role) {
  const caps = capabilitiesForRole(role);
  return caps.length > 0
    && !caps.includes(CAPABILITIES.MAKE_REQUEST)
    && !caps.includes(CAPABILITIES.AUTHORISE_REQUEST)
    && !caps.includes(CAPABILITIES.ADMINISTER);
}

/**
 * Can this role access (launch or even navigate to) the given operation
 * registry entry? This is the single source of truth used by the router
 * guard, the operation search filter, and the BankingOperationEngine.
 */
export function canAccessOperation(role, operation) {
  if (!role || !operation) return false;
  return operation.allowedRoles.includes(role);
}

/**
 * Can this role act as maker (create/submit) for the operation?
 */
export function canMakeOperation(role, operation) {
  return canAccessOperation(role, operation) && hasCapability(role, CAPABILITIES.MAKE_REQUEST);
}

/**
 * Can this role act as checker/authoriser for the operation?
 */
export function canAuthoriseOperation(role, operation) {
  return canAccessOperation(role, operation) && hasCapability(role, CAPABILITIES.AUTHORISE_REQUEST);
}
