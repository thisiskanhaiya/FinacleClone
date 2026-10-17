/**
 * Operations Academy - per-operation concept content.
 *
 * Every simulator operation has a concept page with ten sections:
 *   1 Business Concept   2 Real Branch Scenario   3 Roles Involved
 *   4 End-to-End Flow    5 Accounting Flow        6 Records Created
 *   7 Status Changes     8 Exception Scenarios    9 Recovery
 *  10 Simulator Practice (login, data, expected result, verification)
 *
 * Content explains banking, never screens. All referenced data is the
 * fictional seed dataset of the simulator.
 */

const VERIFY = Object.freeze({
  ACCOUNT: 'Account Inquiry (ACCT-INQUIRY-001)',
  CUSTOMER: 'Customer 360 Inquiry (CIF-INQUIRY-001)',
  TRANSACTION: 'Transaction Inquiry (TXN-INQUIRY-001)',
  JOURNAL: 'Journal Inquiry (GL-JOURNAL-INQUIRY-001)',
  AUDIT: 'Audit Inquiry (ENQ-AUDIT-001)',
  AUTHORISATION: 'Authorisation Inquiry (AUT-INQUIRY-001)',
  TELLER_CASH: 'Teller Cash Inquiry (TEL-CASH-POSITION-001)',
  TD: 'Fixed Deposit Inquiry (TD-INQUIRY-001)',
  EMI: 'EMI Schedule Inquiry (LOAN-EMI-INQUIRY-001)',
  INTEGRATION: 'Integration Console (INT-CONSOLE-001)',
});

const MC_FLOW = Object.freeze([
  { actor: 'Customer', action: 'Requests the service at the branch counter and provides details/documents.' },
  { actor: 'Maker', action: 'Verifies eligibility, enters the request and submits it; nothing changes yet.' },
  { actor: 'Authoriser', action: 'Independently compares the request against source documents and approves, rejects or returns it.' },
  { actor: 'System', action: 'On approval, applies the change, posts journals if financial, and writes audit events.' },
]);

function concept(entry) {
  return Object.freeze({
    accounting: null,
    recordsCreated: [],
    exceptions: [],
    recovery: 'Raise the issue with the branch manager; if a financial transaction was wrongly posted, correct it only through a controlled reversal — never by editing.',
    ...entry,
  });
}

