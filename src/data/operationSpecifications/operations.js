import { ROLES } from '../../domain/enums/roles.js';
import { MODULES } from '../../domain/enums/modules.js';
import { OPERATION_MODES as M } from '../../domain/enums/operationModes.js';

/**
 * Operation Registry - the single source of truth for every executable
 * operation in the Branch Operations Simulator.
 *
 * IMPORTANT: these codes are training-system codes invented for this
 * simulator. They are NOT Finacle menu codes and are never presented as such.
 *
 * Each entry:
 *   code          unique simulator operation code
 *   name          display name
 *   module        MODULES key (drives left navigation + catalogue filters)
 *   keywords      extra search terms
 *   route         simulator route that hosts the operation
 *   allowedRoles  roles that may navigate to / launch the operation
 *   modes         allowed screen modes (OPERATION_MODES)
 *   makerChecker  whether the operation requires maker-checker authorisation
 *   financial     whether the operation posts accounting entries
 *   difficulty    BEGINNER | INTERMEDIATE | ADVANCED (training catalogue)
 *   phase         delivery phase in the build plan (1 = available now)
 */

const {
  CUSTOMER_SERVICE_MAKER,
  OPERATIONS_CHECKER,
  TELLER,
  TELLER_AUTHORISER,
  DEPOSIT_MAKER,
  DEPOSIT_CHECKER,
  LOAN_OFFICER,
  LOAN_MANAGER,
  BRANCH_MANAGER,
  AUDITOR,
  SYSTEM_ADMIN,
} = ROLES;

const ALL_STAFF = Object.values(ROLES);
const INQUIRY_ROLES = ALL_STAFF; // every role may inquire
const CUSTOMER_MAKER_CHECKER = [CUSTOMER_SERVICE_MAKER, OPERATIONS_CHECKER, BRANCH_MANAGER];
const TELLER_TEAM = [TELLER, TELLER_AUTHORISER, BRANCH_MANAGER];
const DEPOSIT_TEAM = [DEPOSIT_MAKER, DEPOSIT_CHECKER, BRANCH_MANAGER];
const LOAN_TEAM = [LOAN_OFFICER, LOAN_MANAGER, BRANCH_MANAGER];
const ADMIN_ONLY = [SYSTEM_ADMIN];

function op(entry) {
  return Object.freeze({
    keywords: [],
    makerChecker: false,
    financial: false,
    difficulty: 'BEGINNER',
    modes: [M.INQUIRE],
    ...entry,
    route: entry.route ?? `/simulator/operations/${entry.code}`,
  });
}

