/**
 * Demo employee roles for the Core Banking Training Environment.
 * These are training-system roles, not mappings to any real bank's role table.
 */
export const ROLES = Object.freeze({
  CUSTOMER_SERVICE_MAKER: 'CUSTOMER_SERVICE_MAKER',
  OPERATIONS_CHECKER: 'OPERATIONS_CHECKER',
  TELLER: 'TELLER',
  TELLER_AUTHORISER: 'TELLER_AUTHORISER',
  DEPOSIT_MAKER: 'DEPOSIT_MAKER',
  DEPOSIT_CHECKER: 'DEPOSIT_CHECKER',
  LOAN_OFFICER: 'LOAN_OFFICER',
  LOAN_MANAGER: 'LOAN_MANAGER',
  BRANCH_MANAGER: 'BRANCH_MANAGER',
  AUDITOR: 'AUDITOR',
  SYSTEM_ADMIN: 'SYSTEM_ADMIN',
});

export const ROLE_LABELS = Object.freeze({
  [ROLES.CUSTOMER_SERVICE_MAKER]: 'Customer Service Maker',
  [ROLES.OPERATIONS_CHECKER]: 'Operations Checker',
  [ROLES.TELLER]: 'Teller',
  [ROLES.TELLER_AUTHORISER]: 'Teller Authoriser',
  [ROLES.DEPOSIT_MAKER]: 'Deposit Maker',
  [ROLES.DEPOSIT_CHECKER]: 'Deposit Checker',
  [ROLES.LOAN_OFFICER]: 'Loan Officer',
  [ROLES.LOAN_MANAGER]: 'Loan Manager',
  [ROLES.BRANCH_MANAGER]: 'Branch Manager',
  [ROLES.AUDITOR]: 'Auditor',
  [ROLES.SYSTEM_ADMIN]: 'System Administrator',
});

export const ALL_ROLES = Object.freeze(Object.values(ROLES));

export function isValidRole(role) {
  return ALL_ROLES.includes(role);
}