export const OPERATION_CONCEPTS = Object.freeze({

  // ================================================== 1. CUSTOMER & CIF
  'CIF-CREATE-001': concept({
    academyModule: 'customer-cif',
    concept: 'Creating a retail CIF registers a new individual as a customer of the bank. The CIF is the single identity anchor to which all future accounts, deposits and loans will link.',
    branchScenario: 'A walk-in customer wants to open a relationship with the bank. The officer collects identity and address proof, captures the CIF, and a second officer verifies the documents before the customer becomes active.',
    roles: [
      { actor: 'Customer', responsibility: 'Provides KYC documents and personal details.' },
      { actor: 'Customer Service Maker', responsibility: 'Captures the CIF accurately and submits.' },
      { actor: 'Operations Checker', responsibility: 'Verifies documents against the entry and approves.' },
    ],
    flow: MC_FLOW,
    recordsCreated: ['Customer (CIF) record', 'Authorisation request', 'Audit events (create + approve)'],
    statusChanges: ['DRAFT → PENDING_AUTHORISATION → APPROVED → ACTIVE'],
    exceptions: [
      { error: 'Duplicate CIF warning', cause: 'Same identity details already exist.', correction: 'Search first with Customer 360 Inquiry; use the existing CIF instead of creating a new one.' },
      { error: 'KYC incomplete', cause: 'Mandatory identity/address proof missing.', correction: 'Collect the document and update KYC before activation.' },
    ],
    recovery: 'If entered wrongly, the checker returns it for correction; the maker fixes and resubmits. No financial impact exists at this stage.',
    practice: {
      login: 'maker01 (Maker@123), then checker01 (Checker@123)',
      role: 'Customer Service Maker → Operations Checker',
      customer: 'New fictional customer, e.g. Riya Kapoor',
      cif: 'Generated on approval',
      account: '-', balance: '-', amount: '-',
      expectedResult: 'CIF created as PENDING_AUTHORISATION; ACTIVE after checker approval.',
      verify: [VERIFY.CUSTOMER, VERIFY.AUDIT],
    },
  }),

  'CIF-CORP-001': concept({
    academyModule: 'customer-cif',
    concept: 'A corporate CIF registers a business entity. It captures the entity identity plus authorised signatories, and unlocks business products such as current accounts.',
    branchScenario: 'A proprietorship or company wants to bank here. Documentation is heavier: registration proof, entity PAN-equivalent, signatory list. Verification is stricter because the entity itself never walks in.',
    roles: [
      { actor: 'Customer (business)', responsibility: 'Provides entity documents and signatory mandate.' },
      { actor: 'Customer Service Maker', responsibility: 'Captures entity CIF and signatories.' },
      { actor: 'Operations Checker', responsibility: 'Verifies entity documents and approves.' },
    ],
    flow: MC_FLOW,
    recordsCreated: ['Corporate CIF record', 'Signatory records', 'Authorisation request', 'Audit events'],
    statusChanges: ['DRAFT → PENDING_AUTHORISATION → APPROVED → ACTIVE'],
    exceptions: [
      { error: 'Signatory mandate missing', cause: 'No authorised signatory recorded for the entity.', correction: 'Capture signatories before submission; otherwise the checker must return the request.' },
    ],
    practice: {
      login: 'maker01 (Maker@123), then checker01 (Checker@123)',
      role: 'Customer Service Maker → Operations Checker',
      customer: 'New fictional entity, e.g. Sample Foods LLP',
      cif: 'Generated on approval',
      account: '-', balance: '-', amount: '-',
      expectedResult: 'Corporate CIF active after approval; compare with existing corporate CIF000006 (Demo Traders Private Limited).',
      verify: [VERIFY.CUSTOMER, VERIFY.AUDIT],
    },
  }),

  'CIF-MODIFY-001': concept({
    academyModule: 'customer-cif',
    concept: 'Customer data changes over time. Modifications go through maker-checker with before/after values preserved, so the bank can always show what changed, who changed it and who approved it.',
    branchScenario: 'A customer reports a changed phone number. The maker edits it; the checker compares the request with the customer\'s written instruction and approves.',
    roles: [
      { actor: 'Customer', responsibility: 'Requests the change with supporting instruction.' },
      { actor: 'Customer Service Maker', responsibility: 'Edits and submits the change.' },
      { actor: 'Operations Checker', responsibility: 'Reviews before/after values and approves or returns.' },
    ],
    flow: MC_FLOW,
    recordsCreated: ['Modification request with before/after values', 'Audit events'],
    statusChanges: ['DRAFT → PENDING_AUTHORISATION → APPROVED (values applied)'],
    exceptions: [
      { error: 'Customer not active', cause: 'CIF is pending or closed.', correction: 'Only active CIFs can be modified; activate first.' },
    ],
    practice: {
      login: 'maker01 (Maker@123), then checker01 (Checker@123)',
      role: 'Customer Service Maker → Operations Checker',
      customer: 'Neha Verma', cif: 'CIF000002', account: '-', balance: '-', amount: '-',
      expectedResult: 'Updated detail visible after approval; before/after captured in the request.',
      verify: [VERIFY.CUSTOMER, VERIFY.AUTHORISATION, VERIFY.AUDIT],
    },
  }),

  'CIF-INQUIRY-001': concept({
    academyModule: 'customer-cif',
    concept: 'Customer 360 is the read-only consolidated view of a customer: identity, KYC, risk, accounts, deposits, loans and recent activity. It changes nothing and needs no authorisation.',
    branchScenario: 'Before serving a customer at the counter, the officer opens Customer 360 to confirm identity, see relationships and spot restrictions such as freezes or expired KYC.',
    roles: [
      { actor: 'Any bank employee', responsibility: 'Views the consolidated record.' },
      { actor: 'Auditor', responsibility: 'Uses the same view for review — read-only.' },
    ],
    flow: [{ actor: 'Employee', action: 'Searches by CIF, account or name and reviews the consolidated view.' }],
    recordsCreated: ['None (inquiry only; the view itself may be audit-logged)'],
    statusChanges: ['None'],
    exceptions: [
      { error: 'No customer found', cause: 'Wrong CIF or the CIF is not yet approved.', correction: 'Check the number; pending CIFs are visible but flagged.' },
    ],
    recovery: 'Not applicable — inquiry never changes data.',
    practice: {
      login: 'any demo user, e.g. maker01 (Maker@123)',
      role: 'Any role', customer: 'Amit Sharma', cif: 'CIF000001',
      account: 'SB000001', balance: '₹1,00,000.00', amount: '-',
      expectedResult: 'Full relationship view: savings accounts, FD000001, loan LN000001.',
      verify: ['Cross-check balances against Account Inquiry'],
    },
  }),

  'CIF-KYC-001': concept({
    academyModule: 'customer-cif',
    concept: 'KYC refresh keeps identity evidence current. Expired KYC restricts the customer until renewed — a regulatory control, not a courtesy.',
    branchScenario: 'A long-standing customer\'s KYC has expired; transactions are being questioned. The maker uploads fresh proof, the checker validates and KYC returns to COMPLETE.',
    roles: [
      { actor: 'Customer', responsibility: 'Provides fresh identity/address proof.' },
      { actor: 'Customer Service Maker', responsibility: 'Submits the KYC update.' },
      { actor: 'Operations Checker', responsibility: 'Verifies documents and approves.' },
    ],
    flow: MC_FLOW,
    recordsCreated: ['KYC update request', 'Updated KYC status on CIF', 'Audit events'],
    statusChanges: ['KYC: EXPIRED → COMPLETE (after approval)'],
    exceptions: [
      { error: 'Document expired', cause: 'Proof itself is out of date.', correction: 'Obtain a valid document and resubmit.' },
    ],
    practice: {
      login: 'maker01 (Maker@123), then checker01 (Checker@123)',
      role: 'Customer Service Maker → Operations Checker',
      customer: 'Sunita Rao', cif: 'CIF000005', account: 'SB000004', balance: '₹7,500.00', amount: '-',
      expectedResult: 'KYC status moves EXPIRED → COMPLETE after approval.',
      verify: [VERIFY.CUSTOMER, VERIFY.AUDIT],
    },
  }),

  'CIF-NOMINEE-001': concept({
    academyModule: 'customer-cif',
    concept: 'Nomination records who receives the customer\'s funds on death. It is master data with legal effect, so it follows maker-checker like any other controlled change.',
    branchScenario: 'A customer adds their spouse as nominee on the relationship. The maker captures nominee details; the checker verifies the signed nomination form.',
    roles: [
      { actor: 'Customer', responsibility: 'Signs the nomination form.' },
      { actor: 'Customer Service Maker', responsibility: 'Captures nominee details.' },
      { actor: 'Operations Checker', responsibility: 'Verifies and approves.' },
    ],
    flow: MC_FLOW,
    recordsCreated: ['Nominee record', 'Authorisation request', 'Audit events'],
    statusChanges: ['No nominee → Nominee registered (after approval)'],
    exceptions: [
      { error: 'Nominee details incomplete', cause: 'Mandatory fields (name, relationship, date of birth for minors) missing.', correction: 'Complete the form and resubmit.' },
    ],
    practice: {
      login: 'maker01 (Maker@123), then checker01 (Checker@123)',
      role: 'Customer Service Maker → Operations Checker',
      customer: 'Neha Verma', cif: 'CIF000002', account: '-', balance: '-', amount: '-',
      expectedResult: 'Nominee visible on the customer record after approval.',
      verify: [VERIFY.CUSTOMER, VERIFY.AUDIT],
    },
  }),

  'CIF-ADDRESS-001': concept({
    academyModule: 'customer-cif',
    concept: 'Address change is master-data maintenance with proof. Communications, statements and statutory notices depend on it.',
    branchScenario: 'A customer shifted residence and submits a new address proof. Maker enters, checker validates the proof, system applies.',
    roles: [
      { actor: 'Customer', responsibility: 'Provides new address proof.' },
      { actor: 'Customer Service Maker', responsibility: 'Enters new address.' },
      { actor: 'Operations Checker', responsibility: 'Validates proof and approves.' },
    ],
    flow: MC_FLOW,
    recordsCreated: ['Address change request (before/after)', 'Audit events'],
    statusChanges: ['Old address → new address after approval'],
    exceptions: [
      { error: 'Proof mismatch', cause: 'Address on proof differs from entry.', correction: 'Return for correction; maker re-enters exactly as per proof.' },
    ],
    practice: {
      login: 'maker01 (Maker@123), then checker01 (Checker@123)',
      role: 'Customer Service Maker → Operations Checker',
      customer: 'Raj Malhotra', cif: 'CIF000003', account: '-', balance: '-', amount: '-',
      expectedResult: 'New address on CIF after approval.',
      verify: [VERIFY.CUSTOMER, VERIFY.AUDIT],
    },
  }),

  'CIF-RISK-001': concept({
    academyModule: 'customer-cif',
    concept: 'Risk classification drives monitoring intensity and approval levels. Raising a customer\'s risk is a senior, fully-audited decision — deliberately not available to entry-level makers.',
    branchScenario: 'Unusual transaction patterns lead the branch to move a customer from MEDIUM to HIGH risk, triggering tighter review on future requests.',
    roles: [
      { actor: 'Operations Checker', responsibility: 'Proposes the risk change with justification.' },
      { actor: 'Branch Manager', responsibility: 'Approves the reclassification.' },
    ],
    flow: MC_FLOW,
    recordsCreated: ['Risk change request with justification', 'Audit events'],
    statusChanges: ['Risk: MEDIUM → HIGH (after approval)'],
    exceptions: [
      { error: 'Justification missing', cause: 'Risk change without documented reason.', correction: 'Provide justification; the request is otherwise returned.' },
    ],
    practice: {
      login: 'checker01 (Checker@123), then manager01 (Manager@123)',
      role: 'Operations Checker → Branch Manager',
      customer: 'Raj Malhotra', cif: 'CIF000003', account: '-', balance: '-', amount: '-',
      expectedResult: 'Risk category updated after manager approval.',
      verify: [VERIFY.CUSTOMER, VERIFY.AUDIT],
    },
  }),

  // ===================================================== 2. ACCOUNTS
  'ACCT-SAV-OPEN-001': concept({
    academyModule: 'accounts',
    concept: 'Opening a savings account creates a deposit liability of the bank linked to an approved CIF, under a product whose rules (minimum balance, limits, interest) govern the account automatically.',
    branchScenario: 'An existing customer wants a savings account. The maker selects the product and funding details; the checker approves; the account becomes active and can receive its first deposit.',
    roles: [
      { actor: 'Customer', responsibility: 'Requests the account and provides initial funding.' },
      { actor: 'Customer Service Maker', responsibility: 'Opens the account request.' },
      { actor: 'Operations Checker', responsibility: 'Approves the opening.' },
    ],
    flow: MC_FLOW,
    recordsCreated: ['Account record', 'Authorisation request', 'Audit events', 'Receipt/acknowledgement'],
    statusChanges: ['DRAFT → PENDING_AUTHORISATION → APPROVED → ACTIVE'],
    exceptions: [
      { error: 'CIF not active', cause: 'Customer record pending or restricted.', correction: 'Approve the CIF first, then open the account.' },
      { error: 'Below minimum opening amount', cause: 'Product SAV-REG requires ₹1,000.00 minimum.', correction: 'Collect the minimum and retry.' },
    ],
    practice: {
      login: 'maker01 (Maker@123), then checker01 (Checker@123)',
      role: 'Customer Service Maker → Operations Checker',
      customer: 'Neha Verma', cif: 'CIF000002', account: 'New SB number generated',
      balance: '-', amount: 'Opening ₹1,000.00+ (product minimum)',
      expectedResult: 'New ACTIVE savings account under CIF000002.',
      verify: [VERIFY.ACCOUNT, VERIFY.CUSTOMER, VERIFY.AUDIT],
    },
  }),

  'ACCT-CUR-OPEN-001': concept({
    academyModule: 'accounts',
    concept: 'A current account is a business transaction account: no interest, higher minimums, high transaction capacity. Only corporate CIFs qualify.',
    branchScenario: 'Demo Traders Private Limited (CIF000006) wants a second current account for collections. Maker opens, checker approves.',
    roles: [
      { actor: 'Customer (business)', responsibility: 'Board/partner resolution and funding.' },
      { actor: 'Customer Service Maker', responsibility: 'Opens the account request.' },
      { actor: 'Operations Checker', responsibility: 'Approves.' },
    ],
    flow: MC_FLOW,
    recordsCreated: ['Current account record', 'Authorisation request', 'Audit events'],
    statusChanges: ['DRAFT → PENDING_AUTHORISATION → APPROVED → ACTIVE'],
    exceptions: [
      { error: 'Ineligible customer type', cause: 'Retail CIF selected for a current product.', correction: 'Use a corporate CIF.' },
      { error: 'Below minimum opening amount', cause: 'CUR-STD requires ₹10,000.00.', correction: 'Fund adequately and retry.' },
    ],
    practice: {
      login: 'maker01 (Maker@123), then checker01 (Checker@123)',
      role: 'Customer Service Maker → Operations Checker',
      customer: 'Demo Traders Private Limited', cif: 'CIF000006', account: 'New CA number generated',
      balance: '-', amount: 'Opening ₹10,000.00+',
      expectedResult: 'New ACTIVE current account under CIF000006.',
      verify: [VERIFY.ACCOUNT, VERIFY.CUSTOMER],
    },
  }),

  'ACCT-INQUIRY-001': concept({
    academyModule: 'accounts',
    concept: 'Account Inquiry is the read-only balance and status view: ledger balance, available balance, lien, freeze status and recent postings. It is the most-used screen in a branch.',
    branchScenario: 'A customer asks their balance; the teller opens the account and reads ledger vs available, explaining the lien difference if any.',
    roles: [{ actor: 'Any employee', responsibility: 'Views balances and status (read-only).' }],
    flow: [{ actor: 'Employee', action: 'Searches the account number and reviews ledger balance, available balance, holds and status.' }],
    recordsCreated: ['None (inquiry only)'],
    statusChanges: ['None'],
    exceptions: [
      { error: 'Ledger and available differ', cause: 'A lien or hold earmarks part of the balance (e.g. SB000007: ₹80,000 ledger, ₹60,000 available).', correction: 'Not an error — check the lien amount field.' },
    ],
    recovery: 'Not applicable — inquiry never changes data.',
    practice: {
      login: 'any demo user, e.g. teller01 (Teller@123)',
      role: 'Any role', customer: 'Amit Sharma', cif: 'CIF000001',
      account: 'SB000001', balance: '₹1,00,000.00', amount: '-',
      expectedResult: 'Ledger = available = ₹1,00,000.00, status ACTIVE.',
      verify: ['Compare SB000007 to see a lien example'],
    },
  }),

  'ACCT-CLOSE-001': concept({
    academyModule: 'accounts',
    concept: 'Closure ends the account relationship: the remaining balance is paid out and the account stops accepting postings. Closure is financial and irreversible, so it is maker-checker controlled.',
    branchScenario: 'A customer closes a little-used account. The maker initiates closure, the checker confirms nil-lien and identity, the system pays out the balance over the counter.',
    roles: [
      { actor: 'Customer', responsibility: 'Requests closure and receives the payout.' },
      { actor: 'Customer Service Maker', responsibility: 'Initiates closure.' },
      { actor: 'Operations Checker', responsibility: 'Confirms preconditions and approves.' },
    ],
    flow: MC_FLOW,
    accounting: { debit: 'Customer deposit liability (TRN-GL-2001)', credit: 'Teller Cash (TRN-GL-1001)', note: 'Balance payout at closure.' },
    recordsCreated: ['Closure request', 'Payout transaction + journal', 'Audit events', 'Closure acknowledgement'],
    statusChanges: ['ACTIVE → PENDING_AUTHORISATION → CLOSED'],
    exceptions: [
      { error: 'Account has a lien', cause: 'Liened funds cannot be paid out.', correction: 'Release the lien first (ACCT-LIEN-RELEASE-001).' },
      { error: 'Linked mandates exist', cause: 'Standing instructions or linked loans reference the account.', correction: 'Cancel mandates before closure.' },
    ],
    practice: {
      login: 'maker01 (Maker@123), then checker01 (Checker@123)',
      role: 'Customer Service Maker → Operations Checker',
      customer: 'Sunita Rao', cif: 'CIF000005', account: 'SB000004', balance: '₹7,500.00', amount: '₹7,500.00 payout',
      expectedResult: 'Account CLOSED, balance zero, balanced payout journal.',
      verify: [VERIFY.ACCOUNT, VERIFY.TRANSACTION, VERIFY.JOURNAL, VERIFY.AUDIT],
    },
  }),

  'ACCT-FREEZE-001': concept({
    academyModule: 'accounts',
    concept: 'A full freeze blocks all money movement on the account — debits and credits. Used for court orders, disputes and suspected fraud. Always a senior, audited action.',
    branchScenario: 'The bank receives a legal order over an account. The checker freezes it; every subsequent transaction attempt is rejected until unfreeze.',
    roles: [
      { actor: 'Operations Checker', responsibility: 'Applies the freeze with documented reason.' },
      { actor: 'Branch Manager', responsibility: 'Authorises the freeze.' },
    ],
    flow: MC_FLOW,
    recordsCreated: ['Freeze request with reason', 'Status change on account', 'Audit events'],
    statusChanges: ['ACTIVE → FROZEN'],
    exceptions: [
      { error: 'Reason missing', cause: 'Freeze without documented authority.', correction: 'Attach the order/reference and resubmit.' },
    ],
    practice: {
      login: 'checker01 (Checker@123), then manager01 (Manager@123)',
      role: 'Operations Checker → Branch Manager',
      customer: 'Sunita Rao', cif: 'CIF000005', account: 'SB000004', balance: '₹7,500.00', amount: '-',
      expectedResult: 'Account FROZEN; a withdrawal attempt on it now fails validation.',
      verify: [VERIFY.ACCOUNT, VERIFY.AUDIT],
    },
  }),

  'ACCT-UNFREEZE-001': concept({
    academyModule: 'accounts',
    concept: 'Unfreezing restores movement after the freeze reason is resolved. It needs the same seniority as freezing, with the release reference recorded.',
    branchScenario: 'The legal hold on an account is vacated; the branch unfreezes it against the release order.',
    roles: [
      { actor: 'Operations Checker', responsibility: 'Requests unfreeze with release reference.' },
      { actor: 'Branch Manager', responsibility: 'Authorises.' },
    ],
    flow: MC_FLOW,
    recordsCreated: ['Unfreeze request', 'Status change', 'Audit events'],
    statusChanges: ['FROZEN → ACTIVE'],
    exceptions: [
      { error: 'Release reference invalid', cause: 'No authority document for unfreeze.', correction: 'Obtain the release order first.' },
    ],
    practice: {
      login: 'checker01 (Checker@123), then manager01 (Manager@123)',
      role: 'Operations Checker → Branch Manager',
      customer: 'Vikram Joshi', cif: 'CIF000007', account: 'SB000006', balance: '₹15,000.00 (currently FROZEN)', amount: '-',
      expectedResult: 'Account returns to ACTIVE with full available balance.',
      verify: [VERIFY.ACCOUNT, VERIFY.AUDIT],
    },
  }),

  'ACCT-DEBIT-FREEZE-001': concept({
    academyModule: 'accounts',
    concept: 'A debit freeze blocks only outgoing money — deposits still arrive, withdrawals and transfers out are rejected. Common for disputed ownership or court attachment.',
    branchScenario: 'A court attachment order arrives: money may come in but must not leave. SB000003 in the training data is already debit-frozen — use it to see how withdrawal attempts fail.',
    roles: [
      { actor: 'Operations Checker', responsibility: 'Applies debit freeze.' },
      { actor: 'Branch Manager', responsibility: 'Authorises.' },
    ],
    flow: MC_FLOW,
    recordsCreated: ['Freeze request', 'Status change', 'Audit events'],
    statusChanges: ['ACTIVE → DEBIT_FROZEN'],
    exceptions: [
      { error: 'Withdrawal rejected', cause: 'Account is DEBIT_FROZEN.', correction: 'Expected behaviour — lift the freeze via the proper authority before debits.' },
    ],
    practice: {
      login: 'checker01 (Checker@123), then manager01 (Manager@123)',
      role: 'Operations Checker → Branch Manager',
      customer: 'Raj Malhotra', cif: 'CIF000003', account: 'SB000003', balance: '₹10,000.00', amount: '-',
      expectedResult: 'SB000003 already DEBIT_FROZEN in seed data: verify that a withdrawal is blocked.',
      verify: [VERIFY.ACCOUNT, VERIFY.AUDIT],
    },
  }),

  'ACCT-CREDIT-FREEZE-001': concept({
    academyModule: 'accounts',
    concept: 'A credit freeze blocks incoming money while allowing debits — rarer, used when credits must be stopped (e.g. investigation of incoming funds).',
    branchScenario: 'During an investigation, the branch blocks further credits to an account while allowing the customer to draw it down.',
    roles: [
      { actor: 'Operations Checker', responsibility: 'Applies credit freeze.' },
      { actor: 'Branch Manager', responsibility: 'Authorises.' },
    ],
    flow: MC_FLOW,
    recordsCreated: ['Freeze request', 'Status change', 'Audit events'],
    statusChanges: ['ACTIVE → CREDIT_FROZEN'],
    exceptions: [
      { error: 'Deposit rejected', cause: 'Account is CREDIT_FROZEN.', correction: 'Expected — remove the freeze with authority before accepting credits.' },
    ],
    practice: {
      login: 'checker01 (Checker@123), then manager01 (Manager@123)',
      role: 'Operations Checker → Branch Manager',
      customer: 'Amit Sharma', cif: 'CIF000001', account: 'SB000007', balance: '₹80,000.00', amount: '-',
      expectedResult: 'Credits to SB000007 blocked while freeze is active.',
      verify: [VERIFY.ACCOUNT, VERIFY.AUDIT],
    },
  }),

  'ACCT-LIEN-001': concept({
    academyModule: 'accounts',
    concept: 'A lien earmarks part of the balance: ledger balance stays, available balance drops. Used to secure loans, guarantees or disputes.',
    branchScenario: 'A customer takes a loan against their savings; the branch marks a lien for the secured amount so it cannot be withdrawn.',
    roles: [
      { actor: 'Operations Checker', responsibility: 'Marks the lien with reason and amount.' },
      { actor: 'Branch Manager', responsibility: 'Authorises.' },
    ],
    flow: MC_FLOW,
    recordsCreated: ['Lien record', 'Available balance update', 'Audit events'],
    statusChanges: ['Available balance reduced by lien amount'],
    exceptions: [
      { error: 'Lien exceeds balance', cause: 'Lien amount larger than ledger balance.', correction: 'Cap the lien at the available balance.' },
    ],
    practice: {
      login: 'checker01 (Checker@123), then manager01 (Manager@123)',
      role: 'Operations Checker → Branch Manager',
      customer: 'Neha Verma', cif: 'CIF000002', account: 'SB000002', balance: '₹50,000.00', amount: 'Lien ₹10,000.00',
      expectedResult: 'Ledger stays ₹50,000.00; available becomes ₹40,000.00.',
      verify: [VERIFY.ACCOUNT, VERIFY.AUDIT],
    },
  }),

  'ACCT-LIEN-RELEASE-001': concept({
    academyModule: 'accounts',
    concept: 'Releasing a lien removes the earmark and restores the available balance once the underlying obligation is over.',
    branchScenario: 'The secured loan is repaid; the branch releases the lien against the closure proof.',
    roles: [
      { actor: 'Operations Checker', responsibility: 'Requests lien release with reference.' },
      { actor: 'Branch Manager', responsibility: 'Authorises.' },
    ],
    flow: MC_FLOW,
    recordsCreated: ['Lien release record', 'Available balance update', 'Audit events'],
    statusChanges: ['Available balance restored by lien amount'],
    exceptions: [
      { error: 'No lien exists', cause: 'Account has no active lien.', correction: 'Verify with Account Inquiry first (SB000007 has a ₹20,000.00 lien in seed data).' },
    ],
    practice: {
      login: 'checker01 (Checker@123), then manager01 (Manager@123)',
      role: 'Operations Checker → Branch Manager',
      customer: 'Amit Sharma', cif: 'CIF000001', account: 'SB000007',
      balance: 'Ledger ₹80,000.00 / available ₹60,000.00', amount: 'Release lien ₹20,000.00',
      expectedResult: 'Available returns to ₹80,000.00, lien zero.',
      verify: [VERIFY.ACCOUNT, VERIFY.AUDIT],
    },
  }),

  'ACCT-DORMANT-001': concept({
    academyModule: 'accounts',
    concept: 'Accounts untouched by the customer for the product\'s dormancy period turn dormant: a fraud shield that restricts operations until the customer revalidates identity.',
    branchScenario: 'During periodic review, long-inactive accounts (like SB000005) are marked dormant; a returning customer must revalidate before normal operations resume.',
    roles: [
      { actor: 'Operations Checker', responsibility: 'Runs/reviews dormancy marking.' },
      { actor: 'Branch Manager', responsibility: 'Authorises reactivation decisions.' },
    ],
    flow: MC_FLOW,
    recordsCreated: ['Dormancy status change', 'Audit events'],
    statusChanges: ['ACTIVE → DORMANT; DORMANT → ACTIVE on revalidation'],
    exceptions: [
      { error: 'Transaction on dormant account', cause: 'Dormant accounts restrict customer transactions.', correction: 'Reactivate after identity revalidation.' },
    ],
    practice: {
      login: 'checker01 (Checker@123)',
      role: 'Operations Checker',
      customer: 'Vikram Joshi', cif: 'CIF000007', account: 'SB000005', balance: '₹3,200.00 (DORMANT)', amount: '-',
      expectedResult: 'Dormancy status visible; reactivation path understood.',
      verify: [VERIFY.ACCOUNT, VERIFY.AUDIT],
    },
  }),

  // ====================================================== 3. TELLER
  'TEL-SESSION-OPEN-001': concept({
    academyModule: 'teller',
    concept: 'A teller session binds a cash position to one teller for the business date. Until it opens, the teller cannot accept or pay cash; until it closes, day end cannot finish.',
    branchScenario: 'The teller arrives, receives the day\'s opening cash, and opens the session; the system now tracks every rupee against their name.',
    roles: [
      { actor: 'Teller', responsibility: 'Opens the session and owns the cash position.' },
      { actor: 'Teller Authoriser', responsibility: 'Reviews the position later at closure.' },
    ],
    flow: [
      { actor: 'Teller', action: 'Opens session with declared opening cash.' },
      { actor: 'System', action: 'Creates the cash position and enables teller transactions.' },
    ],
    recordsCreated: ['Teller session', 'Opening cash position', 'Audit events'],
    statusChanges: ['No session → SESSION OPEN'],
    exceptions: [
      { error: 'Session already open', cause: 'Duplicate open attempt for the same teller and date.', correction: 'Use the existing session; only one open session per teller per day.' },
    ],
    recovery: 'If opened with a wrong opening figure, close the session with authoriser review and reopen correctly.',
    practice: {
      login: 'teller01 (Teller@123)',
      role: 'Teller', customer: '-', cif: '-', account: '-', balance: '-',
      amount: 'Opening cash e.g. ₹1,00,000.00',
      expectedResult: 'Session OPEN; teller transactions unlocked.',
      verify: [VERIFY.TELLER_CASH, VERIFY.AUDIT],
    },
  }),

  'TEL-CASH-DEPOSIT-001': concept({
    academyModule: 'teller',
    concept: 'A cash deposit converts physical cash into a bank liability: the customer\'s balance increases and the teller\'s cash increases by the same amount.',
    branchScenario: 'A customer hands ₹5,000 over the counter. The teller counts, enters the deposit, the authoriser confirms, and the system credits the account. The customer gets a receipt.',
    roles: [
      { actor: 'Customer', responsibility: 'Deposits cash and checks the receipt.' },
      { actor: 'Teller', responsibility: 'Counts cash, enters the deposit.' },
      { actor: 'Teller Authoriser', responsibility: 'Approves the posted entry.' },
    ],
    flow: MC_FLOW,
    accounting: { debit: 'Teller Cash (TRN-GL-1001)', credit: 'Customer deposit liability (TRN-GL-2001/2002)' },
    recordsCreated: ['Transaction + debit/credit legs', 'Balanced journal', 'Balance update', 'Receipt', 'Audit events'],
    statusChanges: ['DRAFT → PENDING_AUTHORISATION → APPROVED → POSTED'],
    exceptions: [
      { error: 'Credit-frozen account', cause: 'Account blocks credits.', correction: 'Inform the customer; the freeze needs authority removal first.' },
      { error: 'Cash miscount', cause: 'Declared amount differs from physical cash.', correction: 'Correct before authorisation; if already posted, only a reversal fixes it.' },
    ],
    practice: {
      login: 'teller01 (Teller@123), then tellerauthoriser01 (TellerAuth@123)',
      role: 'Teller → Teller Authoriser',
      customer: 'Neha Verma', cif: 'CIF000002', account: 'SB000002', balance: '₹50,000.00',
      amount: '₹5,000.00',
      expectedResult: 'SB000002 becomes ₹55,000.00 after approval; teller cash +₹5,000.00.',
      verify: [VERIFY.ACCOUNT, VERIFY.TRANSACTION, VERIFY.JOURNAL, VERIFY.TELLER_CASH, VERIFY.AUDIT],
    },
  }),

  'TEL-CASH-WITHDRAWAL-001': concept({
    academyModule: 'teller',
    concept: 'A cash withdrawal converts bank liability back into cash: the customer\'s balance decreases and the teller\'s cash decreases. The bank pays only after verifying the account exists, is active, has sufficient available balance, and has no debit freeze or blocking lien.',
    branchScenario: 'A customer presents a withdrawal for ₹5,000. The teller verifies the account and balance, enters the withdrawal, the authoriser approves, cash is paid out and a receipt printed.',
    roles: [
      { actor: 'Customer', responsibility: 'Presents the withdrawal instruction and identity.' },
      { actor: 'Teller', responsibility: 'Verifies account/balance, enters the withdrawal, pays cash.' },
      { actor: 'Teller Authoriser', responsibility: 'Approves the debit.' },
    ],
    flow: MC_FLOW,
    accounting: { debit: 'Customer deposit liability (TRN-GL-2001/2002)', credit: 'Teller Cash (TRN-GL-1001)' },
    recordsCreated: ['Transaction + legs', 'Balanced journal', 'Balance update', 'Receipt', 'Audit events'],
    statusChanges: ['DRAFT → PENDING_AUTHORISATION → APPROVED → POSTED'],
    exceptions: [
      { error: 'Insufficient available balance', cause: 'Amount exceeds available (ledger minus lien).', correction: 'Reduce the amount or decline politely.' },
      { error: 'Debit freeze on account', cause: 'Outgoing money blocked (see SB000003).', correction: 'Do not pay; refer to the freeze authority.' },
      { error: 'Dormant account', cause: 'Account inactive beyond dormancy period.', correction: 'Reactivation first, then withdrawal.' },
    ],
    practice: {
      login: 'teller01 (Teller@123), then tellerauthoriser01 (TellerAuth@123)',
      role: 'Teller → Teller Authoriser',
      customer: 'Amit Sharma', cif: 'CIF000001', account: 'SB000001', balance: '₹1,00,000.00',
      amount: '₹5,000.00',
      expectedResult: 'SB000001 becomes ₹95,000.00 after approval; teller cash −₹5,000.00.',
      verify: [VERIFY.ACCOUNT, VERIFY.TRANSACTION, VERIFY.JOURNAL, VERIFY.TELLER_CASH, VERIFY.AUDIT],
    },
  }),

  'TEL-CASH-POSITION-001': concept({
    academyModule: 'teller',
    concept: 'The teller cash position is the running cash figure for the open session: opening cash plus deposits minus withdrawals. The physical drawer must always match it.',
    branchScenario: 'Mid-day, the teller checks the system position and counts the drawer to confirm they match before continuing.',
    roles: [{ actor: 'Teller', responsibility: 'Views own position.' }, { actor: 'Teller Authoriser', responsibility: 'Reviews any teller position.' }],
    flow: [{ actor: 'Teller', action: 'Opens the position inquiry and compares it with the physical drawer.' }],
    recordsCreated: ['None (inquiry only)'],
    statusChanges: ['None'],
    exceptions: [
      { error: 'Position mismatch', cause: 'Miscount or unposted transaction.', correction: 'Recount, review pending transactions; escalate differences to the authoriser immediately.' },
    ],
    recovery: 'Differences are investigated, never adjusted silently.',
    practice: {
      login: 'teller01 (Teller@123)',
      role: 'Teller', customer: '-', cif: '-', account: '-', balance: '-', amount: '-',
      expectedResult: 'Opening cash, deposit total, withdrawal total and expected cash displayed.',
      verify: [VERIFY.AUDIT],
    },
  }),

  'TEL-SESSION-CLOSE-001': concept({
    academyModule: 'teller',
    concept: 'Closing the session declares the day\'s physical cash against the system position. Authoriser approval makes the teller\'s accountability final for that business date.',
    branchScenario: 'At day end the teller counts the drawer, declares the figure, and the authoriser validates it against the system before signing off.',
    roles: [
      { actor: 'Teller', responsibility: 'Counts and declares closing cash.' },
      { actor: 'Teller Authoriser', responsibility: 'Validates and approves closure.' },
    ],
    flow: MC_FLOW,
    recordsCreated: ['Closure request', 'Cash position validation result', 'Audit events'],
    statusChanges: ['SESSION OPEN → CLOSURE PENDING → CLOSED'],
    exceptions: [
      { error: 'Cash over/short', cause: 'Declared cash differs from system position.', correction: 'Investigate immediately; record the difference through the exception process, never force a match.' },
      { error: 'Pending teller transactions', cause: 'Unauthorised entries exist.', correction: 'Authorise or return them before closure.' },
    ],
    practice: {
      login: 'teller01 (Teller@123), then tellerauthoriser01 (TellerAuth@123)',
      role: 'Teller → Teller Authoriser',
      customer: '-', cif: '-', account: '-', balance: 'Session cash position', amount: 'Declared closing cash',
      expectedResult: 'Session CLOSED; day end unblocked for this teller.',
      verify: [VERIFY.TELLER_CASH, VERIFY.AUDIT],
    },
  }),

  // ===================================================== 4. PAYMENTS
  'PAY-INTERNAL-001': concept({
    academyModule: 'payments',
    concept: 'An internal transfer moves value between two accounts of the same bank. The bank\'s total deposits do not change — liability simply shifts from one customer to another.',
    branchScenario: 'Amit Sharma asks to move ₹5,000 to Neha Verma\'s account. The teller enters it; nothing moves until the teller authoriser approves; then both balances update in one atomic posting.',
    roles: [
      { actor: 'Customer', responsibility: 'Instructs the transfer with destination details.' },
      { actor: 'Teller (maker)', responsibility: 'Validates both accounts and submits the transfer.' },
      { actor: 'Teller Authoriser (checker)', responsibility: 'Compares and approves; posting happens now.' },
    ],
    flow: MC_FLOW,
    accounting: { debit: 'Source customer deposit liability (TRN-GL-2001)', credit: 'Destination customer deposit liability (TRN-GL-2001)' },
    recordsCreated: ['Transfer request', 'Authorisation decision', 'Transaction + 2 legs', 'Balanced journal', 'Receipt', 'Maker/checker/posting audit events'],
    statusChanges: ['DRAFT → PENDING_AUTHORISATION → APPROVED → POSTED'],
    exceptions: [
      { error: 'Source and destination identical', cause: 'Same account on both sides.', correction: 'Correct the destination and resubmit.' },
      { error: 'Insufficient available balance', cause: 'Source cannot cover amount (lien reduces availability).', correction: 'Reduce amount or decline.' },
      { error: 'Debit-frozen source / closed destination', cause: 'Account status blocks the movement.', correction: 'Resolve the status first; do not force the transfer.' },
      { error: 'Duplicate submission', cause: 'Same request submitted twice.', correction: 'The workflow blocks it — track the existing request instead.' },
    ],
    recovery: 'If approved wrongly, use Transaction Reversal (TXN-REVERSE-001) — a new linked transaction restores both balances; the original stays immutable.',
    practice: {
      login: 'teller01 (Teller@123), then tellerauthoriser01 (TellerAuth@123)',
      role: 'Teller → Teller Authoriser',
      customer: 'Amit Sharma → Neha Verma', cif: 'CIF000001 → CIF000002',
      account: 'SB000001 → SB000002', balance: '₹1,00,000.00 → ₹50,000.00',
      amount: '₹5,000.00',
      expectedResult: 'SB000001 = ₹95,000.00; SB000002 = ₹55,000.00; status POSTED; balanced journal.',
      verify: [VERIFY.ACCOUNT, VERIFY.TRANSACTION, VERIFY.JOURNAL, VERIFY.AUDIT],
    },
  }),

  'PAY-NEFT-001': concept({
    academyModule: 'payments',
    concept: 'NEFT moves money to another bank through a deferred, batch-settled network. The customer is debited into a settlement/suspense position and the outward message goes to the gateway; batches settle later.',
    branchScenario: 'A customer sends ₹10,000 to a relative at another bank. The teller captures beneficiary details; after approval the debit posts and a mock gateway message is created in the Integration Console.',
    roles: [
      { actor: 'Customer', responsibility: 'Provides beneficiary details.' },
      { actor: 'Teller (maker)', responsibility: 'Captures and submits the outward payment.' },
      { actor: 'Teller Authoriser (checker)', responsibility: 'Approves; debit posts and the message is dispatched (simulated).' },
    ],
    flow: [...MC_FLOW, { actor: 'Mock gateway', action: 'Acknowledges, times out or rejects — visible in the Integration Console.' }],
    accounting: { debit: 'Source deposit liability (TRN-GL-2001)', credit: 'Suspense (TRN-GL-9001)', note: 'Suspense clears when the (mock) gateway settles.' },
    recordsCreated: ['Payment request', 'Transaction + journal', 'Integration message', 'Audit events'],
    statusChanges: ['DRAFT → PENDING_AUTHORISATION → APPROVED → POSTED; message SUCCESS/TIMEOUT/REJECTED'],
    exceptions: [
      { error: 'Gateway timeout', cause: 'Simulated network failure.', correction: 'Retry from the Integration Console; never re-enter blindly (duplicate risk).' },
      { error: 'Beneficiary rejection', cause: 'Simulated invalid beneficiary.', correction: 'Return funds from suspense and inform the customer.' },
    ],
    recovery: 'Failed messages are retried or reversed out of suspense with authorisation.',
    practice: {
      login: 'teller01 (Teller@123), then tellerauthoriser01 (TellerAuth@123)',
      role: 'Teller → Teller Authoriser',
      customer: 'Amit Sharma', cif: 'CIF000001', account: 'SB000001', balance: '₹1,00,000.00',
      amount: '₹10,000.00',
      expectedResult: 'SB000001 = ₹90,000.00; outward message visible in the Integration Console.',
      verify: [VERIFY.ACCOUNT, VERIFY.JOURNAL, VERIFY.INTEGRATION, VERIFY.AUDIT],
    },
  }),

  'PAY-RTGS-001': concept({
    academyModule: 'payments',
    concept: 'RTGS is the high-value, immediately settled payment rail. Amounts are large, so authorisation levels rise — high-value items need branch-manager approval on top of the teller authoriser.',
    branchScenario: 'Demo Traders pays a supplier ₹2,50,000. Above the high-value threshold, the request needs teller-authoriser approval and then branch-manager approval before posting.',
    roles: [
      { actor: 'Customer (business)', responsibility: 'Instructs the high-value payment.' },
      { actor: 'Teller (maker)', responsibility: 'Captures the payment.' },
      { actor: 'Teller Authoriser', responsibility: 'First-level approval.' },
      { actor: 'Branch Manager', responsibility: 'High-value approval.' },
    ],
    flow: [...MC_FLOW, { actor: 'Branch Manager', action: 'Additional approval step when the amount crosses the high-value threshold.' }],
    accounting: { debit: 'Source deposit liability (TRN-GL-2002)', credit: 'Suspense (TRN-GL-9001)' },
    recordsCreated: ['Payment request', 'Two authorisation decisions', 'Transaction + journal', 'Integration message', 'Audit events'],
    statusChanges: ['DRAFT → PENDING_AUTHORISATION → (manager approval) → APPROVED → POSTED'],
    exceptions: [
      { error: 'Below RTGS minimum / above limit', cause: 'Amount outside product/channel limits.', correction: 'Use the correct rail or obtain the required approval level.' },
    ],
    recovery: 'As with NEFT: retry via Integration Console or reverse with authorisation.',
    practice: {
      login: 'teller01 (Teller@123), tellerauthoriser01 (TellerAuth@123), then manager01 (Manager@123)',
      role: 'Teller → Teller Authoriser → Branch Manager',
      customer: 'Demo Traders Private Limited', cif: 'CIF000006', account: 'CA000001', balance: '₹2,50,000.00',
      amount: '₹2,50,000.00',
      expectedResult: 'Two-level approval visible; CA000001 debited only after both approvals.',
      verify: [VERIFY.ACCOUNT, VERIFY.AUTHORISATION, VERIFY.JOURNAL, VERIFY.AUDIT],
    },
  }),

  'PAY-SI-CREATE-001': concept({
    academyModule: 'payments',
    concept: 'A standing instruction is a customer mandate for recurring automatic transfers — rent, SIPs, EMIs. Created once under maker-checker; executed by the system on each due date.',
    branchScenario: 'Amit asks the bank to send ₹2,000 to Neha on the 1st of every month. The teller records the mandate; the authoriser approves it.',
    roles: [
      { actor: 'Customer', responsibility: 'Signs the recurring mandate.' },
      { actor: 'Teller (maker)', responsibility: 'Creates the instruction.' },
      { actor: 'Teller Authoriser (checker)', responsibility: 'Approves the mandate.' },
    ],
    flow: MC_FLOW,
    recordsCreated: ['Standing instruction', 'Authorisation record', 'Audit events'],
    statusChanges: ['DRAFT → PENDING_AUTHORISATION → ACTIVE'],
    exceptions: [
      { error: 'Invalid schedule', cause: 'Start date in the past or impossible frequency.', correction: 'Fix the schedule and resubmit.' },
    ],
    practice: {
      login: 'teller01 (Teller@123), then tellerauthoriser01 (TellerAuth@123)',
      role: 'Teller → Teller Authoriser',
      customer: 'Amit Sharma → Neha Verma', cif: 'CIF000001 → CIF000002',
      account: 'SB000001 → SB000002', balance: '₹1,00,000.00', amount: '₹2,000.00 monthly',
      expectedResult: 'Instruction ACTIVE with next due date; no movement until execution.',
      verify: [VERIFY.ACCOUNT, VERIFY.AUDIT],
    },
  }),

  'PAY-SI-EXECUTE-001': concept({
    academyModule: 'payments',
    concept: 'Execution turns a due standing instruction into a real transfer. It normally runs in the day-end batch, but branch staff can trigger a due execution manually.',
    branchScenario: 'On the 1st, the batch finds the Amit→Neha instruction due and posts the ₹2,000 transfer automatically.',
    roles: [
      { actor: 'System/batch', responsibility: 'Detects due instructions and posts them.' },
      { actor: 'Teller Authoriser', responsibility: 'Reviews failures and retries.' },
    ],
    flow: [
      { actor: 'System', action: 'Finds due instruction, validates balance and posts the transfer atomically.' },
      { actor: 'Authoriser', action: 'Reviews any failure (e.g. insufficient funds) for retry or cancellation.' },
    ],
    accounting: { debit: 'Source deposit liability', credit: 'Destination deposit liability' },
    recordsCreated: ['Execution transaction + journal', 'Next-due-date update', 'Audit events'],
    statusChanges: ['DUE → EXECUTED (or FAILED)'],
    exceptions: [
      { error: 'Insufficient funds at execution', cause: 'Source balance too low on the due date.', correction: 'Execution fails gracefully; retry after funding or cancel the mandate.' },
    ],
    practice: {
      login: 'tellerauthoriser01 (TellerAuth@123)',
      role: 'Teller Authoriser',
      customer: 'Amit Sharma', cif: 'CIF000001', account: 'SB000001', balance: '₹1,00,000.00', amount: '₹2,000.00',
      expectedResult: 'Due instruction posts a normal transfer; next due date advances.',
      verify: [VERIFY.ACCOUNT, VERIFY.TRANSACTION, VERIFY.JOURNAL],
    },
  }),

  'PAY-SI-CANCEL-001': concept({
    academyModule: 'payments',
    concept: 'Cancellation stops a mandate. Future executions end immediately; past executions are history and stay untouched.',
    branchScenario: 'The customer moves out and cancels the rent mandate with a written request.',
    roles: [
      { actor: 'Customer', responsibility: 'Requests cancellation.' },
      { actor: 'Teller (maker)', responsibility: 'Cancels the mandate.' },
      { actor: 'Teller Authoriser (checker)', responsibility: 'Approves cancellation.' },
    ],
    flow: MC_FLOW,
    recordsCreated: ['Cancellation record', 'Audit events'],
    statusChanges: ['ACTIVE → CANCELLED'],
    exceptions: [
      { error: 'Instruction not active', cause: 'Already cancelled or never approved.', correction: 'Verify status before attempting cancellation.' },
    ],
    practice: {
      login: 'teller01 (Teller@123), then tellerauthoriser01 (TellerAuth@123)',
      role: 'Teller → Teller Authoriser',
      customer: 'Amit Sharma', cif: 'CIF000001', account: 'SB000001', balance: '-', amount: '-',
      expectedResult: 'Mandate CANCELLED; no further executions.',
      verify: [VERIFY.AUDIT],
    },
  }),

  // ===================================================== 5. DEPOSITS
  'TD-CREATE-001': concept({
    academyModule: 'deposits',
    concept: 'A fixed deposit locks money for a term at an agreed rate. The customer\'s operative account is debited and a term-deposit liability with a maturity date and maturity value is created.',
    branchScenario: 'Amit places ₹20,000 in a 12-month FD at 6.5%. The deposit maker creates it, the deposit checker approves, the funding account is debited and a receipt is issued.',
    roles: [
      { actor: 'Customer', responsibility: 'Chooses amount, term and payout instructions.' },
      { actor: 'Deposit Maker', responsibility: 'Creates the FD and calculates maturity.' },
      { actor: 'Deposit Checker', responsibility: 'Approves; funding account is debited.' },
    ],
    flow: MC_FLOW,
    accounting: { debit: 'Funding deposit liability (TRN-GL-2001)', credit: 'Term deposit liability (TRN-GL-2003)' },
    recordsCreated: ['FD record with maturity amount', 'Funding debit transaction + journal', 'Deposit receipt', 'Audit events'],
    statusChanges: ['DRAFT → PENDING_AUTHORISATION → APPROVED → ACTIVE'],
    exceptions: [
      { error: 'Below product minimum', cause: 'TD-STD requires ₹10,000.00 minimum.', correction: 'Increase the amount.' },
      { error: 'Insufficient funding balance', cause: 'Available balance too low.', correction: 'Reduce the FD amount or fund the account first.' },
    ],
    practice: {
      login: 'depositmaker01 (Deposit@123), then depositchecker01 (Deposit@123)',
      role: 'Deposit Maker → Deposit Checker',
      customer: 'Amit Sharma', cif: 'CIF000001', account: 'SB000001 (funding)', balance: '₹1,00,000.00',
      amount: '₹20,000.00 for 12 months at 6.5%',
      expectedResult: 'SB000001 = ₹80,000.00; new ACTIVE FD with maturity value ₹21,300.00.',
      verify: [VERIFY.ACCOUNT, VERIFY.TD, VERIFY.JOURNAL, VERIFY.AUDIT],
    },
  }),

  'TD-INQUIRY-001': concept({
    academyModule: 'deposits',
    concept: 'FD inquiry shows the deposit: principal, rate, term, maturity date, maturity value and current status. Read-only.',
    branchScenario: 'A customer asks what their FD is worth at maturity; the officer opens the inquiry and reads the maturity amount.',
    roles: [{ actor: 'Any employee', responsibility: 'Views deposit details.' }],
    flow: [{ actor: 'Employee', action: 'Searches the deposit number or CIF and reviews terms and status.' }],
    recordsCreated: ['None (inquiry only)'],
    statusChanges: ['None'],
    exceptions: [],
    practice: {
      login: 'any demo user', role: 'Any role',
      customer: 'Amit Sharma', cif: 'CIF000001', account: 'FD000001', balance: 'Principal ₹1,00,000.00', amount: '-',
      expectedResult: 'ACTIVE FD maturing 2027-01-15 with maturity value ₹1,06,500.00; FD000002 shows MATURED.',
      verify: ['Cross-check the funding account in Account Inquiry'],
    },
  }),

  'TD-MATURITY-001': concept({
    academyModule: 'deposits',
    concept: 'At maturity the deposit falls due: principal plus interest returns to the customer\'s account. Interest is a bank expense, so the payout is more than the original principal.',
    branchScenario: 'Neha\'s FD000002 has matured. Processing it credits her savings account with ₹53,250 (₹50,000 principal + ₹3,250 interest).',
    roles: [
      { actor: 'Deposit Maker', responsibility: 'Initiates maturity payout.' },
      { actor: 'Deposit Checker', responsibility: 'Approves the payout.' },
    ],
    flow: MC_FLOW,
    accounting: { debit: 'TD liability (TRN-GL-2003) ₹50,000 + Interest expense (TRN-GL-5001) ₹3,250', credit: 'Customer deposit liability (TRN-GL-2001) ₹53,250' },
    recordsCreated: ['Maturity payout transaction + journal', 'FD status update', 'Audit events'],
    statusChanges: ['MATURED → PAID/CLOSED'],
    exceptions: [
      { error: 'Deposit not due', cause: 'Maturity date not reached.', correction: 'Use premature closure instead (with penalty rules).' },
    ],
    practice: {
      login: 'depositmaker01 (Deposit@123), then depositchecker01 (Deposit@123)',
      role: 'Deposit Maker → Deposit Checker',
      customer: 'Neha Verma', cif: 'CIF000002', account: 'FD000002 → credit SB000002', balance: 'SB000002 ₹50,000.00',
      amount: '₹53,250.00 payout',
      expectedResult: 'SB000002 = ₹1,03,250.00; FD000002 closed.',
      verify: [VERIFY.ACCOUNT, VERIFY.TD, VERIFY.JOURNAL, VERIFY.AUDIT],
    },
  }),

  'TD-RENEW-001': concept({
    academyModule: 'deposits',
    concept: 'Renewal rolls matured proceeds into a brand-new deposit at the current rate for a new term, without money passing through the operative account.',
    branchScenario: 'Instead of paying out, Neha renews her matured FD for another 12 months.',
    roles: [
      { actor: 'Deposit Maker', responsibility: 'Creates the renewal.' },
      { actor: 'Deposit Checker', responsibility: 'Approves.' },
    ],
    flow: MC_FLOW,
    accounting: { debit: 'Old TD liability (TRN-GL-2003)', credit: 'New TD liability (TRN-GL-2003)', note: 'Internal roll-over; interest capitalised per instruction.' },
    recordsCreated: ['New FD record', 'Old FD closure', 'Audit events'],
    statusChanges: ['MATURED → RENEWED (new FD ACTIVE)'],
    exceptions: [
      { error: 'Only matured deposits renew', cause: 'Renewal attempted on an active-term FD.', correction: 'Wait for maturity or use premature closure + new FD.' },
    ],
    practice: {
      login: 'depositmaker01 (Deposit@123), then depositchecker01 (Deposit@123)',
      role: 'Deposit Maker → Deposit Checker',
      customer: 'Neha Verma', cif: 'CIF000002', account: 'FD000002 (MATURED)', balance: '₹53,250.00 proceeds', amount: 'Renew full proceeds 12 months',
      expectedResult: 'New ACTIVE FD for ₹53,250.00 at the current rate; old FD closed.',
      verify: [VERIFY.TD, VERIFY.JOURNAL, VERIFY.AUDIT],
    },
  }),

  'TD-PREMATURE-001': concept({
    academyModule: 'deposits',
    concept: 'Breaking an FD early costs the customer: interest is recalculated at a lower rate for the actual period and a penalty may apply. This deliberate friction is why premature closure always needs authorisation.',
    branchScenario: 'Amit needs his FD000001 urgently after 9 months. The checker explains the reduced interest before approving the early payout.',
    roles: [
      { actor: 'Customer', responsibility: 'Accepts the reduced payout terms.' },
      { actor: 'Deposit Maker', responsibility: 'Calculates the premature figure.' },
      { actor: 'Deposit Checker', responsibility: 'Confirms the customer accepts and approves.' },
    ],
    flow: MC_FLOW,
    accounting: { debit: 'TD liability + reduced interest expense', credit: 'Customer deposit liability (net of penalty, if any)' },
    recordsCreated: ['Premature payout transaction + journal', 'FD closure', 'Audit events'],
    statusChanges: ['ACTIVE → CLOSED (premature)'],
    exceptions: [
      { error: 'Penalty disclosure missing', cause: 'Customer not informed of reduced rate.', correction: 'Confirm acceptance before authorisation.' },
    ],
    practice: {
      login: 'depositmaker01 (Deposit@123), then depositchecker01 (Deposit@123)',
      role: 'Deposit Maker → Deposit Checker',
      customer: 'Amit Sharma', cif: 'CIF000001', account: 'FD000001 → credit SB000001', balance: 'Principal ₹1,00,000.00',
      amount: 'Premature payout at reduced rate',
      expectedResult: 'SB000001 credited with principal + reduced interest; FD closed early.',
      verify: [VERIFY.ACCOUNT, VERIFY.TD, VERIFY.JOURNAL, VERIFY.AUDIT],
    },
  }),

  'TD-CLOSE-001': concept({
    academyModule: 'deposits',
    concept: 'Normal closure pays out a matured deposit and ends it. The records remain forever for audit, but the liability disappears from the books.',
    branchScenario: 'A matured FD that was not auto-renewed is formally closed and paid out.',
    roles: [
      { actor: 'Deposit Maker', responsibility: 'Initiates closure.' },
      { actor: 'Deposit Checker', responsibility: 'Approves.' },
    ],
    flow: MC_FLOW,
    accounting: { debit: 'TD liability (+ any unpaid interest expense)', credit: 'Customer deposit liability' },
    recordsCreated: ['Closure transaction + journal', 'FD status update', 'Audit events'],
    statusChanges: ['MATURED → CLOSED'],
    exceptions: [
      { error: 'Deposit has lien', cause: 'FD pledged against a loan.', correction: 'Release the pledge first.' },
    ],
    practice: {
      login: 'depositmaker01 (Deposit@123), then depositchecker01 (Deposit@123)',
      role: 'Deposit Maker → Deposit Checker',
      customer: 'Neha Verma', cif: 'CIF000002', account: 'FD000002', balance: '₹53,250.00 maturity value', amount: 'Full payout',
      expectedResult: 'FD CLOSED; proceeds credited to SB000002.',
      verify: [VERIFY.ACCOUNT, VERIFY.TD, VERIFY.JOURNAL],
    },
  }),

  // ======================================================== 6. LOANS
  'LOAN-APPLY-001': concept({
    academyModule: 'loans',
    concept: 'A loan application is a request for credit: customer, product, amount, purpose. Nothing is owed and nothing posts at this stage — it is data awaiting a decision.',
    branchScenario: 'Neha applies for a ₹3,00,000 personal loan. The loan officer captures the application with income and obligation details.',
    roles: [
      { actor: 'Customer', responsibility: 'Applies and submits income documents.' },
      { actor: 'Loan Officer', responsibility: 'Captures a complete, accurate application.' },
    ],
    flow: [
      { actor: 'Customer', action: 'Submits the application and documents.' },
      { actor: 'Loan Officer', action: 'Captures the application; status DRAFT/SUBMITTED.' },
    ],
    recordsCreated: ['Loan application', 'Audit events'],
    statusChanges: ['DRAFT → SUBMITTED'],
    exceptions: [
      { error: 'Incomplete application', cause: 'Mandatory income/purpose fields missing.', correction: 'Complete and resubmit.' },
    ],
    practice: {
      login: 'loanofficer01 (Loan@123)',
      role: 'Loan Officer',
      customer: 'Neha Verma', cif: 'CIF000002', account: '-', balance: '-', amount: '₹3,00,000.00 requested',
      expectedResult: 'Application created and ready for assessment.',
      verify: [VERIFY.CUSTOMER, VERIFY.AUDIT],
    },
  }),

  'LOAN-ASSESS-001': concept({
    academyModule: 'loans',
    concept: 'Assessment is the officer\'s structured judgement of repayment capacity — income, obligations, history — ending in a recommendation. It creates the evidence for sanction.',
    branchScenario: 'The officer studies Neha\'s salary credits and existing obligations, then records an affordable EMI and a positive recommendation.',
    roles: [{ actor: 'Loan Officer', responsibility: 'Assesses and recommends.' }],
    flow: [{ actor: 'Loan Officer', action: 'Analyses capacity, records assessment and recommendation.' }],
    recordsCreated: ['Assessment record with recommendation', 'Audit events'],
    statusChanges: ['SUBMITTED → ASSESSED'],
    exceptions: [
      { error: 'Assessment incomplete', cause: 'Recommendation or figures missing.', correction: 'Complete the assessment before the file moves to sanction.' },
    ],
    practice: {
      login: 'loanofficer01 (Loan@123)',
      role: 'Loan Officer',
      customer: 'Neha Verma', cif: 'CIF000002', account: '-', balance: '-', amount: '₹3,00,000.00 requested',
      expectedResult: 'Application ASSESSED with a recorded recommendation.',
      verify: [VERIFY.AUDIT],
    },
  }),

  'LOAN-SANCTION-001': concept({
    academyModule: 'loans',
    concept: 'Sanction is the formal credit decision by an empowered manager: amount, rate, term and conditions. The assessing officer can never sanction their own file — separation of duties.',
    branchScenario: 'The loan manager reviews Neha\'s assessed file and sanctions ₹3,00,000 at 11.5% for 36 months.',
    roles: [
      { actor: 'Loan Officer', responsibility: 'Presents the assessed file.' },
      { actor: 'Loan Manager', responsibility: 'Sanctions, rejects or returns the application.' },
    ],
    flow: [
      { actor: 'Loan Officer', action: 'Submits the assessed file.' },
      { actor: 'Loan Manager', action: 'Reviews and sanctions with terms, or rejects/returns with remarks.' },
    ],
    recordsCreated: ['Sanction record with terms', 'Audit events'],
    statusChanges: ['ASSESSED → SANCTIONED (or REJECTED / RETURNED)'],
    exceptions: [
      { error: 'Self-sanction attempt', cause: 'Officer tries to sanction their own file.', correction: 'Blocked by design — a manager must decide.' },
    ],
    practice: {
      login: 'loanmanager01 (Loan@123)',
      role: 'Loan Manager',
      customer: 'Neha Verma', cif: 'CIF000002', account: '-', balance: '-', amount: 'Sanction ₹3,00,000.00 at 11.5% / 36 months',
      expectedResult: 'Application SANCTIONED with recorded terms.',
      verify: [VERIFY.AUTHORISATION, VERIFY.AUDIT],
    },
  }),

  'LOAN-DISBURSE-001': concept({
    academyModule: 'loans',
    concept: 'Disbursement converts a sanction into a real asset: the loan account is created, the customer is credited, and interest starts accruing from that moment.',
    branchScenario: 'After sanction, Neha\'s ₹3,00,000 is disbursed to her savings account; the manager authorises the disbursement before money moves.',
    roles: [
      { actor: 'Loan Officer', responsibility: 'Requests disbursement against the sanction.' },
      { actor: 'Loan Manager', responsibility: 'Authorises the disbursement.' },
    ],
    flow: MC_FLOW,
    accounting: { debit: 'Loan principal asset (TRN-GL-3001)', credit: 'Customer deposit liability (TRN-GL-2001)' },
    recordsCreated: ['Loan account', 'Disbursement transaction + journal', 'EMI schedule', 'Audit events'],
    statusChanges: ['SANCTIONED → DISBURSED (loan ACTIVE)'],
    exceptions: [
      { error: 'Disbursement exceeds sanction', cause: 'Amount larger than sanctioned.', correction: 'Cap at the sanctioned amount or seek a fresh sanction.' },
    ],
    practice: {
      login: 'loanofficer01 (Loan@123), then loanmanager01 (Loan@123)',
      role: 'Loan Officer → Loan Manager',
      customer: 'Neha Verma', cif: 'CIF000002', account: 'New LN account; credit SB000002', balance: 'SB000002 ₹50,000.00',
      amount: '₹3,00,000.00',
      expectedResult: 'SB000002 = ₹3,50,000.00; loan ACTIVE with a generated EMI schedule.',
      verify: [VERIFY.ACCOUNT, VERIFY.EMI, VERIFY.JOURNAL, VERIFY.AUDIT],
    },
  }),

  'LOAN-EMI-INQUIRY-001': concept({
    academyModule: 'loans',
    concept: 'The EMI schedule shows every instalment: due date, principal part, interest part and status. Read-only — the single source for repayment questions.',
    branchScenario: 'Amit asks how much of his EMI is interest; the officer opens the schedule and shows the split for each month.',
    roles: [{ actor: 'Any employee', responsibility: 'Views the schedule.' }],
    flow: [{ actor: 'Employee', action: 'Opens the loan\'s schedule and reviews instalment status.' }],
    recordsCreated: ['None (inquiry only)'],
    statusChanges: ['None'],
    exceptions: [],
    practice: {
      login: 'any demo user', role: 'Any role',
      customer: 'Amit Sharma', cif: 'CIF000001', account: 'LN000001', balance: 'Outstanding ₹4,20,000.00', amount: 'EMI ₹10,996.00',
      expectedResult: 'Schedule with per-instalment principal/interest split; next due 2026-11-05.',
      verify: ['Cross-check LN000002 to see an overdue instalment'],
    },
  }),

  'LOAN-EMI-RECOVER-001': concept({
    academyModule: 'loans',
    concept: 'EMI recovery collects a due instalment from the customer\'s account. The collection splits: interest part becomes bank income, principal part reduces the loan asset.',
    branchScenario: 'Amit\'s ₹10,996 EMI is due; the officer recovers it from SB000001 after authorisation.',
    roles: [
      { actor: 'Loan Officer', responsibility: 'Initiates recovery against the due EMI.' },
      { actor: 'Loan Manager', responsibility: 'Authorises.' },
    ],
    flow: MC_FLOW,
    accounting: { debit: 'Customer deposit liability (TRN-GL-2001) ₹10,996', credit: 'Interest income (TRN-GL-4001) + Loan principal asset (TRN-GL-3001) per split' },
    recordsCreated: ['Recovery transaction + journal', 'EMI marked paid', 'Balance updates', 'Audit events'],
    statusChanges: ['EMI DUE → PAID'],
    exceptions: [
      { error: 'Insufficient funds for EMI', cause: 'Account cannot cover the instalment.', correction: 'Partial handling per product rules; the EMI may go overdue.' },
    ],
    practice: {
      login: 'loanofficer01 (Loan@123), then loanmanager01 (Loan@123)',
      role: 'Loan Officer → Loan Manager',
      customer: 'Amit Sharma', cif: 'CIF000001', account: 'SB000001 → LN000001', balance: '₹1,00,000.00',
      amount: '₹10,996.00',
      expectedResult: 'SB000001 debited; EMI marked PAID; outstanding principal reduced.',
      verify: [VERIFY.ACCOUNT, VERIFY.EMI, VERIFY.JOURNAL, VERIFY.AUDIT],
    },
  }),

  'LOAN-PARTPAY-001': concept({
    academyModule: 'loans',
    concept: 'Part payment is an extra principal payment beyond the EMI. It reduces outstanding principal immediately and usually shortens the schedule or lowers future interest.',
    branchScenario: 'Amit receives a bonus and pays ₹50,000 towards his loan principal.',
    roles: [
      { actor: 'Loan Officer', responsibility: 'Initiates the part payment.' },
      { actor: 'Loan Manager', responsibility: 'Authorises.' },
    ],
    flow: MC_FLOW,
    accounting: { debit: 'Customer deposit liability (TRN-GL-2001)', credit: 'Loan principal asset (TRN-GL-3001)' },
    recordsCreated: ['Part payment transaction + journal', 'Recalculated schedule', 'Audit events'],
    statusChanges: ['Outstanding principal reduced; schedule recalculated'],
    exceptions: [
      { error: 'Part pay below product minimum', cause: 'Amount under the allowed threshold.', correction: 'Meet the minimum or book it as a normal EMI.' },
    ],
    practice: {
      login: 'loanofficer01 (Loan@123), then loanmanager01 (Loan@123)',
      role: 'Loan Officer → Loan Manager',
      customer: 'Amit Sharma', cif: 'CIF000001', account: 'SB000001 → LN000001', balance: '₹1,00,000.00', amount: '₹50,000.00',
      expectedResult: 'Outstanding principal ₹4,20,000 → ₹3,70,000; schedule recalculated.',
      verify: [VERIFY.EMI, VERIFY.JOURNAL, VERIFY.AUDIT],
    },
  }),

  'LOAN-PRECLOSE-001': concept({
    academyModule: 'loans',
    concept: 'Foreclosure is early full repayment: principal outstanding plus interest to date plus any foreclosure charge, recalculated to the day. The loan then closes.',
    branchScenario: 'Vikram wants to settle his entire loan early; the bank computes the foreclosure figure and collects it.',
    roles: [
      { actor: 'Loan Officer', responsibility: 'Computes and requests foreclosure.' },
      { actor: 'Loan Manager', responsibility: 'Authorises.' },
    ],
    flow: MC_FLOW,
    accounting: { debit: 'Customer deposit liability', credit: 'Loan principal asset + interest income (+ charges income if applicable)' },
    recordsCreated: ['Foreclosure transaction + journal', 'Loan closure', 'Audit events'],
    statusChanges: ['ACTIVE → FORECLOSED/CLOSED'],
    exceptions: [
      { error: 'Overdue instalments exist', cause: 'Foreclosure figure must include overdue amounts first.', correction: 'Recover overdue EMIs, then foreclose.' },
    ],
    practice: {
      login: 'loanofficer01 (Loan@123), then loanmanager01 (Loan@123)',
      role: 'Loan Officer → Loan Manager',
      customer: 'Vikram Joshi', cif: 'CIF000007', account: 'LN000002', balance: 'Outstanding ₹1,80,000.00 + overdue ₹6,595.00', amount: 'Full foreclosure figure',
      expectedResult: 'Loan fully settled and CLOSED.',
      verify: [VERIFY.EMI, VERIFY.JOURNAL, VERIFY.AUDIT],
    },
  }),

  'LOAN-OVERDUE-001': concept({
    academyModule: 'loans',
    concept: 'When a due date passes unpaid, the instalment becomes overdue: the loan is flagged, penal interest may accrue and follow-up begins. Overdues are monitored daily.',
    branchScenario: 'LN000002 shows an overdue EMI of ₹6,595. The officer reviews it, contacts the customer and tracks recovery.',
    roles: [
      { actor: 'Loan Officer', responsibility: 'Reviews and follows up overdues.' },
      { actor: 'Loan Manager', responsibility: 'Monitors the overdue book.' },
    ],
    flow: [{ actor: 'System', action: 'Marks due unpaid instalments overdue during batch.' }, { actor: 'Loan Officer', action: 'Follows up and records action.' }],
    recordsCreated: ['Overdue marking', 'Follow-up record', 'Audit events'],
    statusChanges: ['EMI DUE → OVERDUE → PAID (on recovery)'],
    exceptions: [
      { error: 'Penal interest dispute', cause: 'Customer contests the penal amount.', correction: 'Review the accrual; corrections go through authorised adjustment only.' },
    ],
    practice: {
      login: 'loanofficer01 (Loan@123)',
      role: 'Loan Officer',
      customer: 'Vikram Joshi', cif: 'CIF000007', account: 'LN000002', balance: 'Outstanding ₹1,80,000.00', amount: 'Overdue ₹6,595.00',
      expectedResult: 'Overdue instalment visible with ageing; recovery path clear.',
      verify: [VERIFY.EMI, VERIFY.AUDIT],
    },
  }),

  'LOAN-CLOSE-001': concept({
    academyModule: 'loans',
    concept: 'Closure confirms the loan is fully repaid — principal, interest, charges — and ends the contract. A no-dues confirmation is issued.',
    branchScenario: 'After the final EMI, the manager verifies zero outstanding and closes Amit\'s loan.',
    roles: [
      { actor: 'Loan Officer', responsibility: 'Confirms nil dues and requests closure.' },
      { actor: 'Loan Manager', responsibility: 'Authorises closure.' },
    ],
    flow: MC_FLOW,
    accounting: { debit: 'Customer deposit liability (any residual dues)', credit: 'Loan principal asset + interest income (TRN-GL-3001/4001)', note: 'If dues are nil, closure itself is a pure status change and posts nothing.' },
    recordsCreated: ['Closure record', 'No-dues acknowledgement', 'Audit events'],
    statusChanges: ['ACTIVE → CLOSED'],
    exceptions: [
      { error: 'Residual balance exists', cause: 'Small interest/charge residue.', correction: 'Recover or waive per policy before closure.' },
    ],
    practice: {
      login: 'loanofficer01 (Loan@123), then loanmanager01 (Loan@123)',
      role: 'Loan Officer → Loan Manager',
      customer: 'Amit Sharma', cif: 'CIF000001', account: 'LN000001', balance: 'Nil after full repayment', amount: '-',
      expectedResult: 'Loan CLOSED with no-dues confirmation.',
      verify: [VERIFY.EMI, VERIFY.AUDIT],
    },
  }),

  // ======================================= 7. CONTROL & AUTHORISATION
  'AUT-QUEUE-001': concept({
    academyModule: 'control',
    concept: 'The authorisation queue is where maker-checker lives: every submitted request waits here for a checker of the right role. The maker can never see their own request as decidable.',
    branchScenario: 'The teller authoriser starts the day by opening the queue: pending deposits, withdrawals and transfers wait for comparison against source documents.',
    roles: [
      { actor: 'Maker', responsibility: 'Submits requests; waits.' },
      { actor: 'Checker', responsibility: 'Compares and decides: approve / reject (remarks) / return (remarks).' },
      { actor: 'Branch Manager', responsibility: 'Decides high-value items after the first-level checker.' },
    ],
    flow: [
      { actor: 'Maker', action: 'Submits; request becomes PENDING_AUTHORISATION.' },
      { actor: 'Checker', action: 'Opens the item, verifies maker, data and validation results, then decides with remarks where required.' },
      { actor: 'System', action: 'Applies the decision and audits maker, checker, timestamps and before/after values.' },
    ],
    recordsCreated: ['Authorisation decision', 'Audit events'],
    statusChanges: ['PENDING_AUTHORISATION → APPROVED / REJECTED / RETURNED_FOR_CORRECTION'],
    exceptions: [
      { error: 'Maker cannot authorise own request', cause: 'Same user submitted and tries to approve.', correction: 'A different, authorised user must decide — by design.' },
      { error: 'Remarks missing', cause: 'Reject/return attempted without remarks.', correction: 'Remarks are mandatory for negative decisions.' },
    ],
    recovery: 'Returned items go back to the maker for correction and resubmission; rejected items end and must be recreated if still needed.',
    practice: {
      login: 'tellerauthoriser01 (TellerAuth@123)',
      role: 'Teller Authoriser',
      customer: '-', cif: '-', account: '-', balance: '-', amount: '-',
      expectedResult: 'Queue shows seeded pending items (a cash deposit and an internal transfer from teller01).',
      verify: [VERIFY.AUTHORISATION, VERIFY.AUDIT],
    },
  }),

  'AUT-INQUIRY-001': concept({
    academyModule: 'control',
    concept: 'Authorisation inquiry answers "who approved this, when, with what remarks?" — the historical, read-only view of every decision.',
    branchScenario: 'A customer disputes a transfer; the manager traces who made and who approved the request and on what basis.',
    roles: [{ actor: 'Any employee / Auditor', responsibility: 'Views decision history.' }],
    flow: [{ actor: 'Employee', action: 'Searches by request, maker or date and reviews the decision trail.' }],
    recordsCreated: ['None (inquiry only)'],
    statusChanges: ['None'],
    exceptions: [],
    practice: {
      login: 'auditor01 (Audit@123)',
      role: 'Auditor',
      customer: '-', cif: '-', account: '-', balance: '-', amount: '-',
      expectedResult: 'Decision history with maker, checker, timestamps and remarks.',
      verify: [VERIFY.AUDIT],
    },
  }),

  'TXN-INQUIRY-001': concept({
    academyModule: 'control',
    concept: 'Transaction inquiry traces one transaction\'s whole lifecycle: draft, submission, authorisation, posting, reversal if any — with legs and journal references.',
    branchScenario: 'A customer claims a double debit; the officer opens the transaction and proves (or disproves) it with its lifecycle and linked journal.',
    roles: [{ actor: 'Any employee / Auditor', responsibility: 'Traces transactions.' }],
    flow: [{ actor: 'Employee', action: 'Searches by reference/account and reviews status history.' }],
    recordsCreated: ['None (inquiry only)'],
    statusChanges: ['None'],
    exceptions: [],
    practice: {
      login: 'any demo user', role: 'Any role',
      customer: '-', cif: '-', account: 'SB000001', balance: '-', amount: '-',
      expectedResult: 'Seeded pending transfer TXN-SEED-000002 visible with status PENDING_AUTHORISATION.',
      verify: [VERIFY.JOURNAL, VERIFY.AUDIT],
    },
  }),

  'TXN-FAILED-001': concept({
    academyModule: 'control',
    concept: 'Failed transaction inquiry lists what did not complete — validation failures, gateway rejections — so staff can explain outcomes and act instead of guessing.',
    branchScenario: 'A customer\'s outward payment "did not go through"; the officer finds the failed attempt and the exact reason.',
    roles: [{ actor: 'Any employee', responsibility: 'Reviews failures.' }],
    flow: [{ actor: 'Employee', action: 'Lists failed transactions and reads the failure reason per item.' }],
    recordsCreated: ['None (inquiry only)'],
    statusChanges: ['None'],
    exceptions: [],
    practice: {
      login: 'any demo user', role: 'Any role',
      customer: '-', cif: '-', account: '-', balance: '-', amount: '-',
      expectedResult: 'Failed items with reason codes; links into the Integration Console for message-level detail.',
      verify: [VERIFY.INTEGRATION],
    },
  }),

  'TXN-REVERSE-001': concept({
    academyModule: 'control',
    concept: 'Reversal is the only correct way to undo a wrong posting: the original stays immutable and a new, linked transaction mirrors its journal in the opposite direction. It has its own maker-checker cycle and a mandatory reason.',
    branchScenario: 'A ₹5,000 transfer went to the wrong account. The teller initiates a reversal with the reason; the authoriser approves; both balances return to their pre-transaction state.',
    roles: [
      { actor: 'Teller (maker)', responsibility: 'Initiates reversal with a mandatory reason.' },
      { actor: 'Teller Authoriser / Branch Manager', responsibility: 'Approves the reversal.' },
    ],
    flow: MC_FLOW,
    accounting: { debit: 'Mirror of the original credit', credit: 'Mirror of the original debit' },
    recordsCreated: ['Reversal transaction linked to the original', 'Reversing journal', 'Audit events'],
    statusChanges: ['Original: POSTED → REVERSED; reversal: → POSTED'],
    exceptions: [
      { error: 'Transaction not reversible', cause: 'Only POSTED, non-reversed transactions qualify.', correction: 'Check status in Transaction Inquiry first.' },
      { error: 'Duplicate reversal', cause: 'The transaction was already reversed.', correction: 'Prohibited — the link already exists.' },
      { error: 'Reason missing', cause: 'Reversal without a reason.', correction: 'Reason is mandatory.' },
    ],
    practice: {
      login: 'teller01 (Teller@123), then tellerauthoriser01 (TellerAuth@123)',
      role: 'Teller → Teller Authoriser',
      customer: 'Amit/Neha', cif: 'CIF000001/CIF000002', account: 'SB000001 ↔ SB000002', balance: 'Post-transfer balances',
      amount: '₹5,000.00 (the posted transfer)',
      expectedResult: 'Balances restored (₹1,00,000.00 / ₹50,000.00); original marked REVERSED with a linked reversal transaction.',
      verify: [VERIFY.ACCOUNT, VERIFY.TRANSACTION, VERIFY.JOURNAL, VERIFY.AUDIT],
    },
  }),

  'TXN-EXCEPTION-001': concept({
    academyModule: 'control',
    concept: 'Exception resolution is the controlled repair path for items the system could not complete — stuck requests, suspense balances, failed messages. Every resolution is authorised and audited.',
    branchScenario: 'An outward payment sits in suspense after a gateway rejection; the checker resolves it by returning funds to the customer with manager approval.',
    roles: [
      { actor: 'Operations Checker', responsibility: 'Investigates and proposes resolution.' },
      { actor: 'Branch Manager', responsibility: 'Approves financial resolutions.' },
    ],
    flow: MC_FLOW,
    recordsCreated: ['Resolution record', 'Corrective entries where needed', 'Audit events'],
    statusChanges: ['OPEN → RESOLVED'],
    exceptions: [
      { error: 'Resolution without financial review', cause: 'Money movement attempted without manager approval.', correction: 'Route through the exception workflow with approval.' },
    ],
    practice: {
      login: 'checker01 (Checker@123), then manager01 (Manager@123)',
      role: 'Operations Checker → Branch Manager',
      customer: '-', cif: '-', account: '-', balance: '-', amount: '-',
      expectedResult: 'Exception investigated and resolved with an audit trail.',
      verify: [VERIFY.AUDIT, VERIFY.INTEGRATION],
    },
  }),

  'EXC-QUEUE-001': concept({
    academyModule: 'control',
    concept: 'The exception queue is the branch\'s open-items list: everything abnormal, in one place, owned and aged. A healthy branch ends the day with an empty or consciously-carried queue.',
    branchScenario: 'The manager reviews the queue every afternoon: a failed integration message, an unresolved suspense entry — each assigned and tracked.',
    roles: [{ actor: 'Operations Checker / Branch Manager', responsibility: 'Reviews and owns open exceptions.' }],
    flow: [{ actor: 'Reviewer', action: 'Scans open exceptions, assigns owners, tracks ageing.' }],
    recordsCreated: ['None (queue view; resolutions are separate records)'],
    statusChanges: ['Items move OPEN → RESOLVED via TXN-EXCEPTION-001'],
    exceptions: [],
    practice: {
      login: 'manager01 (Manager@123)',
      role: 'Branch Manager',
      customer: '-', cif: '-', account: '-', balance: '-', amount: '-',
      expectedResult: 'Open exceptions listed with age and owner.',
      verify: [VERIFY.AUDIT],
    },
  }),

  'ENQ-AUDIT-001': concept({
    academyModule: 'control',
    concept: 'The audit trail is the immutable memory of the system: every login, launch, decision, posting and reset with user, role, business date and before/after detail. It cannot be edited — only viewed.',
    branchScenario: 'An auditor reconstructs exactly what happened to an account last Tuesday — who did what, in what order, with which approvals.',
    roles: [{ actor: 'Auditor / Managers / Admin', responsibility: 'Views and exports audit history.' }],
    flow: [{ actor: 'Reviewer', action: 'Filters by action, user or entity and reads the event stream.' }],
    recordsCreated: ['None (the trail is written by every other operation)'],
    statusChanges: ['None'],
    exceptions: [],
    practice: {
      login: 'auditor01 (Audit@123)',
      role: 'Auditor',
      customer: '-', cif: '-', account: '-', balance: '-', amount: '-',
      expectedResult: 'LOGIN/LOGOUT, operation launches, decisions and postings visible in order.',
      verify: ['Compare events before and after performing any operation'],
    },
  }),

  'INT-CONSOLE-001': concept({
    academyModule: 'control',
    concept: 'The integration console monitors the bank\'s conversations with outside systems — KYC, AML, payment gateways, notifications. Every message has a status and a retry path; nothing disappears silently.',
    branchScenario: 'A mock NEFT message shows MOCK_TIMEOUT. The checker retries it from the console and watches it succeed — without re-entering the payment.',
    roles: [
      { actor: 'Operations Checker', responsibility: 'Monitors and retries messages.' },
      { actor: 'Branch Manager / Admin / Auditor', responsibility: 'Oversight of failures.' },
    ],
    flow: [{ actor: 'Reviewer', action: 'Filters failed messages, reads the failure reason, retries with correlation ID preserved.' }],
    recordsCreated: ['Retry attempts with correlation IDs', 'Audit events'],
    statusChanges: ['FAILED → RETRYING → SUCCESS (or FAILED again)'],
    exceptions: [
      { error: 'Duplicate message risk', cause: 'Re-entering a payment whose message actually left.', correction: 'Always check correlation IDs in the console before any re-entry.' },
    ],
    practice: {
      login: 'checker01 (Checker@123)',
      role: 'Operations Checker',
      customer: '-', cif: '-', account: '-', balance: '-', amount: '-',
      expectedResult: 'Seeded failed message MSG-SEED-000001 visible with reason MOCK_TIMEOUT.',
      verify: [VERIFY.AUDIT],
    },
  }),

  'ADMIN-USERS-001': concept({
    academyModule: 'control',
    concept: 'User administration controls who can do what. In a real bank this is identity-and-access management; in this training environment it lists the fictional demo users and their roles.',
    branchScenario: 'The administrator reviews which demo roles exist and what each is allowed to do.',
    roles: [{ actor: 'System Administrator', responsibility: 'Manages demo users and roles.' }],
    flow: [{ actor: 'Administrator', action: 'Reviews users, roles and status.' }],
    recordsCreated: ['Audit events'],
    statusChanges: ['User status ACTIVE/INACTIVE (managed)'],
    exceptions: [],
    practice: {
      login: 'admin01 (Admin@123)',
      role: 'System Administrator',
      customer: '-', cif: '-', account: '-', balance: '-', amount: '-',
      expectedResult: 'All 11 fictional demo users listed with roles and branches.',
      verify: [VERIFY.AUDIT],
    },
  }),

  'ADMIN-PARAMS-001': concept({
    academyModule: 'control',
    concept: 'Parameters are the bank\'s rulebook: product minimums, rates, limits, thresholds. Changing a parameter changes system behaviour, so parameters are centrally administered and audited.',
    branchScenario: 'The administrator reviews the training product rules — minimum balances, transaction limits, the high-value threshold.',
    roles: [{ actor: 'System Administrator', responsibility: 'Maintains bank/branch/product parameters.' }],
    flow: [{ actor: 'Administrator', action: 'Reviews and maintains parameter values.' }],
    recordsCreated: ['Parameter change history', 'Audit events'],
    statusChanges: ['Parameter versions over time'],
    exceptions: [],
    practice: {
      login: 'admin01 (Admin@123)',
      role: 'System Administrator',
      customer: '-', cif: '-', account: '-', balance: '-', amount: '-',
      expectedResult: 'Bank, branch and product parameters visible (e.g. SAV-REG minimum ₹1,000.00).',
      verify: [VERIFY.AUDIT],
    },
  }),

  'ADMIN-RESET-001': concept({
    academyModule: 'control',
    concept: 'Environment reset is a training-only superpower: it restores the whole fictional dataset so practice can start clean. The reset itself is audited — even here, nothing is untracked.',
    branchScenario: 'After a workshop, the administrator resets the environment so the next batch starts from identical data.',
    roles: [{ actor: 'System Administrator', responsibility: 'Resets the training environment.' }],
    flow: [{ actor: 'Administrator', action: 'Confirms the reset; seeds reload; an ENVIRONMENT_RESET audit event is written.' }],
    recordsCreated: ['Fresh seed data', 'ENVIRONMENT_RESET audit event'],
    statusChanges: ['Practice data → original seed state'],
    exceptions: [],
    practice: {
      login: 'admin01 (Admin@123)',
      role: 'System Administrator',
      customer: '-', cif: '-', account: '-', balance: '-', amount: '-',
      expectedResult: 'All collections restored; audit trail contains exactly the reset event.',
      verify: [VERIFY.AUDIT],
    },
  }),

  // ==================================================== 8. ACCOUNTING
  'GL-JOURNAL-INQUIRY-001': concept({
    academyModule: 'accounting',
    concept: 'Journal inquiry shows the accounting proof of every posted transaction: header plus debit/credit lines, always balanced. If it is not in a journal, it did not financially happen.',
    branchScenario: 'After approving a transfer, the authoriser opens the journal and confirms Dr source deposit = Cr destination deposit = ₹5,000.',
    roles: [{ actor: 'Any employee / Auditor', responsibility: 'Reviews journals.' }],
    flow: [{ actor: 'Employee', action: 'Finds the journal by transaction and checks that debits equal credits.' }],
    recordsCreated: ['None (inquiry only)'],
    statusChanges: ['None'],
    exceptions: [
      { error: 'Unbalanced journal', cause: 'Should be impossible — posting is blocked when unbalanced.', correction: 'Treat as a critical exception; escalate immediately.' },
    ],
    practice: {
      login: 'any demo user', role: 'Any role',
      customer: '-', cif: '-', account: '-', balance: '-', amount: '₹5,000.00 (example transfer)',
      expectedResult: 'One debit line and one credit line, equal totals, linked to the transaction reference.',
      verify: [VERIFY.TRANSACTION, VERIFY.AUDIT],
    },
  }),

  'GL-ACCOUNT-INQUIRY-001': concept({
    academyModule: 'accounting',
    concept: 'GL account inquiry shows the balance of the bank\'s own categories — teller cash, deposit liabilities, loan assets, income, expense, suspense.',
    branchScenario: 'The manager checks that the teller cash GL matches the day\'s physical cash total before closing.',
    roles: [{ actor: 'Any employee', responsibility: 'Views GL balances.' }],
    flow: [{ actor: 'Employee', action: 'Opens a GL category and reviews its balance and recent lines.' }],
    recordsCreated: ['None (inquiry only)'],
    statusChanges: ['None'],
    exceptions: [],
    practice: {
      login: 'manager01 (Manager@123)', role: 'Branch Manager',
      customer: '-', cif: '-', account: 'TRN-GL-1001 Teller Cash', balance: '₹5,00,000.00 (seed)', amount: '-',
      expectedResult: 'GL balances listed by category.',
      verify: [VERIFY.JOURNAL],
    },
  }),

  'GL-TRIAL-BALANCE-001': concept({
    academyModule: 'accounting',
    concept: 'The trial balance lists every GL with its debit/credit totals and proves the whole book balances — the accounting equivalent of a checksum for the day.',
    branchScenario: 'Before closing the business date, the manager runs the trial balance and confirms total debits equal total credits.',
    roles: [{ actor: 'Branch Manager / Auditor', responsibility: 'Runs and reviews the trial balance.' }],
    flow: [{ actor: 'Manager', action: 'Generates the trial balance and confirms it nets to zero.' }],
    recordsCreated: ['Report instance', 'Audit events'],
    statusChanges: ['None (report)'],
    exceptions: [
      { error: 'Trial balance out', cause: 'An unbalanced entry slipped through (should be blocked).', correction: 'Stop day end; find and repair the offending journal.' },
    ],
    practice: {
      login: 'manager01 (Manager@123)', role: 'Branch Manager',
      customer: '-', cif: '-', account: '-', balance: '-', amount: '-',
      expectedResult: 'All GL categories listed; total debits = total credits.',
      verify: [VERIFY.JOURNAL],
    },
  }),

  'GL-SUSPENSE-001': concept({
    academyModule: 'accounting',
    concept: 'Suspense holds money in transit — outward payments awaiting settlement, unidentified credits. It must be reviewed daily and cleared; a growing suspense balance is a red flag.',
    branchScenario: 'The checker reviews suspense and finds yesterday\'s rejected NEFT sitting there, then resolves it back to the customer.',
    roles: [{ actor: 'Any employee', responsibility: 'Views suspense entries.' }, { actor: 'Operations Checker', responsibility: 'Clears entries with approval.' }],
    flow: [{ actor: 'Reviewer', action: 'Lists suspense entries with age and resolves each through the exception process.' }],
    recordsCreated: ['None (inquiry; clearing creates its own records)'],
    statusChanges: ['Entries age until cleared'],
    exceptions: [
      { error: 'Aged suspense', cause: 'Entry not cleared within the expected window.', correction: 'Escalate and resolve through TXN-EXCEPTION-001.' },
    ],
    practice: {
      login: 'checker01 (Checker@123)', role: 'Operations Checker',
      customer: '-', cif: '-', account: 'TRN-GL-9001 Suspense', balance: '-', amount: '-',
      expectedResult: 'Suspense entries with age and reason.',
      verify: [VERIFY.JOURNAL, VERIFY.INTEGRATION],
    },
  }),

  'GL-OFFICE-ACCOUNT-001': concept({
    academyModule: 'accounting',
    concept: 'Office accounts are the bank\'s internal accounts — cash, suspense, income and expense — as opposed to customer accounts. They are how the branch reconciles internal positions.',
    branchScenario: 'At day end, the authoriser reviews office accounts to confirm internal cash and income/expense postings look sane.',
    roles: [{ actor: 'Any employee', responsibility: 'Views internal accounts.' }],
    flow: [{ actor: 'Employee', action: 'Reviews internal account balances and movements.' }],
    recordsCreated: ['None (inquiry only)'],
    statusChanges: ['None'],
    exceptions: [],
    practice: {
      login: 'manager01 (Manager@123)', role: 'Branch Manager',
      customer: '-', cif: '-', account: '-', balance: '-', amount: '-',
      expectedResult: 'Internal (non-customer) accounts with balances.',
      verify: [VERIFY.JOURNAL],
    },
  }),

  // ====================================================== 9. DAY END
  'EOD-PRECHECK-001': concept({
    academyModule: 'day-end',
    concept: 'The pre-check answers one question: can this business date close? Pending authorisations, unposted transactions, open teller sessions, unbalanced journals, failed messages and unresolved exceptions all block or warn.',
    branchScenario: 'At 5 PM the manager runs the pre-check and finds an open teller session and one failed message — both must be handled before closing.',
    roles: [{ actor: 'Branch Manager', responsibility: 'Runs and clears the pre-check.' }],
    flow: [{ actor: 'System', action: 'Scans all blocking/warning categories and reports per-item detail.' }],
    recordsCreated: ['Pre-check result', 'Audit events'],
    statusChanges: ['PRECHECK READY / BLOCKED'],
    exceptions: [
      { error: 'Open teller session', cause: 'A teller has not closed.', correction: 'Complete TEL-SESSION-CLOSE-001 first.' },
      { error: 'Pending authorisations', cause: 'Requests undecided.', correction: 'Decide or consciously carry forward per policy.' },
    ],
    practice: {
      login: 'manager01 (Manager@123)', role: 'Branch Manager',
      customer: '-', cif: '-', account: '-', balance: '-', amount: '-',
      expectedResult: 'Per-category pass/fail with drill-down to each blocking item.',
      verify: [VERIFY.AUDIT],
    },
  }),

  'EOD-TELLER-001': concept({
    academyModule: 'day-end',
    concept: 'Teller closure validation confirms every teller session for the date is closed and every cash position is approved. An open teller means cash is still unaccounted.',
    branchScenario: 'The manager validates that teller01\'s declared closing cash was approved before proceeding.',
    roles: [
      { actor: 'Teller Authoriser', responsibility: 'Confirms cash closures.' },
      { actor: 'Branch Manager', responsibility: 'Validates all tellers closed.' },
    ],
    flow: [{ actor: 'System', action: 'Lists teller sessions with closure status and cash differences.' }],
    recordsCreated: ['Validation result', 'Audit events'],
    statusChanges: ['TELLERS VALIDATED / BLOCKED'],
    exceptions: [
      { error: 'Cash difference', cause: 'Declared vs system mismatch.', correction: 'Investigate; record difference through exceptions — never force.' },
    ],
    practice: {
      login: 'tellerauthoriser01 (TellerAuth@123), then manager01 (Manager@123)',
      role: 'Teller Authoriser → Branch Manager',
      customer: '-', cif: '-', account: '-', balance: '-', amount: '-',
      expectedResult: 'All teller sessions CLOSED and validated.',
      verify: [VERIFY.TELLER_CASH, VERIFY.AUDIT],
    },
  }),

  'EOD-BATCH-001': concept({
    academyModule: 'day-end',
    concept: 'Batch processing runs the day\'s bulk events without a human per item: FD maturities falling due, EMI due marking, standing instruction execution, interest application.',
    branchScenario: 'The manager runs the batch; FD000002\'s maturity processes and due EMIs are marked for tomorrow\'s follow-up.',
    roles: [{ actor: 'Branch Manager', responsibility: 'Runs and monitors the batch.' }],
    flow: [{ actor: 'System', action: 'Executes FD events, loan events and standing instructions; logs each outcome.' }],
    accounting: { debit: 'Per event type (e.g. TD liability + interest expense)', credit: 'Per event type (e.g. customer deposit)' },
    recordsCreated: ['Batch run record', 'Per-event transactions/journals', 'Audit events'],
    statusChanges: ['BATCH PENDING → COMPLETED'],
    exceptions: [
      { error: 'Event failed in batch', cause: 'E.g. SI execution with insufficient funds.', correction: 'The item fails isolated; resolve via exceptions and re-run.' },
    ],
    practice: {
      login: 'manager01 (Manager@123)', role: 'Branch Manager',
      customer: '-', cif: '-', account: '-', balance: '-', amount: '-',
      expectedResult: 'Batch summary: events processed, succeeded, failed.',
      verify: [VERIFY.TD, VERIFY.EMI, VERIFY.JOURNAL, VERIFY.AUDIT],
    },
  }),

  'EOD-CLOSE-001': concept({
    academyModule: 'day-end',
    concept: 'Closing the business date seals the day: no more postings carry this date, reports become final, and the bank rolls to the next business date. A closed date can never be closed twice.',
    branchScenario: 'All checks green, batch complete, reports generated — the manager closes 2026-10-17 and the branch opens on the next business date.',
    roles: [{ actor: 'Branch Manager', responsibility: 'Closes the business date.' }],
    flow: [{ actor: 'System', action: 'Validates all gates, seals the date, advances the business date, audits the closure.' }],
    recordsCreated: ['Business date closure record', 'Audit events'],
    statusChanges: ['BUSINESS DATE OPEN → CLOSED; next date OPEN'],
    exceptions: [
      { error: 'Duplicate closure attempt', cause: 'Date already closed.', correction: 'Blocked by design — the day-end engine refuses.' },
      { error: 'Pre-checks incomplete', cause: 'Blocking items remain.', correction: 'Clear them or hold the date open.' },
    ],
    practice: {
      login: 'manager01 (Manager@123)', role: 'Branch Manager',
      customer: '-', cif: '-', account: '-', balance: '-', amount: '-',
      expectedResult: 'Business date advances; the closed date is immutable.',
      verify: [VERIFY.AUDIT],
    },
  }),

  'EOD-REPORT-001': concept({
    academyModule: 'day-end',
    concept: 'The day-end report is the day\'s official summary: transaction counts and volumes, journal proof, exceptions and closures — the document the branch files for the date.',
    branchScenario: 'After closing, the manager downloads the day-end report and files it with the branch records.',
    roles: [{ actor: 'Branch Manager / Auditor', responsibility: 'Generates and reviews the report.' }],
    flow: [{ actor: 'Manager', action: 'Generates the report for the date and files it.' }],
    recordsCreated: ['Report instance', 'Audit events'],
    statusChanges: ['None (report)'],
    exceptions: [],
    practice: {
      login: 'manager01 (Manager@123)', role: 'Branch Manager',
      customer: '-', cif: '-', account: '-', balance: '-', amount: '-',
      expectedResult: 'Summary of the day: volumes, journals balanced, exceptions listed.',
      verify: [VERIFY.AUDIT],
    },
  }),

  'RPT-BRANCH-001': concept({
    academyModule: 'day-end',
    concept: 'The branch operations report aggregates activity for review: what was created, approved, posted, reversed and what remains pending — management\'s view of branch health.',
    branchScenario: 'The manager reviews the week: volumes by operation type, pending items, exceptions and audit highlights.',
    roles: [{ actor: 'Branch Manager / Auditor / Admin', responsibility: 'Reviews branch activity.' }],
    flow: [{ actor: 'Reviewer', action: 'Generates the report for a period and reviews the figures.' }],
    recordsCreated: ['Report instance'],
    statusChanges: ['None (report)'],
    exceptions: [],
    practice: {
      login: 'manager01 (Manager@123)', role: 'Branch Manager',
      customer: '-', cif: '-', account: '-', balance: '-', amount: '-',
      expectedResult: 'Activity summary across modules for the period.',
      verify: [VERIFY.AUDIT],
    },
  }),
});

export function getOperationConcept(code) {
  return OPERATION_CONCEPTS[code] ?? null;
}

/**
 * Demo credentials for an operation's guide page, derived from the
 * operation registry's allowedRoles and the fictional employee seed.
 * Ordering is maker first, then authoriser, then inquiry-only roles —
 * the same order in which a trainee uses them.
 */
import { hasCapability, CAPABILITIES } from '../../domain/rules/permissionRules.js';

export function practiceUsersForOperation(operation, employees) {
  if (!operation) return [];
  const roleRank = (role) => {
    if (hasCapability(role, CAPABILITIES.MAKE_REQUEST)) return 0;
    if (hasCapability(role, CAPABILITIES.AUTHORISE_REQUEST)) return 1;
    return 2;
  };
  return employees
    .filter((e) => e.isDemo && operation.allowedRoles.includes(e.role))
    .map((e) => ({
      username: e.username,
      password: e.password,
      role: e.role,
      branch: e.branch,
      involvement: roleRank(e.role) === 0 ? 'Maker' : roleRank(e.role) === 1 ? 'Authoriser' : 'Inquiry / view only',
    }))
    .sort((a, b) => roleRank(a.role) - roleRank(b.role) || a.username.localeCompare(b.username));
}
