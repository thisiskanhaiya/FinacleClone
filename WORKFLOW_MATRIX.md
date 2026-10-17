# Workflow Matrix

## Canonical request lifecycle (WorkflowEngine)

```
DRAFT ──▶ VALIDATED ──▶ PENDING_AUTHORISATION ──▶ APPROVED ──▶ POSTED (financial)
  │             │                    │                             or ACTIVE (master data)
  │             │                    ├──▶ RETURNED_FOR_CORRECTION ──▶ RESUBMITTED ──▶ PENDING_AUTHORISATION
  │             │                    └──▶ REJECTED
  └──▶ CANCELLED ◀── (from DRAFT / VALIDATED / RETURNED / RESUBMITTED)

POSTED ──▶ REVERSED   (only via a linked reversal transaction; original stays immutable)
```

Invariants:
- Financial posting happens only at APPROVED → POSTED.
- Duplicate submission and duplicate approval are blocked (`assertSubmittable`,
  `assertDecidable`).
- Every transition writes an audit event with maker, checker, timestamps,
  business date, remarks and before/after values.

## End-to-end journeys

### 1. Customer onboarding (Phase 2)
CIF-CREATE-001 (maker01) → AUT-QUEUE-001 verify/approve (checker01) → customer ACTIVE →
CIF-INQUIRY-001.

### 2. Savings account opening (Phase 2)
Active CIF → ACCT-SAV-OPEN-001 (maker01) → checker approval → account ACTIVE →
initial deposit (TEL-CASH-DEPOSIT-001) → ACCT-INQUIRY-001.

### 3. Teller cash (Phase 3)
TEL-SESSION-OPEN-001 (teller01) → TEL-CASH-DEPOSIT-001 / TEL-CASH-WITHDRAWAL-001 →
tellerauthoriser01 approves controlled transactions → TEL-CASH-POSITION-001 →
TEL-SESSION-CLOSE-001 → closure approval.

### 4. Internal fund transfer (Phase 4 — reference scenario)
teller01: PAY-INTERNAL-001 SB000001 → SB000002, ₹5,000.00 → PENDING_AUTHORISATION
(no balance movement yet) → tellerauthoriser01 approves in AUT-QUEUE-001 →
AccountingEngine posts balanced journal → POSTED → balances 95,000.00 / 55,000.00 →
verify via ACCT-INQUIRY-001, TXN-INQUIRY-001, GL-JOURNAL-INQUIRY-001, ENQ-AUDIT-001.
Negative variants: same account, insufficient funds, debit-frozen source, closed
destination, duplicate submission, self-authorisation, reject, return, reversal.

### 5. Fixed deposit (Phase 5)
TD-CREATE-001 (depositmaker01) → depositchecker01 approves → funding account debited →
FD ACTIVE → TD-MATURITY-001 / TD-RENEW-001 / TD-PREMATURE-001 / TD-CLOSE-001.

### 6. Loan (Phase 6)
LOAN-APPLY-001 → LOAN-ASSESS-001 (loanofficer01) → LOAN-SANCTION-001 (loanmanager01) →
LOAN-DISBURSE-001 (officer submits, manager authorises) → EMI schedule →
LOAN-EMI-RECOVER-001 → LOAN-CLOSE-001.

### 7. Account servicing (Phase 7)
CIF-KYC-001 / CIF-ADDRESS-001 / CIF-NOMINEE-001 → freeze/unfreeze/lien/release →
ACCT-CLOSE-001; recovery via TXN-REVERSE-001 and TXN-EXCEPTION-001.

### 8. Day end (Phase 9, manager01)
EOD-PRECHECK-001 (pending authorisations, unposted transactions, open teller sessions,
unbalanced journals, failed integrations, maturing FDs, due EMIs, exceptions) →
EOD-TELLER-001 → EOD-BATCH-001 (FD events, EMI events, standing instructions) →
EOD-REPORT-001 → EOD-CLOSE-001. A closed business date can never be closed twice.
