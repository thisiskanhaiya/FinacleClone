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
    concept: 'Creating a retail CIF registers a new individual as a customer of the bank. The CIF is the single identity anchor to which all future accounts, deposits and loans will link. In the simulator this operation is fully live: the customer record is created immediately but stays PENDING_AUTHORISATION (unusable for account opening) until a second employee approves it.',
    branchScenario: 'A walk-in customer wants to open a relationship with the bank. The maker captures name, contact, address, ID proof, segment and risk category. The record appears in Customer 360 flagged PENDING_AUTHORISATION; the checker compares it against the KYC documents and authorises it in the queue, after which the CIF turns ACTIVE with KYC COMPLETE.',
    roles: [
      { actor: 'Customer', responsibility: 'Provides KYC documents and personal details.' },
      { actor: 'maker01 — Customer Service Maker', responsibility: 'Captures the CIF, passes validation (name, phone format, ID proof type/number, address) and submits; the system also runs a duplicate check on name + phone.' },
      { actor: 'checker01 — Operations Checker', responsibility: 'Opens the request in the Authorisation Queue, reviews the before/after detail card and approves, rejects or returns it. maker01 can never decide their own request.' },
    ],
    flow: [
      { actor: 'Customer', action: 'Provides identity proof and details at the counter.' },
      { actor: 'Maker (maker01)', action: 'Submits the CIF. The system validates all fields and checks for a duplicate (same name + phone as an existing customer). The CIF number is generated now (the next free one, e.g. CIF000008), the record is stored as PENDING_AUTHORISATION with KYC SUBMITTED, and a request enters the Authorisation Queue. Audit: REQUEST_SUBMITTED.' },
      { actor: 'Checker (checker01)', action: 'Reviews the request in the Authorisation Queue. Approve → CIF becomes ACTIVE and KYC COMPLETE. Reject or Return (remarks mandatory) → nothing is activated; a returned request can be corrected and resubmitted by the maker.' },
      { actor: 'System', action: 'On approval writes REQUEST_APPROVED; every step keeps maker, checker, branch and business date in the audit trail.' },
    ],
    recordsCreated: ['Customer (CIF) record, status PENDING_AUTHORISATION', 'Authorisation request with the full payload as afterValues', 'Audit events: REQUEST_SUBMITTED, then REQUEST_APPROVED / REJECTED / RETURNED'],
    statusChanges: [
      'Customer: (new) → PENDING_AUTHORISATION → ACTIVE',
      'KYC: SUBMITTED → COMPLETE (on approval)',
      'Request: PENDING_AUTHORISATION → APPROVED / REJECTED / RETURNED_FOR_CORRECTION → (resubmit) → PENDING_AUTHORISATION',
    ],
    exceptions: [
      { error: 'Duplicate CIF blocked', cause: 'A customer with the same name and phone already exists (e.g. submitting Amit Sharma with +91-9000000001).', correction: 'Search in Customer 360 first; use the existing CIF.' },
      { error: 'Validation panel errors', cause: 'Missing name/address, bad phone format or missing ID proof details.', correction: 'Fix the highlighted fields and resubmit — nothing is stored until validation passes.' },
      { error: 'Maker cannot authorise own request', cause: 'maker01 opening the queue sees their own request disabled.', correction: 'checker01 (or another authorised role) must decide — this is the control working as designed.' },
    ],
    recovery: 'Wrong entry? The checker returns it with remarks; the maker edits the payload and resubmits (request goes RETURNED_FOR_CORRECTION → PENDING_AUTHORISATION again). A rejected request ends; create a fresh one if still needed. No money is involved at this stage.',
    practice: {
      login: 'maker01 (Maker@123) to submit, then checker01 (Checker@123) to authorise',
      role: 'Customer Service Maker → Operations Checker',
      customer: 'New fictional customer, e.g. Riya Kapoor',
      cif: 'Generated at submission — CIF000008 on a freshly reset environment',
      account: '-', balance: '-', amount: '-',
      expectedResult: 'After submit: request in the queue, CIF visible in Customer 360 as PENDING_AUTHORISATION. After checker approval: CIF ACTIVE, KYC COMPLETE.',
      verify: [VERIFY.CUSTOMER, VERIFY.AUDIT],
    },
  }),

  'CIF-CORP-001': concept({
    academyModule: 'customer-cif',
    concept: 'A corporate CIF registers a business entity instead of a person. It is the same identity anchor as a retail CIF, but it unlocks business products — only a corporate CIF can hold a current account. In the simulator this operation is fully live and behaves exactly like retail CIF creation, with one extra rule: the entity registration reference is mandatory.',
    branchScenario: 'A company wants to bank here. The maker captures the entity name, SME/CORPORATE segment, contact details, identity proof and the registration reference (CIN-style). The record waits as PENDING_AUTHORISATION until the checker verifies the entity documents and approves.',
    roles: [
      { actor: 'Customer (business)', responsibility: 'Provides entity registration documents and contact details.' },
      { actor: 'maker01 — Customer Service Maker', responsibility: 'Captures the corporate CIF; validation additionally requires the registration reference.' },
      { actor: 'checker01 — Operations Checker', responsibility: 'Verifies entity documents in the queue and approves, rejects or returns.' },
    ],
    flow: [
      { actor: 'Customer (business)', action: 'Submits registration proof and entity details.' },
      { actor: 'Maker (maker01)', action: 'Submits the corporate CIF. Validation requires name, phone, address, ID proof and the registration reference; the duplicate check (name + phone) still applies. Record stored as PENDING_AUTHORISATION; request enters the queue.' },
      { actor: 'Checker (checker01)', action: 'Approves in the Authorisation Queue → the corporate CIF becomes ACTIVE and KYC COMPLETE, eligible for current-account opening.' },
      { actor: 'System', action: 'Audits submission and decision with maker, checker and business date.' },
    ],
    recordsCreated: ['Corporate CIF record (PENDING_AUTHORISATION until approved)', 'Authorisation request', 'Audit events'],
    statusChanges: [
      'Customer: (new) → PENDING_AUTHORISATION → ACTIVE',
      'KYC: SUBMITTED → COMPLETE (on approval)',
      'Request: PENDING_AUTHORISATION → APPROVED / REJECTED / RETURNED_FOR_CORRECTION',
    ],
    exceptions: [
      { error: 'Registration reference missing', cause: 'Corporate payload without an entity registration reference fails validation.', correction: 'Enter the registration reference and resubmit.' },
      { error: 'Duplicate entity blocked', cause: 'Same name + phone as an existing customer (e.g. Demo Traders with +91-9000000006).', correction: 'Use the existing CIF000006 instead.' },
    ],
    recovery: 'Checker returns the request for correction; the maker fixes and resubmits. Rejection ends the request.',
    practice: {
      login: 'maker01 (Maker@123), then checker01 (Checker@123)',
      role: 'Customer Service Maker → Operations Checker',
      customer: 'New fictional entity, e.g. Sample Foods LLP (segment SME, registration ref required)',
      cif: 'Generated at submission',
      account: '-', balance: '-', amount: '-',
      expectedResult: 'Corporate CIF ACTIVE after approval; compare with the seeded corporate CIF000006 (Demo Traders Private Limited).',
      verify: [VERIFY.CUSTOMER, VERIFY.AUDIT],
    },
  }),

  'CIF-MODIFY-001': concept({
    academyModule: 'customer-cif',
    concept: 'Customer data changes over time. In the simulator this operation is fully live with real discipline: only phone, email, address and segment are modifiable here, the request stores exact before/after values for the checker, and nothing is applied to the customer record until approval. Name, customer type and risk category deliberately need their own servicing operations (later phases).',
    branchScenario: 'A customer reports a changed phone number and address. The maker searches the CIF, edits the modifiable fields and submits; the checker opens the request and sees a before/after comparison table — exactly which fields change, from what to what — and approves. Only then is the customer record updated.',
    roles: [
      { actor: 'Customer', responsibility: 'Requests the change with a supporting instruction.' },
      { actor: 'maker01 — Customer Service Maker', responsibility: 'Selects an ACTIVE CIF, edits phone/email/address/segment and submits; submitting with no actual change is rejected as "No changes detected".' },
      { actor: 'checker01 — Operations Checker', responsibility: 'Reviews the highlighted before/after differences in the queue and approves or returns.' },
    ],
    flow: [
      { actor: 'Maker (maker01)', action: 'Searches the customer, edits allowed fields and submits. The system compares against the current record, keeps only touched fields, and rejects empty submissions.' },
      { actor: 'System', action: 'Stores the request with beforeValues and afterValues; the customer record itself is untouched while pending.' },
      { actor: 'Checker (checker01)', action: 'Approves → the changed fields are applied to the CIF atomically. Return → maker corrects and resubmits.' },
    ],
    recordsCreated: ['Modification request carrying before/after values per touched field', 'Audit events: REQUEST_SUBMITTED, then the decision event'],
    statusChanges: [
      'Customer record: unchanged until APPROVED, then updated fields applied',
      'Request: PENDING_AUTHORISATION → APPROVED / REJECTED / RETURNED_FOR_CORRECTION',
    ],
    exceptions: [
      { error: 'No changes detected', cause: 'Submitted values are identical to the current record.', correction: 'Change at least one field before submitting.' },
      { error: 'Customer not ACTIVE', cause: 'CIF still PENDING_AUTHORISATION (e.g. freshly created, not yet approved).', correction: 'Approve the CIF first — only ACTIVE customers can be modified.' },
      { error: 'Invalid phone/email on a touched field', cause: 'Format validation runs on every changed field.', correction: 'Fix the format and resubmit.' },
    ],
    recovery: 'Checker returns the request with remarks; the maker corrects and resubmits. Applied changes are corrected through a new modification request — history is never overwritten.',
    practice: {
      login: 'maker01 (Maker@123), then checker01 (Checker@123)',
      role: 'Customer Service Maker → Operations Checker',
      customer: 'Amit Sharma', cif: 'CIF000001', account: '-', balance: '-', amount: '-',
      expectedResult: 'Change phone to +91-9111111111 and segment to PREMIUM; after checker approval Customer 360 shows the new values, and the request kept the old ones as beforeValues.',
      verify: [VERIFY.CUSTOMER, VERIFY.AUDIT],
    },
  }),

  'CIF-INQUIRY-001': concept({
    academyModule: 'customer-cif',
    concept: 'Customer 360 is the read-only consolidated view of a customer: identity, contact, KYC, risk, status and every account under the CIF with balances. It changes nothing and needs no authorisation — every role, including the read-only Auditor, may use it.',
    branchScenario: 'Before serving a customer at the counter the officer opens Customer 360 to confirm identity, see relationships and spot restrictions: a PENDING_AUTHORISATION CIF (not yet usable), expired KYC (Sunita Rao, CIF000005), a frozen account (SB000006) or a dormant one (SB000005).',
    roles: [
      { actor: 'Any bank employee', responsibility: 'Searches by CIF or name and views the consolidated record.' },
      { actor: 'Auditor (auditor01)', responsibility: 'Uses the same view for review — read-only by design.' },
    ],
    flow: [
      { actor: 'Employee', action: 'Searches by CIF or name (partial matches work), selects the customer and reviews the profile card plus the full account list with status and balances.' },
    ],
    recordsCreated: ['None — inquiry only'],
    statusChanges: ['None'],
    exceptions: [
      { error: 'Customer not found', cause: 'Wrong CIF or name spelling.', correction: 'Re-check the number; search is by CIF or name substring.' },
      { error: 'CIF shows PENDING_AUTHORISATION', cause: 'Created but not yet approved by a checker.', correction: 'Not an error — the CIF cannot open accounts until the queue approves it.' },
    ],
    recovery: 'Not applicable — inquiry never changes data.',
    practice: {
      login: 'any demo user, e.g. maker01 (Maker@123)',
      role: 'Any role', customer: 'Amit Sharma', cif: 'CIF000001',
      account: 'SB000001 and SB000007', balance: '₹1,00,000.00 and ₹80,000.00 ledger', amount: '-',
      expectedResult: 'Profile card plus two accounts, including SB000007 with its ₹20,000 lien. This is also where you confirm a newly approved CIF turned ACTIVE.',
      verify: ['After practicing CIF-CREATE-001, search the new CIF here to confirm ACTIVE + KYC COMPLETE'],
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
    concept: 'Opening a savings account creates a deposit liability of the bank linked to an approved CIF, governed by a product\'s rules (minimum opening amount, limits). In the simulator this is a live financial journey: the opening amount is collected as cash, and the moment the checker approves, the system posts a balanced double-entry journal — Dr Teller Cash, Cr Savings Deposit Liability — and credits the brand-new account.',
    branchScenario: 'Neha Verma (CIF000002, ACTIVE, KYC COMPLETE) wants a regular savings account and hands over ₹5,000 cash. The maker selects product SAV-REG and enters the amount; the account is created as PENDING_AUTHORISATION with a zero balance and the next SB number. The checker approves; the account turns ACTIVE, the deposit posts, and Account Inquiry shows ₹5,000 with one CREDIT leg.',
    roles: [
      { actor: 'Customer', responsibility: 'Provides the opening amount in cash.' },
      { actor: 'maker01 — Customer Service Maker', responsibility: 'Selects CIF + product, enters the amount; eligibility is enforced (CIF ACTIVE, KYC COMPLETE, retail customer, amount ≥ product minimum).' },
      { actor: 'checker01 — Operations Checker', responsibility: 'Approves in the queue; approval is the trigger that activates the account and posts the initial deposit.' },
    ],
    flow: [
      { actor: 'Maker (maker01)', action: 'Submits CIF + product SAV-REG + opening amount. Validation runs immediately: customer must be ACTIVE with KYC COMPLETE and of RETAIL type; amount must be ≥ ₹1,000.00 (SAV-REG minimum; SAV-SAL has none). Account created PENDING_AUTHORISATION, zero balance, number SB000008 on a fresh environment.' },
      { actor: 'Checker (checker01)', action: 'Approves the request in the Authorisation Queue.' },
      { actor: 'System', action: 'Sets the account ACTIVE with openedOn = business date, then posts: Dr Teller Cash GL (TRN-GL-1001) ₹5,000 / Cr Savings Deposit Liability GL (TRN-GL-2001) ₹5,000, credits the account, and writes one journal, one transaction leg (balanceAfter ₹5,000) and audit events (JOURNAL_POSTED, BALANCE_UPDATED, TRANSACTION_POSTED).' },
    ],
    accounting: {
      debit: 'Teller Cash GL (TRN-GL-1001) — bank\'s cash holding rises',
      credit: 'Savings Deposit Liability GL (TRN-GL-2001) — bank owes the customer more',
      note: 'Posted automatically on approval as an INITIAL_DEPOSIT transaction. The same amount credits the new customer account (sub-ledger). The journal must balance — the engine blocks anything else.',
    },
    recordsCreated: ['Account record (PENDING_AUTHORISATION, then ACTIVE)', 'Authorisation request', 'Posted transaction + balanced journal + journal lines', 'Transaction leg on the new account with balanceAfter', 'Audit events'],
    statusChanges: [
      'Account: (new) → PENDING_AUTHORISATION → ACTIVE (openedOn = business date)',
      'Balances: 0 → opening amount on both ledger and available',
      'Request: PENDING_AUTHORISATION → APPROVED',
    ],
    exceptions: [
      { error: 'CIF not ACTIVE', cause: 'Customer still pending approval (e.g. a CIF you just created).', correction: 'Approve the CIF in the queue first.' },
      { error: 'KYC not COMPLETE', cause: 'e.g. Sunita Rao (CIF000005) has EXPIRED KYC.', correction: 'KYC refresh is a servicing operation (Phase 7); pick a KYC-complete customer meanwhile.' },
      { error: 'Below minimum opening amount', cause: 'SAV-REG requires ₹1,000.00.', correction: 'Collect at least the product minimum and resubmit.' },
      { error: 'Corporate CIF for a savings product', cause: 'Savings accounts are retail-only in this bank.', correction: 'Use a retail CIF.' },
      { error: 'Duplicate posting impossible', cause: 'Each approved request posts exactly once; a second post is blocked by the workflow engine.', correction: 'Nothing to do — the guard is the control.' },
    ],
    recovery: 'Before approval the checker can reject or return the request — nothing posts. After approval the money is real inside the training data: a wrong opening is corrected only by a controlled reversal (Phase 4), never by editing balances.',
    practice: {
      login: 'maker01 (Maker@123), then checker01 (Checker@123)',
      role: 'Customer Service Maker → Operations Checker',
      customer: 'Neha Verma', cif: 'CIF000002', account: 'New SB number — SB000008 on a fresh environment',
      balance: '-', amount: '₹5,000.00 (minimum ₹1,000.00)',
      expectedResult: 'After approval: SB000008 ACTIVE with ledger = available = ₹5,000.00, openedOn 2026-10-17; Teller Cash GL +₹5,000 and Savings Liability GL +₹5,000.',
      verify: [VERIFY.ACCOUNT, VERIFY.CUSTOMER, VERIFY.AUDIT],
    },
  }),

  'ACCT-CUR-OPEN-001': concept({
    academyModule: 'accounts',
    concept: 'A current account is a business transaction account: no interest, higher minimums, high transaction capacity. Only corporate CIFs qualify. Live in the simulator, it mirrors savings-account opening but posts the initial deposit against the Current Deposit Liability GL and numbers accounts with the CA prefix.',
    branchScenario: 'Demo Traders Private Limited (CIF000006, the seeded corporate customer) wants a second current account for collections and funds it with ₹25,000. Maker submits, checker approves, the account activates and the deposit posts.',
    roles: [
      { actor: 'Customer (business)', responsibility: 'Resolution to open the account and the opening funds.' },
      { actor: 'maker01 — Customer Service Maker', responsibility: 'Selects the corporate CIF + product CUR-STD and submits; validation enforces corporate type and the ₹10,000.00 minimum.' },
      { actor: 'checker01 — Operations Checker', responsibility: 'Approves; approval activates the account and posts the initial deposit.' },
    ],
    flow: [
      { actor: 'Maker (maker01)', action: 'Submits CIF000006 + CUR-STD + amount. Validation: CIF ACTIVE, KYC COMPLETE, customer type CORPORATE, amount ≥ ₹10,000.00. Account created PENDING_AUTHORISATION as CA000002 (next after the seeded CA000001).' },
      { actor: 'Checker (checker01)', action: 'Approves in the Authorisation Queue.' },
      { actor: 'System', action: 'Activates the account and posts Dr Teller Cash GL (TRN-GL-1001) / Cr Current Deposit Liability GL (TRN-GL-2002), credits CA000002, writes journal, leg and audit events.' },
    ],
    accounting: {
      debit: 'Teller Cash GL (TRN-GL-1001)',
      credit: 'Current Deposit Liability GL (TRN-GL-2002) — separate from the savings liability GL',
      note: 'Posted automatically on approval as an INITIAL_DEPOSIT transaction; balanced-journal invariant enforced.',
    },
    recordsCreated: ['Current account record (PENDING_AUTHORISATION → ACTIVE)', 'Authorisation request', 'Posted transaction + journal + lines', 'Transaction leg with balanceAfter', 'Audit events'],
    statusChanges: [
      'Account: (new) → PENDING_AUTHORISATION → ACTIVE',
      'Balances: 0 → opening amount',
      'Request: PENDING_AUTHORISATION → APPROVED',
    ],
    exceptions: [
      { error: 'Retail CIF for a current product', cause: 'Current accounts are corporate-only.', correction: 'Create a corporate CIF first (CIF-CORP-001) or use CIF000006.' },
      { error: 'Below minimum opening amount', cause: 'CUR-STD requires ₹10,000.00.', correction: 'Fund at least the minimum.' },
    ],
    recovery: 'Before approval: reject or return, nothing posts. After approval: only a controlled reversal (Phase 4) can undo the deposit.',
    practice: {
      login: 'maker01 (Maker@123), then checker01 (Checker@123)',
      role: 'Customer Service Maker → Operations Checker',
      customer: 'Demo Traders Private Limited', cif: 'CIF000006', account: 'New CA number — CA000002 on a fresh environment',
      balance: '-', amount: '₹25,000.00 (minimum ₹10,000.00)',
      expectedResult: 'CA000002 ACTIVE with ₹25,000.00; Current Deposit Liability GL (TRN-GL-2002) rises by ₹25,000.',
      verify: [VERIFY.ACCOUNT, VERIFY.CUSTOMER, VERIFY.AUDIT],
    },
  }),

  'ACCT-INQUIRY-001': concept({
    academyModule: 'accounts',
    concept: 'Account Inquiry is the read-only balance and activity view: ledger balance, available balance, lien, status (ACTIVE / DORMANT / FROZEN / PENDING_AUTHORISATION) and the posted transaction legs with running balanceAfter. It is how you prove that a posting really happened — after any financial practice you come here to verify.',
    branchScenario: 'A customer asks their balance; the officer opens the account and reads ledger vs available, explaining that the ₹20,000 difference on SB000007 is a lien. After practicing account opening, the officer opens the new SB/CA number here and sees the initial-deposit CREDIT leg with balanceAfter equal to the opening amount.',
    roles: [{ actor: 'Any employee (including auditor01, read-only)', responsibility: 'Views balances, status and transaction legs.' }],
    flow: [
      { actor: 'Employee', action: 'Searches by account number, CIF or customer name, opens the account and reviews the detail card plus the transaction table (each leg shows side, amount and balanceAfter, newest first).' },
    ],
    recordsCreated: ['None — inquiry only'],
    statusChanges: ['None'],
    exceptions: [
      { error: 'Ledger and available differ', cause: 'A lien earmarks part of the balance (SB000007: ₹80,000 ledger, ₹60,000 available).', correction: 'Not an error — check the lien amount.' },
      { error: 'Account shows PENDING_AUTHORISATION with zero balance', cause: 'Opening request submitted but not yet approved.', correction: 'Approve it in the queue; the balance appears when the deposit posts.' },
    ],
    recovery: 'Not applicable — inquiry never changes data.',
    practice: {
      login: 'any demo user, e.g. teller01 (Teller@123)',
      role: 'Any role', customer: 'Amit Sharma', cif: 'CIF000001',
      account: 'SB000001', balance: '₹1,00,000.00', amount: '-',
      expectedResult: 'Ledger = available = ₹1,00,000.00, status ACTIVE, no legs yet. After practicing ACCT-SAV-OPEN-001, open SB000008 here: ₹5,000.00 with one CREDIT leg (balanceAfter ₹5,000.00).',
      verify: ['Compare SB000007 to see a lien example', 'Open SB000008 after the account-opening journey to verify the posted deposit'],
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
    concept: 'A teller session binds a cash position to one teller for the business date. In the simulator this rule is real: TEL-CASH-DEPOSIT-001 and TEL-CASH-WITHDRAWAL-001 refuse to run until teller01 has an open session, and only one session per teller may be open at a time.',
    branchScenario: 'The teller arrives, receives the day\'s opening cash float, and opens the session declaring that amount. From now on every approved deposit adds and every approved withdrawal subtracts from the teller\'s system cash, tracked against their name.',
    roles: [
      { actor: 'teller01 — Teller', responsibility: 'Opens the session with the physical opening cash and owns the position until closure.' },
      { actor: 'tellerauthoriser01 — Teller Authoriser', responsibility: 'Reviews the position at closing time.' },
    ],
    flow: [
      { actor: 'Teller (teller01)', action: 'Opens the session with the opening cash (e.g. ₹50,000). System stores the session (OPEN, business date 2026-10-17) with systemCash = opening cash. Audit: TELLER_SESSION_OPENED.' },
      { actor: 'System', action: 'Unlocks cash operations for this teller; a second open attempt is blocked while one is open.' },
    ],
    recordsCreated: ['Teller session record (OPEN)', 'Audit event TELLER_SESSION_OPENED'],
    statusChanges: ['No session → OPEN'],
    exceptions: [
      { error: 'Session already open', cause: 'Duplicate open attempt while a session is OPEN.', correction: 'Use the existing session — one open session per teller.' },
      { error: 'Cash operation refused', cause: 'No open session for the teller.', correction: 'Open the session first — the banner on the cash screens links here.' },
    ],
    recovery: 'Opened with a wrong float? Close the session (with authoriser review) and reopen with the correct figure.',
    practice: {
      login: 'teller01 (Teller@123)',
      role: 'Teller', customer: '-', cif: '-', account: '-', balance: '-',
      amount: 'Opening cash ₹50,000.00',
      expectedResult: 'Session OPEN with systemCash ₹50,000.00; the cash screens stop showing the "no open session" warning.',
      verify: [VERIFY.TELLER_CASH, VERIFY.AUDIT],
    },
  }),

  'TEL-CASH-DEPOSIT-001': concept({
    academyModule: 'teller',
    concept: 'A cash deposit converts physical cash into a bank liability: the customer\'s balance and the teller\'s cash rise by the same amount. Live in the simulator: the teller submits with an optional denomination breakdown, the authoriser approves in the queue, and only then does the balanced journal post.',
    branchScenario: 'A customer hands ₹5,000 (2 x ₹2,000 + 2 x ₹500) over the counter for Neha Verma\'s account SB000002. teller01 counts, captures denominations, submits; tellerauthoriser01 approves; SB000002 becomes ₹55,000 and teller cash rises by ₹5,000.',
    roles: [
      { actor: 'Customer', responsibility: 'Hands over the cash.' },
      { actor: 'teller01 — Teller', responsibility: 'Counts cash, captures denominations (their total must equal the amount), submits. Needs an open teller session.' },
      { actor: 'tellerauthoriser01 — Teller Authoriser', responsibility: 'Approves in the Authorisation Queue; approval posts the journal and credits the account.' },
    ],
    flow: [
      { actor: 'Teller (teller01)', action: 'Selects the account, enters amount (product per-transaction limit applies: ₹2,00,000 for SAV-REG) and optional denominations, submits. Nothing moves yet — the request waits as PENDING_AUTHORISATION.' },
      { actor: 'Authoriser (tellerauthoriser01)', action: 'Reviews and approves.' },
      { actor: 'System', action: 'Posts Dr Teller Cash GL (TRN-GL-1001) / Cr Savings or Current Deposit Liability GL (TRN-GL-2001/2002), credits the account, adds the amount to the teller\'s session cash, writes transaction leg + journal + audit events.' },
    ],
    accounting: {
      debit: 'Teller Cash GL (TRN-GL-1001) — physical cash rises',
      credit: 'Deposit Liability GL (TRN-GL-2001 savings / TRN-GL-2002 current) — bank owes the customer more',
      note: 'The matching sub-ledger entry credits the customer account. Balanced-journal invariant enforced; each request posts exactly once.',
    },
    recordsCreated: ['Authorisation request (then POSTED transaction)', 'Balanced journal + lines', 'Transaction leg with balanceAfter', 'Teller session cash update', 'Audit events'],
    statusChanges: ['Request: PENDING_AUTHORISATION → APPROVED → transaction POSTED', 'Account balance: +amount', 'Teller session cash: +amount'],
    exceptions: [
      { error: 'No open teller session', cause: 'Teller did not open a session.', correction: 'Open one first (TEL-SESSION-OPEN-001).' },
      { error: 'Frozen / closed account', cause: 'Deposits blocked for FROZEN or CLOSED accounts (e.g. SB000006).', correction: 'The freeze needs authorised removal first.' },
      { error: 'Denomination mismatch', cause: 'Captured denominations do not total the amount.', correction: 'Recount and fix the breakdown, or clear it (capture is optional).' },
      { error: 'Above per-transaction limit', cause: 'Amount exceeds the product limit.', correction: 'Split the deposit or follow the high-value process.' },
    ],
    recovery: 'Before approval: reject or return, nothing posted. After approval: only a reversal (TXN-REVERSE-001) undoes it — the account is never edited directly.',
    practice: {
      login: 'teller01 (Teller@123), then tellerauthoriser01 (TellerAuth@123)',
      role: 'Teller → Teller Authoriser',
      customer: 'Neha Verma', cif: 'CIF000002', account: 'SB000002', balance: '₹50,000.00',
      amount: '₹5,000.00 (denominations: 2 x ₹2,000 + 2 x ₹500)',
      expectedResult: 'After approval: SB000002 = ₹55,000.00, Teller Cash GL +₹5,000, session systemCash +₹5,000.',
      verify: [VERIFY.ACCOUNT, VERIFY.TELLER_CASH, VERIFY.AUDIT],
    },
  }),

  'TEL-CASH-WITHDRAWAL-001': concept({
    academyModule: 'teller',
    concept: 'A cash withdrawal converts bank liability back into cash. The simulator enforces the real control chain at submission AND again at approval: account must be ACTIVE (dormant, frozen, debit-frozen and pending accounts are refused), the amount must fit the available balance (ledger minus lien), and product per-transaction and daily limits apply.',
    branchScenario: 'Amit Sharma withdraws ₹5,000 from SB000001. teller01 verifies the account and balance, submits; tellerauthoriser01 approves; cash is paid out. If the customer had spent the money through another channel while the request waited, approval is blocked — the checker sees the validation error and the request stays pending.',
    roles: [
      { actor: 'Customer', responsibility: 'Presents the withdrawal instruction and identity.' },
      { actor: 'teller01 — Teller', responsibility: 'Verifies status/balance/limits, submits; needs an open session.' },
      { actor: 'tellerauthoriser01 — Teller Authoriser', responsibility: 'Approves; the system re-validates before posting.' },
    ],
    flow: [
      { actor: 'Teller (teller01)', action: 'Selects the account and amount. Validation: status ACTIVE, amount ≤ available balance, ≤ per-transaction limit (₹2,00,000 for SAV-REG), and today\'s withdrawals plus this one ≤ daily limit (₹5,00,000 for SAV-REG).' },
      { actor: 'Authoriser (tellerauthoriser01)', action: 'Approves; the same checks run again against live data.' },
      { actor: 'System', action: 'Posts Dr Deposit Liability GL / Cr Teller Cash GL (TRN-GL-1001), debits the account (negative balances impossible), reduces the teller\'s session cash, writes leg + journal + audit events.' },
    ],
    accounting: {
      debit: 'Deposit Liability GL (TRN-GL-2001 savings / TRN-GL-2002 current) — bank owes less',
      credit: 'Teller Cash GL (TRN-GL-1001) — physical cash paid out',
      note: 'Sub-ledger: the customer account is debited; the posting service blocks anything that would take the available balance negative.',
    },
    recordsCreated: ['Authorisation request (then POSTED transaction)', 'Balanced journal + lines', 'Transaction leg with balanceAfter', 'Teller session cash update', 'Audit events'],
    statusChanges: ['Request: PENDING_AUTHORISATION → APPROVED → transaction POSTED', 'Account balance: −amount', 'Teller session cash: −amount'],
    exceptions: [
      { error: 'Debit-frozen / dormant / frozen account', cause: 'SB000003 (DEBIT_FROZEN), SB000005 (DORMANT), SB000006 (FROZEN) in training data.', correction: 'Do not pay; the status needs its own authorised change first.' },
      { error: 'Insufficient available balance', cause: 'Lien earmarks part of the ledger (SB000007: ₹80,000 ledger but only ₹60,000 available).', correction: 'Reduce the amount; the lien protects the rest.' },
      { error: 'Limit exceeded', cause: 'Per-transaction ₹2,00,000 / daily ₹5,00,000 for SAV-REG.', correction: 'Follow the high-value process.' },
      { error: 'Approval-time validation failure', cause: 'State changed while pending (funds left via another channel).', correction: 'The authoriser sees the error; the request stays pending for correction.' },
    ],
    recovery: 'A wrongly paid withdrawal is recovered through reversal (TXN-REVERSE-001) — if the money is already gone, the reversal itself is blocked (balance cannot go negative) and must be handled as an exception.',
    practice: {
      login: 'teller01 (Teller@123), then tellerauthoriser01 (TellerAuth@123)',
      role: 'Teller → Teller Authoriser',
      customer: 'Amit Sharma', cif: 'CIF000001', account: 'SB000001', balance: '₹1,00,000.00',
      amount: '₹5,000.00',
      expectedResult: 'After approval: SB000001 = ₹95,000.00, Teller Cash GL −₹5,000. Then try ₹70,000 from SB000007 and watch the lien rule block it.',
      verify: [VERIFY.ACCOUNT, VERIFY.TELLER_CASH, VERIFY.AUDIT],
    },
  }),

  'TEL-CASH-POSITION-001': concept({
    academyModule: 'teller',
    concept: 'The teller cash position is the live expected figure for the open session: opening float + posted deposits − posted withdrawals. In the simulator it is computed from real posted transactions, so it always matches what the journal says.',
    branchScenario: 'Mid-day, teller01 opens the position inquiry: opening ₹50,000, deposits ₹5,000, withdrawals ₹2,000 — expected drawer cash ₹53,000. The physical drawer must match before the day closes.',
    roles: [
      { actor: 'Teller (teller01)', responsibility: 'Views own position and past sessions with variance.' },
      { actor: 'Teller Authoriser / Auditor', responsibility: 'Reviews teller positions (read-only).' },
    ],
    flow: [{ actor: 'Teller', action: 'Opens the inquiry: stat cards show opening float, deposits, withdrawals and expected cash, plus the recent-session history with any variance.' }],
    recordsCreated: ['None — inquiry only'],
    statusChanges: ['None'],
    exceptions: [
      { error: 'No open session', cause: 'Inquiry without a session shows an empty state.', correction: 'Open a session first; positions only exist while a session is open.' },
    ],
    recovery: 'Not applicable — inquiry never changes data.',
    practice: {
      login: 'teller01 (Teller@123)',
      role: 'Teller', customer: '-', cif: '-', account: '-', balance: '-', amount: '-',
      expectedResult: 'After a ₹5,000 deposit and ₹2,000 withdrawal on a ₹50,000 float: expected cash ₹53,000.00.',
      verify: ['Cross-check against the Teller Cash GL movement in Audit Inquiry'],
    },
  }),

  'TEL-SESSION-CLOSE-001': concept({
    academyModule: 'teller',
    concept: 'Closing declares the day\'s physical cash against the system position, under maker-checker control. Live in the simulator: the teller declares the counted cash, the authoriser approves, and any difference is recorded as a variance AND raised as an exception — never silently adjusted.',
    branchScenario: 'End of day: teller01 counts ₹54,500 but the system expects ₹55,000. The authoriser approves the closing with the ₹500 shortfall recorded; an exception (TELLER_CASH_VARIANCE) is raised for investigation.',
    roles: [
      { actor: 'teller01 — Teller', responsibility: 'Counts the drawer and submits the declared cash with the close request.' },
      { actor: 'tellerauthoriser01 — Teller Authoriser', responsibility: 'Compares declared vs system expectation and approves the closing.' },
    ],
    flow: [
      { actor: 'Teller (teller01)', action: 'Opens the closing screen — it shows opening float, posted deposits/withdrawals and the system expectation — counts the drawer and submits the declared figure. Request waits as PENDING_AUTHORISATION.' },
      { actor: 'Authoriser (tellerauthoriser01)', action: 'Approves in the queue.' },
      { actor: 'System', action: 'Closes the session recording declaredCash, systemCash and variance; audits TELLER_SESSION_CLOSED; if variance ≠ 0, raises an exception record and audits EXCEPTION_RAISED.' },
    ],
    recordsCreated: ['Closed teller session with declared/system/variance figures', 'Exception record when variance ≠ 0', 'Audit events'],
    statusChanges: ['Session: OPEN → CLOSED (after approval)', 'Variance 0 → clean close; ≠ 0 → exception raised'],
    exceptions: [
      { error: 'Cash over/short', cause: 'Declared cash differs from the system position.', correction: 'The variance is recorded and an exception raised for investigation — the figures are never force-matched.' },
      { error: 'No open session', cause: 'Nothing to close.', correction: 'Only OPEN sessions can be closed.' },
    ],
    recovery: 'A wrong declaration discovered after closing is investigated through the exception record; sessions are not reopened retroactively.',
    practice: {
      login: 'teller01 (Teller@123), then tellerauthoriser01 (TellerAuth@123)',
      role: 'Teller → Teller Authoriser',
      customer: '-', cif: '-', account: '-', balance: 'Session cash position', amount: 'Declared cash — try ₹500 short once to see the exception',
      expectedResult: 'Session CLOSED. Clean count: variance ₹0. Short count: variance recorded and an exception visible to the authoriser.',
      verify: [VERIFY.TELLER_CASH, VERIFY.AUDIT],
    },
  }),

  // ===================================================== 4. PAYMENTS
  'PAY-INTERNAL-001': concept({
    academyModule: 'payments',
    concept: 'An internal transfer moves value between two accounts of the same bank. The bank\'s total deposits do not change — liability shifts from one customer to another. Live in the simulator: one approval posts one balanced journal and two account legs atomically.',
    branchScenario: 'Amit Sharma asks to move ₹10,000 to Neha Verma\'s SB000002. teller01 enters it; nothing moves while the request waits; tellerauthoriser01 approves and both balances update in the same posting — if either side fails validation, neither moves.',
    roles: [
      { actor: 'Customer', responsibility: 'Instructs the transfer with destination details.' },
      { actor: 'teller01 — Teller (maker)', responsibility: 'Submits the transfer; validation checks source status, destination status, available balance (lien-aware) and product limits.' },
      { actor: 'tellerauthoriser01 — Teller Authoriser', responsibility: 'Approves in the queue; the same checks re-run against live data before posting.' },
    ],
    flow: [
      { actor: 'Teller (teller01)', action: 'Picks source and destination (the screen lists live accounts with status and available balance), enters the amount and submits. Source must allow debits, destination must allow credits, source ≠ destination.' },
      { actor: 'Authoriser (tellerauthoriser01)', action: 'Reviews and approves.' },
      { actor: 'System', action: 'Posts Dr source liability GL / Cr destination liability GL, writes a DEBIT leg on the source and a CREDIT leg on the destination (each with balanceAfter), and audits everything.' },
    ],
    accounting: {
      debit: 'Source deposit liability GL (TRN-GL-2001 savings / TRN-GL-2002 current)',
      credit: 'Destination deposit liability GL (same mapping)',
      note: 'Savings-to-savings nets to zero inside TRN-GL-2001; savings-to-current moves value between TRN-GL-2001 and TRN-GL-2002. Total deposits unchanged either way.',
    },
    recordsCreated: ['Authorisation request → POSTED transaction', 'Balanced journal + lines', 'Two transaction legs with balanceAfter', 'Audit events'],
    statusChanges: ['Request: PENDING_AUTHORISATION → APPROVED → transaction POSTED', 'Source: −amount · Destination: +amount'],
    exceptions: [
      { error: 'Source and destination identical', cause: 'Same account on both sides.', correction: 'Correct the destination and resubmit.' },
      { error: 'Insufficient available balance', cause: 'Lien reduces availability (SB000007).', correction: 'Reduce the amount or decline.' },
      { error: 'Blocked status', cause: 'Debit-frozen source or frozen/closed destination.', correction: 'Resolve the status first; do not force the transfer.' },
    ],
    recovery: 'A wrong transfer is undone only through Transaction Reversal (TXN-REVERSE-001), which is live: the mirrored journal restores both balances and the original stays visible as REVERSED.',
    practice: {
      login: 'teller01 (Teller@123), then tellerauthoriser01 (TellerAuth@123)',
      role: 'Teller → Teller Authoriser',
      customer: 'Amit Sharma → Neha Verma', cif: 'CIF000001 → CIF000002',
      account: 'SB000001 → SB000002', balance: '₹1,00,000.00 → ₹50,000.00',
      amount: '₹10,000.00',
      expectedResult: 'SB000001 = ₹90,000.00; SB000002 = ₹60,000.00; one POSTED transaction with two legs visible in Transaction Inquiry.',
      verify: [VERIFY.ACCOUNT, VERIFY.TRANSACTION, VERIFY.AUDIT],
    },
  }),

  'PAY-NEFT-001': concept({
    academyModule: 'payments',
    concept: 'NEFT moves money to another bank through a deferred, batch-settled network. Live in the simulator: approval debits the customer into the Suspense GL (TRN-GL-9001) and records a simulated gateway message — the money has left the account but is parked awaiting settlement.',
    branchScenario: 'Demo Traders pays a supplier ₹50,000 from CA000001. teller01 captures the beneficiary (name, account, IFSC); tellerauthoriser01 approves; the account drops to ₹2,00,000, suspense rises by ₹50,000 and a NEFT_OUTWARD message (responseStatus SENT) is recorded with the request as its correlation id.',
    roles: [
      { actor: 'Customer', responsibility: 'Provides beneficiary name, account number and IFSC.' },
      { actor: 'teller01 — Teller (maker)', responsibility: 'Captures and submits; IFSC format and beneficiary fields are validated.' },
      { actor: 'tellerauthoriser01 — Teller Authoriser', responsibility: 'Approves; debit posts and the gateway message is recorded.' },
    ],
    flow: [
      { actor: 'Teller (teller01)', action: 'Submits source account + beneficiary + amount (status, balance and product limits checked; NEFT above ₹50,00,000 must go RTGS).' },
      { actor: 'Authoriser (tellerauthoriser01)', action: 'Approves after re-validation.' },
      { actor: 'System', action: 'Posts Dr source deposit liability / Cr Suspense (TRN-GL-9001), debits the account, and writes a NEFT_OUTWARD integration message (adapter NEFT_GATEWAY, responseStatus SENT) correlated to the request.' },
    ],
    accounting: {
      debit: 'Source deposit liability GL (TRN-GL-2001/2002)',
      credit: 'Suspense GL (TRN-GL-9001) — payable to settlement until the batch clears',
      note: 'Suspense is a temporary parking account and is treated as liability-side: credits increase it. Clearing suspense happens when settlement runs (Integration phase).',
    },
    recordsCreated: ['POSTED transaction + balanced journal', 'DEBIT leg on the source account', 'Integration message (SENT)', 'Audit events'],
    statusChanges: ['Request: PENDING_AUTHORISATION → APPROVED → POSTED', 'Message: (created) → SENT'],
    exceptions: [
      { error: 'Invalid IFSC', cause: 'Format must look like HDFC0001234 (4 letters, 0, 6 characters).', correction: 'Correct the IFSC and resubmit.' },
      { error: 'Beneficiary details incomplete', cause: 'Name under 3 characters or account under 6.', correction: 'Complete the beneficiary details.' },
      { error: 'Failed gateway message (seeded example)', cause: 'The seed data contains a MOCK_TIMEOUT failure for training.', correction: 'Integration Console retry/clearing arrives in Phase 8.' },
    ],
    recovery: 'Before approval: reject/return. After posting: reverse with TXN-REVERSE-001 — the mirrored entry credits the customer back and debits suspense.',
    practice: {
      login: 'teller01 (Teller@123), then tellerauthoriser01 (TellerAuth@123)',
      role: 'Teller → Teller Authoriser',
      customer: 'Demo Traders Private Limited', cif: 'CIF000006', account: 'CA000001', balance: '₹2,50,000.00',
      amount: '₹50,000.00 to "Supplier One", a/c 502000123456, IFSC HDFC0001234',
      expectedResult: 'CA000001 = ₹2,00,000.00; Suspense GL +₹50,000; a NEFT_OUTWARD message (SENT) recorded.',
      verify: [VERIFY.ACCOUNT, VERIFY.TRANSACTION, VERIFY.AUDIT],
    },
  }),

  'PAY-RTGS-001': concept({
    academyModule: 'payments',
    concept: 'RTGS is the high-value, immediately settled payment rail. Live in the simulator: identical mechanics to NEFT (debit customer, credit suspense, record a gateway message) but with a hard minimum of ₹2,00,000 — below that the system tells you to use NEFT instead.',
    branchScenario: 'Demo Traders pays a supplier ₹2,00,000 from CA000001 by RTGS. teller01 submits, tellerauthoriser01 approves, and the payment posts with an RTGS_OUTWARD message. Try ₹50,000 on the same screen: submission is refused — that value belongs on NEFT.',
    roles: [
      { actor: 'Customer (business)', responsibility: 'Instructs the high-value payment.' },
      { actor: 'teller01 — Teller (maker)', responsibility: 'Captures the payment; the ₹2,00,000 minimum and product limits are enforced at entry.' },
      { actor: 'tellerauthoriser01 — Teller Authoriser', responsibility: 'Approves; posting and the gateway message happen now.' },
    ],
    flow: [
      { actor: 'Teller (teller01)', action: 'Submits source + beneficiary + amount ≥ ₹2,00,000.' },
      { actor: 'Authoriser (tellerauthoriser01)', action: 'Approves after re-validation.' },
      { actor: 'System', action: 'Posts Dr source liability / Cr Suspense (TRN-GL-9001), debits the account, records an RTGS_OUTWARD message (adapter RTGS_GATEWAY, SENT) correlated to the request.' },
    ],
    accounting: { debit: 'Source deposit liability GL (TRN-GL-2001/2002)', credit: 'Suspense GL (TRN-GL-9001)' },
    recordsCreated: ['POSTED transaction + journal', 'DEBIT leg', 'Integration message (RTGS_OUTWARD, SENT)', 'Audit events'],
    statusChanges: ['Request: PENDING_AUTHORISATION → APPROVED → POSTED', 'Message → SENT'],
    exceptions: [
      { error: 'Below the RTGS minimum', cause: 'Amount under ₹2,00,000.', correction: 'Use NEFT for that value.' },
      { error: 'Invalid beneficiary/IFSC', cause: 'Same format rules as NEFT.', correction: 'Correct and resubmit.' },
    ],
    recovery: 'Reverse with TXN-REVERSE-001 if posted in error (customer recredited, suspense debited).',
    practice: {
      login: 'teller01 (Teller@123), then tellerauthoriser01 (TellerAuth@123)',
      role: 'Teller → Teller Authoriser',
      customer: 'Demo Traders Private Limited', cif: 'CIF000006', account: 'CA000001', balance: '₹2,50,000.00',
      amount: '₹2,00,000.00 (exactly the minimum)',
      expectedResult: 'CA000001 = ₹50,000.00; Suspense GL +₹2,00,000; RTGS_OUTWARD message (SENT) recorded.',
      verify: [VERIFY.ACCOUNT, VERIFY.TRANSACTION, VERIFY.AUDIT],
    },
  }),

  'PAY-SI-CREATE-001': concept({
    academyModule: 'payments',
    concept: 'A standing instruction is a customer mandate for recurring automatic transfers — rent, SIPs, EMIs. Live in the simulator: creation is maker-checker and non-financial; nothing moves until an execution posts.',
    branchScenario: 'Amit asks the bank to send ₹2,000 to Neha\'s SB000002 every month starting today (the training business date, 2026-10-17). teller01 records the mandate as PENDING_AUTHORISATION; tellerauthoriser01 approves; it becomes ACTIVE with nextDueDate = start date.',
    roles: [
      { actor: 'Customer', responsibility: 'Signs the recurring mandate.' },
      { actor: 'teller01 — Teller (maker)', responsibility: 'Creates the instruction (source, destination, amount, MONTHLY/QUARTERLY frequency, start date not in the past).' },
      { actor: 'tellerauthoriser01 — Teller Authoriser', responsibility: 'Approves; the mandate becomes ACTIVE.' },
    ],
    flow: MC_FLOW,
    recordsCreated: ['Standing instruction (PENDING_AUTHORISATION → ACTIVE)', 'Audit events'],
    statusChanges: ['PENDING_AUTHORISATION → ACTIVE', 'No balance movement at creation'],
    exceptions: [
      { error: 'Start date in the past', cause: 'The start date must not be before the business date (2026-10-17).', correction: 'Pick today or a future date.' },
      { error: 'Source = destination / unsupported frequency', cause: 'Same account both sides, or frequency outside MONTHLY/QUARTERLY.', correction: 'Fix the mandate and resubmit.' },
    ],
    practice: {
      login: 'teller01 (Teller@123), then tellerauthoriser01 (TellerAuth@123)',
      role: 'Teller → Teller Authoriser',
      customer: 'Amit Sharma → Neha Verma', cif: 'CIF000001 → CIF000002',
      account: 'SB000001 → SB000002', balance: '₹1,00,000.00', amount: '₹2,000.00 monthly from 2026-10-17',
      expectedResult: 'Mandate ACTIVE with nextDueDate 2026-10-17; balances unchanged until execution.',
      verify: [VERIFY.AUDIT],
    },
  }),

  'PAY-SI-EXECUTE-001': concept({
    academyModule: 'payments',
    concept: 'Execution turns a due standing instruction into a real internal transfer. In production this runs in a batch; live in the simulator a teller triggers it from the Standing Instruction screen, which lists every ACTIVE mandate due on or before the business date.',
    branchScenario: 'The Amit→Neha mandate (₹2,000 monthly, next due 2026-10-17) appears in the "due today" list. teller01 executes it, tellerauthoriser01 approves, and the transfer posts. Immediately after, nextDueDate advances to 2026-11-17 — a second execution the same day is refused: not due.',
    roles: [
      { actor: 'teller01 — Teller (maker)', responsibility: 'Selects a due mandate from the list and triggers execution.' },
      { actor: 'tellerauthoriser01 — Teller Authoriser', responsibility: 'Approves; the transfer posts and the schedule advances.' },
      { actor: 'System', action: 'Re-validates (status ACTIVE, nextDueDate ≤ business date, funds available) at submission and again at approval.' },
    ],
    flow: [
      { actor: 'Teller (teller01)', action: 'Opens Standing Instruction → Execute tab; the list shows only ACTIVE mandates due on or before the business date.' },
      { actor: 'Authoriser (tellerauthoriser01)', action: 'Approves the execution request.' },
      { actor: 'System', action: 'Posts the internal transfer, sets lastExecutedOn to the business date and advances nextDueDate by one period (monthly +1 month, quarterly +3).' },
    ],
    accounting: { debit: 'Source deposit liability GL', credit: 'Destination deposit liability GL (same journal as an internal transfer)' },
    recordsCreated: ['POSTED transaction + journal + legs', 'Mandate updated (lastExecutedOn, nextDueDate)', 'Audit events'],
    statusChanges: ['Mandate: ACTIVE (due) → ACTIVE (next due date advanced)', 'Source −amount · Destination +amount'],
    exceptions: [
      { error: 'Not due yet', cause: 'nextDueDate is after the business date.', correction: 'Wait for the due date; the mandate will appear in the list then.' },
      { error: 'Insufficient funds at execution', cause: 'Source balance fell below the amount.', correction: 'Fund the account and retry, or cancel the mandate.' },
    ],
    practice: {
      login: 'teller01 (Teller@123), then tellerauthoriser01 (TellerAuth@123)',
      role: 'Teller → Teller Authoriser',
      customer: 'Amit Sharma', cif: 'CIF000001', account: 'SB000001 → SB000002', balance: '₹1,00,000.00', amount: '₹2,000.00',
      expectedResult: 'SB000001 = ₹98,000.00; SB000002 = ₹52,000.00; mandate still ACTIVE with nextDueDate 2026-11-17; immediate re-execution refused.',
      verify: [VERIFY.ACCOUNT, VERIFY.TRANSACTION, VERIFY.AUDIT],
    },
  }),

  'PAY-SI-CANCEL-001': concept({
    academyModule: 'payments',
    concept: 'Cancellation stops a mandate. Future executions end immediately; past executions are history and stay untouched. Live in the simulator: cancellation is non-financial — the request carries no amount, and only the mandate status changes.',
    branchScenario: 'The customer moves out and cancels the Amit→Neha mandate. teller01 selects it on the Cancel tab, tellerauthoriser01 approves, and it becomes CANCELLED — it vanishes from the due list and any execution attempt is refused.',
    roles: [
      { actor: 'Customer', responsibility: 'Requests cancellation.' },
      { actor: 'teller01 — Teller (maker)', responsibility: 'Cancels the mandate (only ACTIVE mandates can be cancelled).' },
      { actor: 'tellerauthoriser01 — Teller Authoriser', responsibility: 'Approves; status flips to CANCELLED.' },
    ],
    flow: MC_FLOW,
    recordsCreated: ['Authorisation request (non-financial)', 'Mandate status update', 'Audit events'],
    statusChanges: ['ACTIVE → CANCELLED', 'No balance movement'],
    exceptions: [
      { error: 'Instruction not active', cause: 'Already cancelled or never approved.', correction: 'Only ACTIVE mandates accept cancellation.' },
    ],
    practice: {
      login: 'teller01 (Teller@123), then tellerauthoriser01 (TellerAuth@123)',
      role: 'Teller → Teller Authoriser',
      customer: 'Amit Sharma', cif: 'CIF000001', account: 'SB000001', balance: '-', amount: '-',
      expectedResult: 'Mandate CANCELLED; it no longer appears in the due list and execution is refused.',
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
    concept: 'The Authorisation Queue is where maker-checker lives, and in the simulator it is fully live: every request a maker submits (CIF creation, CIF modification, account opening) waits here until a checker decides. One rule is absolute and enforced by the engine, not by politeness — the maker can never decide their own request.',
    branchScenario: 'After every environment reset the queue already holds REQ-SEED-001: maker01 submitted a retail CIF for Karan Bedi (CIF000004) and it waits for a checker. Sign in as checker01, open the request, study the before/after detail card and decide. Your own requests appear in the list but are disabled and marked "Own request".',
    roles: [
      { actor: 'Maker (e.g. maker01)', responsibility: 'Submits requests and waits; their own rows are not decidable by them.' },
      { actor: 'Checker (e.g. checker01)', responsibility: 'Opens Review, examines the request detail, then Authorises, Rejects or Returns for correction — remarks are mandatory for Reject and Return.' },
      { actor: 'System (Authorisation Engine)', responsibility: 'Blocks self-authorisation, enforces remarks, prevents duplicate decisions, applies the business effect of approval and audits everything.' },
    ],
    flow: [
      { actor: 'Maker', action: 'Submits an operation; a request record with the full payload (and before/after values for modifications) becomes PENDING_AUTHORISATION.' },
      { actor: 'Checker', action: 'Opens the queue, clicks Review, reads the detail card and decides. Approve applies the effect immediately (a CIF turns ACTIVE; an account opening posts its deposit). Reject ends the request. Return sends it back to the maker.' },
      { actor: 'System', action: 'Records checker, decision, remarks and timestamp on the request; writes REQUEST_APPROVED / REJECTED / RETURNED to the audit trail; the decided request moves to the history table below the queue.' },
    ],
    recordsCreated: ['Decision stored on the request (checker, decision, remarks, decidedAt)', 'Audit event per decision', 'On approval: the operation\'s business effects (ACTIVE records, posted journals where financial)'],
    statusChanges: ['PENDING_AUTHORISATION → APPROVED / REJECTED / RETURNED_FOR_CORRECTION', 'RETURNED_FOR_CORRECTION → (maker resubmits) → PENDING_AUTHORISATION'],
    exceptions: [
      { error: 'Maker cannot authorise own request', cause: 'Same user submitted and tries to decide.', correction: 'A different authorised user must decide — by design; the engine throws NOT_AUTHORISED.' },
      { error: 'Remarks missing', cause: 'Reject/Return attempted without remarks.', correction: 'Remarks are mandatory for negative decisions.' },
      { error: 'Duplicate decision blocked', cause: 'Request already decided.', correction: 'Nothing to do — only PENDING_AUTHORISATION requests can be decided.' },
    ],
    recovery: 'Returned items go back to the maker for correction and resubmission; rejected items end and must be recreated if still needed.',
    practice: {
      login: 'checker01 (Checker@123)',
      role: 'Operations Checker',
      customer: 'Karan Bedi', cif: 'CIF000004', account: '-', balance: '-', amount: '-',
      expectedResult: 'Queue shows REQ-SEED-001 (retail CIF by maker01). Review and Authorise it → CIF000004 turns ACTIVE in Customer 360; the request appears in the history table as APPROVED.',
      verify: [VERIFY.CUSTOMER, VERIFY.AUDIT],
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
    concept: 'Transaction inquiry is the read-only truth-finder for money movement. Live in the simulator: search POSTED/REVERSED transactions by type, and open any of them to see the balanced journal lines and the account legs side by side.',
    branchScenario: 'A customer claims a double debit after a transfer. Any signed-in employee opens Transaction Inquiry, filters to INTERNAL_TRANSFER, and opens the transaction: the journal shows Dr TRN-GL-2001 / Cr TRN-GL-2001 (equal amounts — balanced), and the legs show exactly one DEBIT on SB000001 and one CREDIT on SB000002, each with the resulting balance.',
    roles: [
      { actor: 'Any employee (teller01, officer01, auditor01…)', responsibility: 'Searches transactions and opens the detail.' },
      { actor: 'auditor01 — Auditor', responsibility: 'Cross-checks the journal against the legs during review.' },
    ],
    flow: [
      { actor: 'Employee', action: 'Filters by transaction type (deposit, withdrawal, transfer, NEFT, RTGS, SI execution, reversal…).' },
      { actor: 'Employee', action: 'Opens a transaction: header (type, amount, narration, maker, business date), journal lines (GL, side, amount) and legs (account, side, balanceAfter).' },
    ],
    recordsCreated: ['None (inquiry only)'],
    statusChanges: ['None'],
    exceptions: [],
    practice: {
      login: 'any demo user (e.g. auditor01 — Audit@123)', role: 'Any role',
      customer: '-', cif: '-', account: 'SB000001', balance: '-', amount: '-',
      expectedResult: 'After running any Phase 2–4 operation, its transaction appears with matching journal lines and legs; debit total equals credit total.',
      verify: [VERIFY.TRANSACTION, VERIFY.JOURNAL, VERIFY.AUDIT],
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
    concept: 'Reversal is the only correct way to undo a wrong posting, and it is live in the simulator: the original transaction stays immutable as REVERSED, and a new linked transaction posts with every journal debit and credit mirrored. It has its own maker-checker cycle and a mandatory reason that becomes permanent audit evidence.',
    branchScenario: 'teller01 deposited ₹5,000 into the wrong account. teller01 initiates the reversal with the reason "Wrong account entered"; tellerauthoriser01 approves; the mirrored journal posts (Dr Deposit Liability / Cr Teller Cash), the account returns to ₹1,00,000, and the original transaction shows REVERSED with a link to its reversal.',
    roles: [
      { actor: 'teller01 — Teller (maker)', responsibility: 'Picks a POSTED transaction from the reversible list and submits with a mandatory reason.' },
      { actor: 'tellerauthoriser01 — Teller Authoriser', responsibility: 'Verifies the reason against the original and approves in the queue.' },
    ],
    flow: [
      { actor: 'Maker (teller01)', action: 'Selects the transaction (only POSTED, not-yet-reversed, non-reversal transactions are listed) and submits with a reason.' },
      { actor: 'Authoriser (tellerauthoriser01)', action: 'Approves in the Authorisation Queue.' },
      { actor: 'System', action: 'Posts a new transaction of type <original>_REVERSAL with every journal line and account leg mirrored, marks the original REVERSED (linked), moves the teller session cash back if it was a cash movement, and audits TRANSACTION_REVERSED.' },
    ],
    accounting: {
      debit: 'Mirror of every original CREDIT line',
      credit: 'Mirror of every original DEBIT line',
      note: 'The mirrored journal must balance too — the same engine invariant applies, so a reversal can never corrupt the books.',
    },
    recordsCreated: ['Reversal transaction (POSTED) linked from the original', 'Mirrored balanced journal + legs', 'Original marked REVERSED with reversedBy link', 'Audit events'],
    statusChanges: ['Original: POSTED → REVERSED', 'Reversal: (new) → POSTED', 'Balances and GLs return to pre-transaction state'],
    exceptions: [
      { error: 'Not reversible', cause: 'Transaction not POSTED, already reversed, or itself a reversal.', correction: 'It does not appear in the reversible list; only eligible transactions do.' },
      { error: 'Reason missing', cause: 'Reversal submitted without a reason.', correction: 'Reason is mandatory — it is permanent audit evidence.' },
      { error: 'Reversal blocked at approval', cause: 'The credited money was already spent; mirroring would take the account negative.', correction: 'The request stays pending; handle through the exception process instead.' },
    ],
    recovery: 'A reversal itself cannot be reversed — if the reversal was wrong, the correction is a fresh, correctly-entered transaction.',
    practice: {
      login: 'teller01 (Teller@123), then tellerauthoriser01 (TellerAuth@123)',
      role: 'Teller → Teller Authoriser',
      customer: 'Neha Verma', cif: 'CIF000002', account: 'SB000002', balance: '₹50,000.00 before the deposit',
      amount: '₹5,000.00 (first do a cash deposit, then reverse it)',
      expectedResult: 'After the reversal approval: SB000002 back to ₹50,000.00, Teller Cash GL restored, original transaction REVERSED with a linked CASH_DEPOSIT_REVERSAL.',
      verify: [VERIFY.ACCOUNT, VERIFY.AUDIT],
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
