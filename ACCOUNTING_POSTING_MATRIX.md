# Accounting Posting Matrix

Educational double-entry only. GL codes are **training** codes (`TRN-GL-*`),
not official bank GL codes.

## Training GL categories (seeded)

| Code | Name | Type |
|---|---|---|
| TRN-GL-1001 | Teller Cash GL | Asset |
| TRN-GL-2001 | Savings Deposit Liability GL | Liability |
| TRN-GL-2002 | Current Deposit Liability GL | Liability |
| TRN-GL-2003 | Term Deposit Liability GL | Liability |
| TRN-GL-3001 | Loan Principal Asset GL | Asset |
| TRN-GL-3002 | Interest Receivable GL | Asset |
| TRN-GL-4001 | Interest Income GL | Income |
| TRN-GL-5001 | Interest Expense GL | Expense |
| TRN-GL-4002 | Charges Income GL | Income |
| TRN-GL-9001 | Suspense GL | Suspense |

## Posting rules per operation

| Operation | Debit | Credit |
|---|---|---|
| TEL-CASH-DEPOSIT-001 | TRN-GL-1001 Teller Cash | TRN-GL-2001/2002 Deposit Liability |
| TEL-CASH-WITHDRAWAL-001 | TRN-GL-2001/2002 Deposit Liability | TRN-GL-1001 Teller Cash |
| PAY-INTERNAL-001 | Source deposit liability (TRN-GL-2001/2002) | Destination deposit liability (TRN-GL-2001/2002) |
| PAY-NEFT-001 / PAY-RTGS-001 | Source deposit liability | TRN-GL-9001 Suspense (outward, until mock gateway ack) |
| TD-CREATE-001 | Funding deposit liability | TRN-GL-2003 Term Deposit Liability |
| TD-MATURITY-001 | TRN-GL-2003 + TRN-GL-5001 Interest Expense | Customer deposit liability |
| TD-PREMATURE-001 | TRN-GL-2003 + TRN-GL-5001 (reduced interest) | Customer deposit liability + TRN-GL-4002 (penalty as charges income) |
| LOAN-DISBURSE-001 | TRN-GL-3001 Loan Principal Asset | Customer deposit liability |
| LOAN-EMI-RECOVER-001 | Customer deposit liability | TRN-GL-3001 (principal part) + TRN-GL-4001 (interest part) |
| LOAN-PARTPAY-001 / LOAN-PRECLOSE-001 | Customer deposit liability | TRN-GL-3001 (+ TRN-GL-4001 interest, + TRN-GL-4002 charges if configured) |
| ACCT-CLOSE-001 (balance payout) | Deposit liability | TRN-GL-1001 Teller Cash |
| Charges (any) | Customer deposit liability | TRN-GL-4002 Charges Income |
| TXN-REVERSE-001 | Mirror image of the original journal | Mirror image of the original journal |

## Invariants

- Σ debits = Σ credits in integer cents before posting; otherwise posting is blocked
  (`AccountingEngine.assertBalanced`, unit-tested).
- Every posted operation creates: transaction, transaction legs, journal header,
  journal lines, audit events, balance updates and an operation response.
- Reversal never edits the original journal; it posts a new linked journal.
- Posting occurs only at APPROVED → POSTED in the workflow.