export const OPERATIONS = Object.freeze([
  // ---------------------------------------------------------------- CUSTOMER
  op({ code: 'CIF-CREATE-001', name: 'Create Retail CIF', module: MODULES.CUSTOMER, phase: 2,
    keywords: ['cif', 'create', 'cif creation', 'creation', 'customer', 'onboard', 'onboarding', 'retail', 'new customer'],
    allowedRoles: CUSTOMER_MAKER_CHECKER, modes: [M.ADD, M.INQUIRE], makerChecker: true, difficulty: 'BEGINNER' }),
  op({ code: 'CIF-CORP-001', name: 'Create Corporate CIF', module: MODULES.CUSTOMER, phase: 2,
    keywords: ['cif', 'corporate', 'company', 'business', 'onboard'],
    allowedRoles: CUSTOMER_MAKER_CHECKER, modes: [M.ADD, M.INQUIRE], makerChecker: true, difficulty: 'INTERMEDIATE' }),
  op({ code: 'CIF-MODIFY-001', name: 'Modify Customer', module: MODULES.CUSTOMER, phase: 2,
    keywords: ['cif', 'modify', 'edit', 'customer', 'update'],
    allowedRoles: CUSTOMER_MAKER_CHECKER, modes: [M.MODIFY, M.INQUIRE], makerChecker: true, difficulty: 'BEGINNER' }),
  op({ code: 'CIF-INQUIRY-001', name: 'Customer 360 Inquiry', module: MODULES.CUSTOMER, phase: 2,
    keywords: ['cif', 'inquiry', 'customer 360', 'search customer', 'view customer'],
    allowedRoles: INQUIRY_ROLES, modes: [M.INQUIRE], difficulty: 'BEGINNER' }),

  // ---------------------------------------------------------------- ACCOUNTS
  op({ code: 'ACCT-SAV-OPEN-001', name: 'Open Savings Account', module: MODULES.ACCOUNTS, phase: 2,
    keywords: ['account', 'open', 'savings', 'new account', 'sb'],
    allowedRoles: CUSTOMER_MAKER_CHECKER, modes: [M.ADD, M.INQUIRE], makerChecker: true, difficulty: 'BEGINNER' }),
  op({ code: 'ACCT-CUR-OPEN-001', name: 'Open Current Account', module: MODULES.ACCOUNTS, phase: 2,
    keywords: ['account', 'open', 'current', 'ca', 'business account'],
    allowedRoles: CUSTOMER_MAKER_CHECKER, modes: [M.ADD, M.INQUIRE], makerChecker: true, difficulty: 'INTERMEDIATE' }),
  op({ code: 'ACCT-INQUIRY-001', name: 'Account Inquiry', module: MODULES.ACCOUNTS, phase: 2,
    keywords: ['account', 'inquiry', 'balance', 'view account', 'ledger'],
    allowedRoles: INQUIRY_ROLES, modes: [M.INQUIRE], difficulty: 'BEGINNER' }),

  // --------------------------------------------------------------- SERVICING
  op({ code: 'CIF-KYC-001', name: 'Update KYC', module: MODULES.SERVICING, phase: 7,
    keywords: ['kyc', 'update', 'compliance', 'documents', 'servicing'],
    allowedRoles: CUSTOMER_MAKER_CHECKER, modes: [M.MODIFY, M.INQUIRE], makerChecker: true, difficulty: 'INTERMEDIATE' }),
  op({ code: 'CIF-NOMINEE-001', name: 'Add or Modify Nominee', module: MODULES.SERVICING, phase: 7,
    keywords: ['nominee', 'nomination', 'servicing'],
    allowedRoles: CUSTOMER_MAKER_CHECKER, modes: [M.ADD, M.MODIFY, M.INQUIRE], makerChecker: true, difficulty: 'BEGINNER' }),
  op({ code: 'CIF-ADDRESS-001', name: 'Change Address', module: MODULES.SERVICING, phase: 7,
    keywords: ['address', 'change', 'servicing', 'contact'],
    allowedRoles: CUSTOMER_MAKER_CHECKER, modes: [M.MODIFY, M.INQUIRE], makerChecker: true, difficulty: 'BEGINNER' }),
  op({ code: 'CIF-RISK-001', name: 'Update Risk Classification', module: MODULES.SERVICING, phase: 7,
    keywords: ['risk', 'classification', 'servicing', 'rating'],
    allowedRoles: [OPERATIONS_CHECKER, BRANCH_MANAGER], modes: [M.MODIFY, M.INQUIRE], makerChecker: true, difficulty: 'ADVANCED' }),
  op({ code: 'ACCT-CLOSE-001', name: 'Close Account', module: MODULES.SERVICING, phase: 7,
    keywords: ['account', 'close', 'closure', 'servicing'],
    allowedRoles: CUSTOMER_MAKER_CHECKER, modes: [M.CLOSE, M.INQUIRE], makerChecker: true, financial: true, difficulty: 'INTERMEDIATE' }),
  op({ code: 'ACCT-FREEZE-001', name: 'Freeze Account', module: MODULES.SERVICING, phase: 7,
    keywords: ['freeze', 'block', 'account', 'servicing'],
    allowedRoles: [OPERATIONS_CHECKER, BRANCH_MANAGER], modes: [M.MODIFY, M.INQUIRE], makerChecker: true, difficulty: 'INTERMEDIATE' }),
  op({ code: 'ACCT-UNFREEZE-001', name: 'Unfreeze Account', module: MODULES.SERVICING, phase: 7,
    keywords: ['unfreeze', 'unblock', 'account', 'servicing'],
    allowedRoles: [OPERATIONS_CHECKER, BRANCH_MANAGER], modes: [M.MODIFY, M.INQUIRE], makerChecker: true, difficulty: 'INTERMEDIATE' }),
  op({ code: 'ACCT-DEBIT-FREEZE-001', name: 'Apply Debit Freeze', module: MODULES.SERVICING, phase: 7,
    keywords: ['debit freeze', 'block debit', 'servicing'],
    allowedRoles: [OPERATIONS_CHECKER, BRANCH_MANAGER], modes: [M.MODIFY, M.INQUIRE], makerChecker: true, difficulty: 'INTERMEDIATE' }),
  op({ code: 'ACCT-CREDIT-FREEZE-001', name: 'Apply Credit Freeze', module: MODULES.SERVICING, phase: 7,
    keywords: ['credit freeze', 'block credit', 'servicing'],
    allowedRoles: [OPERATIONS_CHECKER, BRANCH_MANAGER], modes: [M.MODIFY, M.INQUIRE], makerChecker: true, difficulty: 'INTERMEDIATE' }),
  op({ code: 'ACCT-LIEN-001', name: 'Mark Lien', module: MODULES.SERVICING, phase: 7,
    keywords: ['lien', 'hold', 'mark lien', 'servicing'],
    allowedRoles: [OPERATIONS_CHECKER, BRANCH_MANAGER], modes: [M.MODIFY, M.INQUIRE], makerChecker: true, difficulty: 'INTERMEDIATE' }),
  op({ code: 'ACCT-LIEN-RELEASE-001', name: 'Release Lien', module: MODULES.SERVICING, phase: 7,
    keywords: ['lien', 'release', 'remove hold', 'servicing'],
    allowedRoles: [OPERATIONS_CHECKER, BRANCH_MANAGER], modes: [M.MODIFY, M.INQUIRE], makerChecker: true, difficulty: 'INTERMEDIATE' }),
  op({ code: 'ACCT-DORMANT-001', name: 'Dormancy Processing', module: MODULES.SERVICING, phase: 7,
    keywords: ['dormant', 'dormancy', 'inactive account', 'servicing'],
    allowedRoles: [OPERATIONS_CHECKER, BRANCH_MANAGER], modes: [M.MODIFY, M.INQUIRE], makerChecker: true, difficulty: 'ADVANCED' }),

  // ------------------------------------------------------------------ TELLER
  op({ code: 'TEL-SESSION-OPEN-001', name: 'Open Teller Session', module: MODULES.TELLER, phase: 3,
    keywords: ['teller', 'session', 'open', 'cash', 'start of day'],
    allowedRoles: TELLER_TEAM, modes: [M.ADD, M.INQUIRE], difficulty: 'BEGINNER' }),
  op({ code: 'TEL-CASH-DEPOSIT-001', name: 'Cash Deposit', module: MODULES.TELLER, phase: 3,
    keywords: ['cash', 'deposit', 'teller', 'credit'],
    allowedRoles: TELLER_TEAM, modes: [M.ADD, M.INQUIRE], makerChecker: true, financial: true, difficulty: 'BEGINNER' }),
  op({ code: 'TEL-CASH-WITHDRAWAL-001', name: 'Cash Withdrawal', module: MODULES.TELLER, phase: 3,
    keywords: ['cash', 'withdrawal', 'withdraw', 'teller', 'debit'],
    allowedRoles: TELLER_TEAM, modes: [M.ADD, M.INQUIRE], makerChecker: true, financial: true, difficulty: 'BEGINNER' }),
  op({ code: 'TEL-CASH-POSITION-001', name: 'Teller Cash Inquiry', module: MODULES.TELLER, phase: 3,
    keywords: ['teller', 'cash', 'position', 'inquiry', 'denomination'],
    allowedRoles: [...TELLER_TEAM, AUDITOR], modes: [M.INQUIRE], difficulty: 'BEGINNER' }),
  op({ code: 'TEL-SESSION-CLOSE-001', name: 'Teller Cash Closing', module: MODULES.TELLER, phase: 3,
    keywords: ['teller', 'session', 'close', 'cash closing', 'end of day'],
    allowedRoles: TELLER_TEAM, modes: [M.CLOSE, M.INQUIRE], makerChecker: true, difficulty: 'INTERMEDIATE' }),

  // --------------------------------------------------------------- TRANSFERS
  op({ code: 'PAY-INTERNAL-001', name: 'Internal Fund Transfer', module: MODULES.TRANSFERS, phase: 4,
    keywords: ['transfer', 'internal', 'fund transfer', 'move money', 'own branch'],
    allowedRoles: TELLER_TEAM, modes: [M.ADD, M.INQUIRE], makerChecker: true, financial: true, difficulty: 'INTERMEDIATE' }),
  op({ code: 'PAY-NEFT-001', name: 'NEFT Transfer Simulation', module: MODULES.TRANSFERS, phase: 4,
    keywords: ['neft', 'transfer', 'outward', 'payment', 'gateway'],
    allowedRoles: TELLER_TEAM, modes: [M.ADD, M.INQUIRE], makerChecker: true, financial: true, difficulty: 'INTERMEDIATE' }),
  op({ code: 'PAY-RTGS-001', name: 'RTGS Transfer Simulation', module: MODULES.TRANSFERS, phase: 4,
    keywords: ['rtgs', 'transfer', 'high value', 'outward', 'payment', 'gateway'],
    allowedRoles: TELLER_TEAM, modes: [M.ADD, M.INQUIRE], makerChecker: true, financial: true, difficulty: 'INTERMEDIATE' }),
  op({ code: 'PAY-SI-CREATE-001', name: 'Create Standing Instruction', module: MODULES.TRANSFERS, phase: 4,
    keywords: ['standing instruction', 'si', 'recurring', 'auto transfer'],
    allowedRoles: TELLER_TEAM, modes: [M.ADD, M.INQUIRE], makerChecker: true, difficulty: 'INTERMEDIATE' }),
  op({ code: 'PAY-SI-EXECUTE-001', name: 'Execute Standing Instruction', module: MODULES.TRANSFERS, phase: 4,
    keywords: ['standing instruction', 'si', 'execute', 'run', 'due'],
    allowedRoles: TELLER_TEAM, modes: [M.MODIFY, M.INQUIRE], makerChecker: true, financial: true, difficulty: 'INTERMEDIATE' }),
  op({ code: 'PAY-SI-CANCEL-001', name: 'Cancel Standing Instruction', module: MODULES.TRANSFERS, phase: 4,
    keywords: ['standing instruction', 'si', 'cancel', 'stop'],
    allowedRoles: TELLER_TEAM, modes: [M.CANCEL, M.INQUIRE], makerChecker: true, difficulty: 'BEGINNER' }),

  // ------------------------------------------------------------ TERM DEPOSITS
  op({ code: 'TD-CREATE-001', name: 'Create Fixed Deposit', module: MODULES.TERM_DEPOSITS, phase: 5,
    keywords: ['fd', 'fixed deposit', 'term deposit', 'create'],
    allowedRoles: DEPOSIT_TEAM, modes: [M.ADD, M.INQUIRE], makerChecker: true, financial: true, difficulty: 'INTERMEDIATE' }),
  op({ code: 'TD-INQUIRY-001', name: 'Fixed Deposit Inquiry', module: MODULES.TERM_DEPOSITS, phase: 5,
    keywords: ['fd', 'fixed deposit', 'inquiry', 'maturity'],
    allowedRoles: INQUIRY_ROLES, modes: [M.INQUIRE], difficulty: 'BEGINNER' }),
  op({ code: 'TD-MATURITY-001', name: 'Process Maturity', module: MODULES.TERM_DEPOSITS, phase: 5,
    keywords: ['fd', 'maturity', 'payout', 'fixed deposit'],
    allowedRoles: DEPOSIT_TEAM, modes: [M.MODIFY, M.INQUIRE], makerChecker: true, financial: true, difficulty: 'INTERMEDIATE' }),
  op({ code: 'TD-RENEW-001', name: 'Renew Fixed Deposit', module: MODULES.TERM_DEPOSITS, phase: 5,
    keywords: ['fd', 'renew', 'rollover', 'fixed deposit'],
    allowedRoles: DEPOSIT_TEAM, modes: [M.MODIFY, M.INQUIRE], makerChecker: true, financial: true, difficulty: 'INTERMEDIATE' }),
  op({ code: 'TD-PREMATURE-001', name: 'Premature Closure', module: MODULES.TERM_DEPOSITS, phase: 5,
    keywords: ['fd', 'premature', 'early closure', 'penalty', 'fixed deposit'],
    allowedRoles: DEPOSIT_TEAM, modes: [M.CLOSE, M.INQUIRE], makerChecker: true, financial: true, difficulty: 'ADVANCED' }),
  op({ code: 'TD-CLOSE-001', name: 'Close Fixed Deposit', module: MODULES.TERM_DEPOSITS, phase: 5,
    keywords: ['fd', 'close', 'fixed deposit', 'closure'],
    allowedRoles: DEPOSIT_TEAM, modes: [M.CLOSE, M.INQUIRE], makerChecker: true, financial: true, difficulty: 'INTERMEDIATE' }),

  // ------------------------------------------------------------------- LOANS
  op({ code: 'LOAN-APPLY-001', name: 'Create Loan Application', module: MODULES.LOANS, phase: 6,
    keywords: ['loan', 'apply', 'application', 'borrow'],
    allowedRoles: LOAN_TEAM, modes: [M.ADD, M.INQUIRE], makerChecker: false, difficulty: 'INTERMEDIATE' }),
  op({ code: 'LOAN-ASSESS-001', name: 'Loan Assessment', module: MODULES.LOANS, phase: 6,
    keywords: ['loan', 'assessment', 'credit', 'eligibility'],
    allowedRoles: LOAN_TEAM, modes: [M.MODIFY, M.INQUIRE], difficulty: 'ADVANCED' }),
  op({ code: 'LOAN-SANCTION-001', name: 'Loan Sanction', module: MODULES.LOANS, phase: 6,
    keywords: ['loan', 'sanction', 'approve', 'credit decision'],
    allowedRoles: [LOAN_MANAGER, BRANCH_MANAGER], modes: [M.AUTHORISE, M.REJECT, M.RETURN, M.INQUIRE], difficulty: 'ADVANCED' }),
  op({ code: 'LOAN-DISBURSE-001', name: 'Loan Disbursement', module: MODULES.LOANS, phase: 6,
    keywords: ['loan', 'disburse', 'disbursement', 'payout'],
    allowedRoles: LOAN_TEAM, modes: [M.ADD, M.AUTHORISE, M.INQUIRE], makerChecker: true, financial: true, difficulty: 'ADVANCED' }),
  op({ code: 'LOAN-EMI-INQUIRY-001', name: 'EMI Schedule Inquiry', module: MODULES.LOANS, phase: 6,
    keywords: ['loan', 'emi', 'schedule', 'repayment', 'inquiry'],
    allowedRoles: INQUIRY_ROLES, modes: [M.INQUIRE], difficulty: 'BEGINNER' }),
  op({ code: 'LOAN-EMI-RECOVER-001', name: 'EMI Recovery', module: MODULES.LOANS, phase: 6,
    keywords: ['loan', 'emi', 'recovery', 'collect', 'repayment'],
    allowedRoles: LOAN_TEAM, modes: [M.ADD, M.INQUIRE], makerChecker: true, financial: true, difficulty: 'INTERMEDIATE' }),
  op({ code: 'LOAN-PARTPAY-001', name: 'Part Payment', module: MODULES.LOANS, phase: 6,
    keywords: ['loan', 'part payment', 'prepayment', 'partial'],
    allowedRoles: LOAN_TEAM, modes: [M.ADD, M.INQUIRE], makerChecker: true, financial: true, difficulty: 'ADVANCED' }),
  op({ code: 'LOAN-PRECLOSE-001', name: 'Loan Foreclosure', module: MODULES.LOANS, phase: 6,
    keywords: ['loan', 'foreclosure', 'preclose', 'early closure'],
    allowedRoles: LOAN_TEAM, modes: [M.CLOSE, M.INQUIRE], makerChecker: true, financial: true, difficulty: 'ADVANCED' }),
  op({ code: 'LOAN-OVERDUE-001', name: 'Overdue Processing', module: MODULES.LOANS, phase: 6,
    keywords: ['loan', 'overdue', 'late', 'penal', 'follow up'],
    allowedRoles: [LOAN_OFFICER, LOAN_MANAGER, BRANCH_MANAGER], modes: [M.MODIFY, M.INQUIRE], difficulty: 'ADVANCED' }),
  op({ code: 'LOAN-CLOSE-001', name: 'Loan Closure', module: MODULES.LOANS, phase: 6,
    keywords: ['loan', 'close', 'closure', 'settled'],
    allowedRoles: LOAN_TEAM, modes: [M.CLOSE, M.INQUIRE], makerChecker: true, financial: true, difficulty: 'ADVANCED' }),

  // ------------------------------------------------------------ AUTHORISATION
  op({ code: 'AUT-QUEUE-001', name: 'Authorisation Queue', module: MODULES.AUTHORISATION, phase: 2,
    keywords: ['authorise', 'authorize', 'approve', 'queue', 'pending', 'checker', 'verify'],
    allowedRoles: [OPERATIONS_CHECKER, TELLER_AUTHORISER, DEPOSIT_CHECKER, LOAN_MANAGER, BRANCH_MANAGER],
    modes: [M.VERIFY, M.AUTHORISE, M.REJECT, M.RETURN, M.INQUIRE], difficulty: 'BEGINNER' }),
  op({ code: 'AUT-INQUIRY-001', name: 'Authorisation Inquiry', module: MODULES.AUTHORISATION, phase: 8,
    keywords: ['authorisation', 'history', 'who approved', 'inquiry'],
    allowedRoles: INQUIRY_ROLES, modes: [M.INQUIRE], difficulty: 'BEGINNER' }),

  // ---------------------------------------------------------------- ENQUIRIES
  op({ code: 'TXN-INQUIRY-001', name: 'Transaction Inquiry', module: MODULES.ENQUIRIES, phase: 4,
    keywords: ['transaction', 'inquiry', 'search transaction', 'status', 'lifecycle'],
    allowedRoles: INQUIRY_ROLES, modes: [M.INQUIRE], difficulty: 'BEGINNER' }),
  op({ code: 'TXN-FAILED-001', name: 'Failed Transaction Inquiry', module: MODULES.ENQUIRIES, phase: 7,
    keywords: ['failed', 'transaction', 'error', 'inquiry'],
    allowedRoles: INQUIRY_ROLES, modes: [M.INQUIRE], difficulty: 'BEGINNER' }),
  op({ code: 'ENQ-AUDIT-001', name: 'Audit Inquiry', module: MODULES.ENQUIRIES, phase: 1,
    keywords: ['audit', 'history', 'trail', 'who did', 'events'],
    allowedRoles: [OPERATIONS_CHECKER, TELLER_AUTHORISER, DEPOSIT_CHECKER, LOAN_MANAGER, BRANCH_MANAGER, AUDITOR, SYSTEM_ADMIN],
    modes: [M.INQUIRE], difficulty: 'BEGINNER' }),

  // ---------------------------------------------------------------- EXCEPTIONS
  op({ code: 'TXN-REVERSE-001', name: 'Transaction Reversal', module: MODULES.EXCEPTIONS, phase: 7,
    keywords: ['reverse', 'reversal', 'undo', 'correction'],
    allowedRoles: [TELLER, TELLER_AUTHORISER, BRANCH_MANAGER], modes: [M.REVERSE, M.INQUIRE], makerChecker: true, financial: true, difficulty: 'ADVANCED' }),
  op({ code: 'TXN-EXCEPTION-001', name: 'Exception Resolution', module: MODULES.EXCEPTIONS, phase: 7,
    keywords: ['exception', 'resolve', 'error', 'repair'],
    allowedRoles: [OPERATIONS_CHECKER, BRANCH_MANAGER], modes: [M.MODIFY, M.INQUIRE], difficulty: 'ADVANCED' }),
  op({ code: 'EXC-QUEUE-001', name: 'Exception Queue', module: MODULES.EXCEPTIONS, phase: 7,
    keywords: ['exception', 'queue', 'open items', 'repair'],
    allowedRoles: [OPERATIONS_CHECKER, BRANCH_MANAGER, AUDITOR], modes: [M.INQUIRE], difficulty: 'INTERMEDIATE' }),

  // ------------------------------------------------------------ GENERAL LEDGER
  op({ code: 'GL-JOURNAL-INQUIRY-001', name: 'Journal Inquiry', module: MODULES.GENERAL_LEDGER, phase: 8,
    keywords: ['journal', 'gl', 'entry', 'debit', 'credit', 'inquiry'],
    allowedRoles: INQUIRY_ROLES, modes: [M.INQUIRE], difficulty: 'INTERMEDIATE' }),
  op({ code: 'GL-ACCOUNT-INQUIRY-001', name: 'GL Account Inquiry', module: MODULES.GENERAL_LEDGER, phase: 8,
    keywords: ['gl', 'account', 'balance', 'inquiry'],
    allowedRoles: INQUIRY_ROLES, modes: [M.INQUIRE], difficulty: 'INTERMEDIATE' }),
  op({ code: 'GL-TRIAL-BALANCE-001', name: 'Trial Balance', module: MODULES.GENERAL_LEDGER, phase: 8,
    keywords: ['trial balance', 'gl', 'report', 'balanced'],
    allowedRoles: [BRANCH_MANAGER, AUDITOR, SYSTEM_ADMIN, OPERATIONS_CHECKER], modes: [M.INQUIRE], difficulty: 'ADVANCED' }),
  op({ code: 'GL-SUSPENSE-001', name: 'Suspense Entry Inquiry', module: MODULES.GENERAL_LEDGER, phase: 8,
    keywords: ['suspense', 'gl', 'unreconciled', 'inquiry'],
    allowedRoles: INQUIRY_ROLES, modes: [M.INQUIRE], difficulty: 'INTERMEDIATE' }),
  op({ code: 'GL-OFFICE-ACCOUNT-001', name: 'Office Account Inquiry', module: MODULES.GENERAL_LEDGER, phase: 8,
    keywords: ['office account', 'gl', 'internal account', 'inquiry'],
    allowedRoles: INQUIRY_ROLES, modes: [M.INQUIRE], difficulty: 'INTERMEDIATE' }),

  // --------------------------------------------------------------- INTEGRATION
  op({ code: 'INT-CONSOLE-001', name: 'Integration Console', module: MODULES.INTEGRATION, phase: 8,
    keywords: ['integration', 'message', 'adapter', 'neft', 'rtgs', 'kyc', 'aml', 'retry'],
    allowedRoles: [OPERATIONS_CHECKER, BRANCH_MANAGER, AUDITOR, SYSTEM_ADMIN], modes: [M.INQUIRE], difficulty: 'INTERMEDIATE' }),

  // ------------------------------------------------------------------- REPORTS
  op({ code: 'RPT-BRANCH-001', name: 'Branch Operations Report', module: MODULES.REPORTS, phase: 8,
    keywords: ['report', 'branch', 'summary', 'operations'],
    allowedRoles: [BRANCH_MANAGER, AUDITOR, SYSTEM_ADMIN], modes: [M.INQUIRE], difficulty: 'INTERMEDIATE' }),

  // ------------------------------------------------------------------ DAY END
  op({ code: 'EOD-PRECHECK-001', name: 'Day-End Pre-check', module: MODULES.DAY_END, phase: 9,
    keywords: ['day end', 'eod', 'precheck', 'pending'],
    allowedRoles: [BRANCH_MANAGER], modes: [M.VERIFY, M.INQUIRE], difficulty: 'ADVANCED' }),
  op({ code: 'EOD-TELLER-001', name: 'Teller Closure Validation', module: MODULES.DAY_END, phase: 9,
    keywords: ['day end', 'teller', 'closure', 'validation'],
    allowedRoles: [BRANCH_MANAGER, TELLER_AUTHORISER], modes: [M.VERIFY, M.INQUIRE], difficulty: 'INTERMEDIATE' }),
  op({ code: 'EOD-BATCH-001', name: 'Batch Processing', module: MODULES.DAY_END, phase: 9,
    keywords: ['day end', 'batch', 'process', 'events', 'si', 'emi', 'maturity'],
    allowedRoles: [BRANCH_MANAGER], modes: [M.MODIFY, M.INQUIRE], difficulty: 'ADVANCED' }),
  op({ code: 'EOD-CLOSE-001', name: 'Close Business Date', module: MODULES.DAY_END, phase: 9,
    keywords: ['day end', 'close', 'business date', 'eod'],
    allowedRoles: [BRANCH_MANAGER], modes: [M.CLOSE, M.INQUIRE], difficulty: 'ADVANCED' }),
  op({ code: 'EOD-REPORT-001', name: 'Day-End Report', module: MODULES.DAY_END, phase: 9,
    keywords: ['day end', 'report', 'eod', 'summary'],
    allowedRoles: [BRANCH_MANAGER, AUDITOR], modes: [M.INQUIRE], difficulty: 'INTERMEDIATE' }),

  // ------------------------------------------------------------- ADMINISTRATION
  op({ code: 'ADMIN-USERS-001', name: 'Demo User Management', module: MODULES.ADMINISTRATION, phase: 1,
    keywords: ['admin', 'users', 'demo users', 'roles', 'employees'],
    allowedRoles: ADMIN_ONLY, modes: [M.INQUIRE, M.MODIFY], difficulty: 'BEGINNER' }),
  op({ code: 'ADMIN-PARAMS-001', name: 'Parameter Management', module: MODULES.ADMINISTRATION, phase: 8,
    keywords: ['admin', 'parameters', 'bank', 'branch', 'product', 'limits'],
    allowedRoles: ADMIN_ONLY, modes: [M.MODIFY, M.INQUIRE], difficulty: 'ADVANCED' }),
  op({ code: 'ADMIN-RESET-001', name: 'Reset Training Data', module: MODULES.ADMINISTRATION, phase: 1,
    keywords: ['admin', 'reset', 'seed', 'demo data', 'restore'],
    allowedRoles: ADMIN_ONLY, modes: [M.MODIFY], difficulty: 'BEGINNER' }),
]);

/** Index by code for O(1) lookup. */
export const OPERATIONS_BY_CODE = Object.freeze(
  Object.fromEntries(OPERATIONS.map((o) => [o.code, o])),
);

export function getOperation(code) {
  return OPERATIONS_BY_CODE[code] ?? null;
}

export function operationsForModule(moduleKey) {
  return OPERATIONS.filter((o) => o.module === moduleKey);
}

export function operationsForRole(role) {
  return OPERATIONS.filter((o) => o.allowedRoles.includes(role));
}
