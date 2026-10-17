/**
 * Operations Academy - concept curriculum.
 *
 * The Academy teaches BANKING CONCEPTS (what a CIF is, why maker-checker
 * exists, what happens to money during a cash withdrawal). It never explains
 * screens. Screen execution lives only in the Core Banking Simulator, which
 * is a separate experience. Each concept page ends with a "Simulator
 * Practice" pointer (operation code, demo login, test data, verification).
 */

export const ACADEMY_MODULES = Object.freeze([
  {
    key: 'customer-cif',
    number: 1,
    title: 'Customer & CIF',
    summary: 'What a customer means to a bank, why every relationship starts with a CIF, and how KYC, risk and nominees govern the lifecycle.',
    topics: [
      {
        id: 'what-is-a-customer',
        title: 'What is a customer?',
        body: [
          'A customer is a person or business with whom the bank has a relationship. Before any account can be opened or money moved, the bank must know exactly who it is dealing with — this is a legal requirement, not a formality.',
          'In a core banking system the customer exists independently of accounts. One customer may hold many accounts; one account may have several holders. The customer record is the anchor.',
        ],
      },
      {
        id: 'what-is-cif',
        title: 'What is a CIF?',
        body: [
          'CIF (Customer Information File) is the single master record of a customer inside the bank. It holds identity, contact, KYC, risk and relationship data, and every account, deposit and loan references its CIF number.',
          'Because the CIF is the root of everything, creating or changing it is a controlled operation: one employee enters it (maker) and a different employee approves it (checker).',
        ],
      },
      {
        id: 'customer-lifecycle',
        title: 'Customer lifecycle',
        body: [
          'Draft → pending verification → active → (changes over life: KYC refresh, address, nominee, risk) → eventually closed or deceased-settled.',
          'A customer who is not yet approved cannot hold new accounts. A customer with expired KYC may be restricted until refreshed.',
        ],
      },
      {
        id: 'retail-vs-corporate',
        title: 'Retail and corporate customers',
        body: [
          'Retail customers are individuals. Corporate customers are businesses; their CIF carries the entity details and authorised signatories instead of a single person.',
          'Product eligibility, limits and documentation differ between the two.',
        ],
      },
      {
        id: 'kyc',
        title: 'KYC (Know Your Customer)',
        body: [
          'KYC is the verified identity and address evidence of the customer. Banks must periodically refresh it; when KYC expires the bank restricts what the customer can do until it is updated.',
          'In training data, Sunita Rao (CIF000005) has expired KYC — she is the example used in the KYC update practice.',
        ],
      },
      {
        id: 'risk-categories',
        title: 'Risk categories',
        body: [
          'Banks classify customers as low, medium or high risk based on profile, occupation and behaviour. Higher risk means more scrutiny, more frequent KYC refresh and sometimes senior approval for changes.',
        ],
      },
      {
        id: 'nominee',
        title: 'Nominee',
        body: [
          'A nominee is the person who receives the funds if the account holder dies. Nomination is a customer-service change and follows the same maker-checker discipline as any other master-data change.',
        ],
      },
      {
        id: 'customer-360',
        title: 'Customer 360',
        body: [
          'Customer 360 is the read-only consolidated view: identity plus every account, deposit, loan and recent transaction. Staff use it constantly at the counter before acting on anything.',
        ],
      },
      {
        id: 'live-journey-cif',
        title: 'Live journey: onboard a customer end to end',
        body: [
          'This module\'s operations are LIVE in the simulator — you can perform the full journey now. As maker01 (Maker@123) run Create Retail CIF (CIF-CREATE-001) for a new fictional customer: validation runs (name, phone, ID proof, address; duplicate check on name + phone), the CIF is created as PENDING_AUTHORISATION and a request enters the Authorisation Queue.',
          'Then sign in as checker01 (Checker@123), open the Authorisation Queue (AUT-QUEUE-001), review the request\'s before/after card and Authorise. The CIF turns ACTIVE with KYC COMPLETE. Verify in Customer 360 Inquiry (CIF-INQUIRY-001) and Audit Inquiry (ENQ-AUDIT-001).',
          'Also live: Modify Customer (CIF-MODIFY-001) — only phone, email, address and segment are changeable, the request stores exact before/after values, and nothing applies until a checker approves. Try the negative paths too: submit with no changes (blocked), or try to authorise your own request (blocked — that is maker-checker working).',
        ],
      },
    ],
  },
  {
    key: 'accounts',
    number: 2,
    title: 'Accounts',
    summary: 'Savings vs current accounts, overdrafts, and the states that control money movement: dormant, frozen, lien, interest and charges.',
    topics: [
      {
        id: 'savings-account',
        title: 'Savings account',
        body: [
          'A deposit account for individuals that earns interest and usually carries a minimum balance rule. It is the most common product at a branch counter.',
        ],
      },
      {
        id: 'current-account',
        title: 'Current account',
        body: [
          'A business transaction account: high volumes, no interest, higher minimum balance, and overdraft eligibility. In the training data, Demo Traders Private Limited operates CA000001.',
        ],
      },
      {
        id: 'overdraft',
        title: 'Overdraft',
        body: [
          'An overdraft lets an account go negative up to an agreed limit. Interest is charged on the used portion only. It is a lending feature bolted onto a deposit account.',
        ],
      },
      {
        id: 'dormant-account',
        title: 'Dormant account',
        body: [
          'An account with no customer-initiated activity for a long period (defined by product rules) becomes dormant. Dormancy protects against fraud: withdrawals are restricted until the customer re-validates.',
        ],
      },
      {
        id: 'frozen-account',
        title: 'Frozen account',
        body: [
          'Freezing blocks money movement: a debit freeze stops outgoing money, a credit freeze stops incoming money, a full freeze stops both. Freezes are used for court orders, suspected fraud or disputes, and every freeze/unfreeze is authorised and audited.',
        ],
      },
      {
        id: 'lien',
        title: 'Lien',
        body: [
          'A lien earmarks part of the balance so it cannot be used — for example as security for a loan or a dispute. The ledger balance stays the same; the available balance drops. SB000007 in training data carries a ₹20,000 lien.',
        ],
      },
      {
        id: 'interest-and-charges',
        title: 'Interest and charges',
        body: [
          'Deposit interest is an expense for the bank, credited periodically. Charges (minimum balance, cheque books, closures) are income. Both post through the GL like any other movement.',
        ],
      },
      {
        id: 'live-journey-account-opening',
        title: 'Live journey: open an account and watch money post',
        body: [
          'Account opening is LIVE and financial. As maker01 (Maker@123) run Open Savings Account (ACCT-SAV-OPEN-001): pick Neha Verma (CIF000002), product SAV-REG, amount ₹5,000. Eligibility is real — CIF must be ACTIVE with KYC COMPLETE, retail customers only, amount at least the ₹1,000 product minimum. The account is created PENDING_AUTHORISATION with a zero balance and the next SB number (SB000008 on a fresh environment).',
          'As checker01 (Checker@123), authorise it in the queue. Approval is the posting trigger: the account turns ACTIVE and the system posts Dr Teller Cash GL (TRN-GL-1001) / Cr Savings Deposit Liability GL (TRN-GL-2001) for ₹5,000, credits the account and writes the transaction leg, balanced journal and audit events.',
          'Verify in Account Inquiry (ACCT-INQUIRY-001): ledger = available = ₹5,000 with one CREDIT leg showing balanceAfter ₹5,000. The current-account twin (ACCT-CUR-OPEN-001) is live too — corporate CIFs only (use CIF000006), ₹10,000 minimum, CA numbering, and it credits the Current Deposit Liability GL (TRN-GL-2002) instead.',
        ],
      },
    ],
  },
  {
    key: 'teller',
    number: 3,
    title: 'Teller Operations',
    summary: 'The cash counter: sessions, deposits, withdrawals, cash balancing and the teller day close.',
    topics: [
      {
        id: 'teller-session',
        title: 'Teller session',
        body: [
          'A teller cannot touch cash until a session is opened: the system issues an opening cash position to that teller and holds them accountable for it until closure.',
        ],
      },
      {
        id: 'cash-deposit',
        title: 'Cash deposit',
        body: [
          'The customer hands over cash; the teller counts it and credits the account. Bank cash rises, the customer liability balance rises. The journal is Dr Teller Cash / Cr Customer Deposit.',
        ],
      },
      {
        id: 'cash-withdrawal',
        title: 'Cash withdrawal',
        body: [
          'The bank first verifies the account exists, is active, has sufficient available balance, and carries no debit freeze or blocking lien. Only then is cash paid out. Customer balance falls, bank cash falls: Dr Customer Deposit / Cr Teller Cash.',
        ],
      },
      {
        id: 'cash-balancing',
        title: 'Cash balancing',
        body: [
          'At any moment the teller can check the expected cash position: opening cash + deposits − withdrawals ± transfers. The physical drawer must match the system figure.',
        ],
      },
      {
        id: 'teller-day-close',
        title: 'Teller day close',
        body: [
          'Closing a session declares the physical cash, is validated against the system position and requires authoriser approval. An open teller session blocks day end.',
        ],
      },
      {
        id: 'live-journey-teller',
        title: 'Live journey: run the cash counter end to end',
        body: [
          'The whole teller cycle is LIVE in the simulator. As teller01 (Teller@123): open a session (TEL-SESSION-OPEN-001) with a ₹50,000 float — cash screens refuse to work without it. Then submit a cash deposit (TEL-CASH-DEPOSIT-001) of ₹5,000 into SB000002 with denominations 2 x ₹2,000 + 2 x ₹500, and a cash withdrawal (TEL-CASH-WITHDRAWAL-001) of ₹2,000 from SB000001.',
          'As tellerauthoriser01 (TellerAuth@123), approve both in the Authorisation Queue. Each approval posts a balanced journal (deposit: Dr Teller Cash / Cr Deposit Liability; withdrawal: the mirror), moves the account balance and updates the teller\'s session cash. Check Teller Cash Inquiry (TEL-CASH-POSITION-001): expected drawer cash ₹53,000, computed from live postings.',
          'Finish with Teller Cash Closing (TEL-SESSION-CLOSE-001): declare the counted cash; the authoriser approves, and any variance is recorded as an exception, never force-matched. Then try the controls: withdraw from dormant SB000005 (blocked), withdraw ₹70,000 from liened SB000007 (blocked — only ₹60,000 is available), and reverse the deposit with TXN-REVERSE-001 to watch balances restore while history stays immutable.',
        ],
      },
    ],
  },
  {
    key: 'payments',
    number: 4,
    title: 'Payments',
    summary: 'Moving money: internal transfers, NEFT and RTGS simulations, and standing instructions.',
    topics: [
      {
        id: 'internal-transfer',
        title: 'Internal transfer',
        body: [
          'Both accounts live in the same bank, so the bank simply re-labels liability: Dr source customer deposit / Cr destination customer deposit. No cash, no external network.',
          'No balance moves at entry time in a maker-checker setup — the request waits for an authoriser, and only approval triggers posting.',
        ],
      },
      {
        id: 'neft',
        title: 'NEFT',
        body: [
          'NEFT is a deferred, batch-settled retail payment network. The bank debits the customer immediately into a suspense/settlement account and releases the outward message to the gateway; settlement happens in batches.',
        ],
      },
      {
        id: 'rtgs',
        title: 'RTGS',
        body: [
          'RTGS is for high-value, immediately-settled payments — in India it carries a minimum amount (₹2,00,000), below which a payment belongs on NEFT.',
        ],
      },
      {
        id: 'standing-instructions',
        title: 'Standing instructions',
        body: [
          'A standing instruction is a recurring scheduled transfer (rent, SIP, EMI to own account). It is created once with maker-checker control and executed on each due date — in production by a batch; here you trigger it by hand to see the mechanics.',
        ],
      },
      {
        id: 'live-journey-payments',
        title: 'Live journey: move money end to end',
        live: true,
        body: [
          'Phase 4 makes this module executable. Run it with teller01 (maker) and tellerauthoriser01 (checker), then inspect with auditor01:',
          '1. Internal transfer: teller01 moves ₹10,000 from SB000001 to SB000002 — one approval, one balanced journal, two legs. Nothing moves while the request waits.',
          '2. NEFT: teller01 pays ₹50,000 from CA000001 to a beneficiary (IFSC HDFC0001234). Approval debits the account into Suspense (TRN-GL-9001) and records a NEFT_OUTWARD gateway message (SENT).',
          '3. RTGS: same flow, but the ₹2,00,000 minimum applies — try ₹50,000 first and read the refusal, then send ₹2,00,000 successfully.',
          '4. Standing instruction: create a ₹2,000 monthly mandate SB000001 → SB000002 (start today, 2026-10-17), approve it ACTIVE, execute it from the due list — watch nextDueDate jump to 2026-11-17 — then cancel it.',
          '5. Trace everything: Transaction Inquiry shows each POSTED transaction with its journal lines and legs; Audit Trail records every submission and decision.',
        ],
      },
    ],
  },
  {
    key: 'deposits',
    number: 5,
    title: 'Term Deposits',
    summary: 'Fixed deposits: creation, maturity, renewal, premature closure and normal closure.',
    topics: [
      {
        id: 'fd-creation',
        title: 'FD creation',
        body: [
          'Money moves from the customer\'s operative account into a fixed deposit for a locked term at an agreed rate: Dr funding deposit / Cr term deposit liability. A deposit receipt with a maturity date and maturity amount is produced.',
        ],
      },
      {
        id: 'fd-maturity',
        title: 'FD maturity',
        body: [
          'On the maturity date the deposit falls due: principal plus interest returns to the operative account (Dr TD liability + Dr interest expense / Cr customer deposit) unless the customer chose renewal.',
        ],
      },
      {
        id: 'fd-renewal',
        title: 'FD renewal',
        body: [
          'Renewal rolls the matured proceeds into a new deposit at the current rate for a new term, without the money touching the operative account.',
        ],
      },
      {
        id: 'fd-closure',
        title: 'FD closure',
        body: [
          'Closure after maturity pays out the proceeds and ends the deposit. Records remain for audit even after closure.',
        ],
      },
      {
        id: 'fd-premature',
        title: 'Premature closure',
        body: [
          'Breaking a deposit early normally costs the customer: interest is recalculated at a lower rate for the actual period, and a penalty may apply. This is why premature closure always needs authorisation.',
        ],
      },
    ],
  },
  {
    key: 'loans',
    number: 6,
    title: 'Loans',
    summary: 'The lending lifecycle: application, assessment, sanction, disbursement, EMI, overdue handling and closure.',
    topics: [
      {
        id: 'loan-application',
        title: 'Application',
        body: ['A loan begins as a request: customer, product, amount, purpose. Nothing is owed yet; the application is just data awaiting assessment.'],
      },
      {
        id: 'loan-assessment',
        title: 'Assessment',
        body: ['The officer evaluates repayment capacity — income, obligations, credit history — and records a recommendation. Assessment creates the evidence for the sanction decision.'],
      },
      {
        id: 'loan-sanction',
        title: 'Sanction',
        body: ['Sanction is the credit decision by an empowered manager: approved amount, rate, term and conditions. The officer who assessed cannot sanction their own file.'],
      },
      {
        id: 'loan-disbursement',
        title: 'Disbursement',
        body: ['Disbursement creates the asset: Dr Loan Principal / Cr customer account. From this moment interest accrues and the repayment schedule is active.'],
      },
      {
        id: 'emi',
        title: 'EMI',
        body: ['The equated monthly instalment blends principal and interest. Each recovery splits the collection: the interest part is income, the principal part reduces the loan asset.'],
      },
      {
        id: 'overdue',
        title: 'Overdue',
        body: ['A missed due date makes the instalment overdue; penal interest may accrue and the account is flagged for follow-up. LN000002 in training data has an overdue EMI.'],
      },
      {
        id: 'loan-closure',
        title: 'Closure',
        body: ['When principal, interest and charges are all recovered, the loan closes. Foreclosure is early full repayment, usually with a recalculated figure and sometimes a charge.'],
      },
    ],
  },
  {
    key: 'control',
    number: 7,
    title: 'Control & Authorisation',
    summary: 'Why banks never trust one person: maker-checker, approvals, audit, reversals and exceptions.',
    topics: [
      {
        id: 'maker-checker',
        title: 'Maker-checker',
        body: [
          'Every sensitive action is split: one employee enters (maker), a different employee approves (checker). The maker can never approve their own request. This single rule prevents most internal fraud.',
        ],
      },
      {
        id: 'approval',
        title: 'Approval, rejection, return',
        body: [
          'The checker compares the request against source data and either approves, rejects (with mandatory remarks) or returns it for correction (also with remarks) so the maker can fix and resubmit.',
        ],
      },
      {
        id: 'audit',
        title: 'Audit trail',
        body: [
          'Every login, launch, decision and posting writes an immutable audit event: who, what, when, business date, before/after values. Auditors are read-only by design.',
        ],
      },
      {
        id: 'reversal',
        title: 'Reversal',
        body: [
          'A wrong posted transaction is never edited or deleted. A new, linked reversal transaction is created (with its own maker-checker cycle) that mirrors the original journal, restoring balances while preserving history.',
        ],
      },
      {
        id: 'exceptions',
        title: 'Exceptions',
        body: [
          'Anything the system cannot complete cleanly — a failed gateway message, an unbalanced journal, a stuck request — lands in an exception queue for controlled resolution instead of being silently dropped.',
        ],
      },
      {
        id: 'live-queue',
        title: 'Live: decide real requests in the Authorisation Queue',
        body: [
          'The Authorisation Queue (AUT-QUEUE-001) is LIVE with full decision power. After every environment reset it contains REQ-SEED-001 — maker01\'s retail CIF for Karan Bedi (CIF000004) waiting for a checker.',
          'Sign in as checker01 (Checker@123), click Review, read the before/after detail card and decide: Authorise applies the business effect (the CIF turns ACTIVE), Reject ends the request, Return sends it back to the maker for correction and resubmission. Remarks are mandatory for negative decisions, your own requests are marked "Own request" and disabled, and a decided request can never be decided twice.',
          'Every decision writes an audit event (REQUEST_APPROVED / REJECTED / RETURNED) with maker, checker, remarks and business date — check Audit Inquiry (ENQ-AUDIT-001) afterwards. This queue is the control point for every maker-checker operation you practice.',
        ],
      },
    ],
  },
  {
    key: 'accounting',
    number: 8,
    title: 'Accounting',
    summary: 'Double-entry bookkeeping inside a bank: GL, journals, debits, credits, suspense and office accounts.',
    topics: [
      {
        id: 'gl',
        title: 'General Ledger (GL)',
        body: ['The GL is the bank\'s own books. Customer balances are sub-ledgers; every customer movement also hits GL categories such as Teller Cash, Deposit Liability, Loan Asset, Interest Income.'],
      },
      {
        id: 'journal',
        title: 'Journal',
        body: ['A journal is one balanced accounting event: header plus lines. A posted transaction always produces exactly one journal with at least one debit and one credit line.'],
      },
      {
        id: 'debit-credit',
        title: 'Debit and credit',
        body: [
          'For the bank, customer deposits are liabilities: paying in credits the liability, paying out debits it. Loans are assets: disbursement debits the loan asset.',
          'The unbreakable rule: total debits must equal total credits. The simulator blocks any unbalanced journal from posting.',
        ],
      },
      {
        id: 'suspense',
        title: 'Suspense',
        body: ['Suspense accounts temporarily park money whose final destination is not yet known — for example an outward NEFT awaiting gateway acknowledgement. Suspense must be reviewed and cleared, never left to grow.'],
      },
      {
        id: 'office-account',
        title: 'Office accounts',
        body: ['Office accounts are internal bank accounts (cash, suspense, income, expense) as opposed to customer accounts. Inquiry into them is how branch staff reconcile internal positions.'],
      },
    ],
  },
  {
    key: 'day-end',
    number: 9,
    title: 'Day End',
    summary: 'Business dates, day-end validation, batch events, interest and EMI processing, reports and closing the day.',
    topics: [
      {
        id: 'business-date',
        title: 'Business date',
        body: ['The bank runs on its own calendar. All posting carries a business date, which may differ from the system clock, and only one business date is open at a time.'],
      },
      {
        id: 'day-end',
        title: 'Day end',
        body: ['Day end is the controlled shutdown of the business date: everything pending must be authorised, posted, resolved or consciously carried forward before the date can close.'],
      },
      {
        id: 'batch',
        title: 'Batch processing',
        body: ['Bulk events that do not need a human per item — FD maturities due, EMI due processing, standing instruction execution — run as batch steps during day end.'],
      },
      {
        id: 'eod-prechecks',
        title: 'EOD pre-checks',
        body: ['Pending authorisations, unposted transactions, open teller sessions, unbalanced journals, failed integration messages, unresolved exceptions: each one blocks or warns before closure.'],
      },
      {
        id: 'interest-emi-processing',
        title: 'Interest posting & EMI processing',
        body: ['Periodic interest application and due-EMI marking happen as dated events so that balances on any business date are reproducible.'],
      },
      {
        id: 'eod-reports',
        title: 'Day-end reports',
        body: ['The day closes with reports: transaction summary, journal/trial balance proof and exception list. A closed business date can never be closed twice.'],
      },
    ],
  },
]);

export const ACADEMY_MODULES_BY_KEY = Object.freeze(
  Object.fromEntries(ACADEMY_MODULES.map((m) => [m.key, m])),
);

export function getAcademyModule(key) {
  return ACADEMY_MODULES_BY_KEY[key] ?? null;
}
