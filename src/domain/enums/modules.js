/**
 * Functional modules of the Branch Operations Simulator.
 * Module keys drive left-navigation grouping and catalogue filtering.
 */
export const MODULES = Object.freeze({
  DASHBOARD: 'DASHBOARD',
  CUSTOMER: 'CUSTOMER',
  ACCOUNTS: 'ACCOUNTS',
  TELLER: 'TELLER',
  TRANSFERS: 'TRANSFERS',
  TERM_DEPOSITS: 'TERM_DEPOSITS',
  LOANS: 'LOANS',
  SERVICING: 'SERVICING',
  AUTHORISATION: 'AUTHORISATION',
  ENQUIRIES: 'ENQUIRIES',
  EXCEPTIONS: 'EXCEPTIONS',
  GENERAL_LEDGER: 'GENERAL_LEDGER',
  INTEGRATION: 'INTEGRATION',
  REPORTS: 'REPORTS',
  DAY_END: 'DAY_END',
  ADMINISTRATION: 'ADMINISTRATION',
});

export const MODULE_LABELS = Object.freeze({
  [MODULES.DASHBOARD]: 'Dashboard',
  [MODULES.CUSTOMER]: 'Customers',
  [MODULES.ACCOUNTS]: 'Accounts',
  [MODULES.TELLER]: 'Teller Operations',
  [MODULES.TRANSFERS]: 'Transfers and Payments',
  [MODULES.TERM_DEPOSITS]: 'Term Deposits',
  [MODULES.LOANS]: 'Loans',
  [MODULES.SERVICING]: 'Account Servicing',
  [MODULES.AUTHORISATION]: 'Authorisation',
  [MODULES.ENQUIRIES]: 'Enquiries',
  [MODULES.EXCEPTIONS]: 'Exception Queue',
  [MODULES.GENERAL_LEDGER]: 'General Ledger',
  [MODULES.INTEGRATION]: 'Integration Console',
  [MODULES.REPORTS]: 'Reports',
  [MODULES.DAY_END]: 'Day End',
  [MODULES.ADMINISTRATION]: 'Administration',
});

export function isValidModule(moduleKey) {
  return Object.values(MODULES).includes(moduleKey);
}
