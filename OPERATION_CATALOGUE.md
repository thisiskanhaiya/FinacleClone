# Operation Catalogue

69 operations. Source of truth: `src/data/operationSpecifications/operations.js`.
Codes are training-system codes, **not** Finacle menu codes.
MC = maker-checker required · FIN = posts accounting entries.

## CUSTOMER (Phase 2)
| Code | Name | Modes | MC | FIN | Difficulty |
|---|---|---|---|---|---|
| CIF-CREATE-001 | Create Retail CIF | ADD, INQUIRE | ✔ | | Beginner |
| CIF-CORP-001 | Create Corporate CIF | ADD, INQUIRE | ✔ | | Intermediate |
| CIF-MODIFY-001 | Modify Customer | MODIFY, INQUIRE | ✔ | | Beginner |
| CIF-INQUIRY-001 | Customer 360 Inquiry | INQUIRE | | | Beginner |

## ACCOUNTS (Phase 2)
| Code | Name | Modes | MC | FIN | Difficulty |
|---|---|---|---|---|---|
| ACCT-SAV-OPEN-001 | Open Savings Account | ADD, INQUIRE | ✔ | | Beginner |
| ACCT-CUR-OPEN-001 | Open Current Account | ADD, INQUIRE | ✔ | | Intermediate |
| ACCT-INQUIRY-001 | Account Inquiry | INQUIRE | | | Beginner |

## SERVICING (Phase 7)
CIF-KYC-001 Update KYC · CIF-NOMINEE-001 Add/Modify Nominee · CIF-ADDRESS-001 Change Address ·
CIF-RISK-001 Update Risk Classification · ACCT-CLOSE-001 Close Account (FIN) ·
ACCT-FREEZE-001 / ACCT-UNFREEZE-001 · ACCT-DEBIT-FREEZE-001 / ACCT-CREDIT-FREEZE-001 ·
ACCT-LIEN-001 / ACCT-LIEN-RELEASE-001 · ACCT-DORMANT-001 Dormancy Processing.
All maker-checker.

## TELLER (Phase 3 — live, executable end to end)
| Code | Name | MC | FIN |
|---|---|---|---|
| TEL-SESSION-OPEN-001 | Open Teller Session | | |
| TEL-CASH-DEPOSIT-001 | Cash Deposit | ✔ | ✔ |
| TEL-CASH-WITHDRAWAL-001 | Cash Withdrawal | ✔ | ✔ |
| TEL-CASH-POSITION-001 | Teller Cash Inquiry | | |
| TEL-SESSION-CLOSE-001 | Teller Cash Closing | ✔ | |

## TRANSFERS (Phase 4 — live, executable end to end)
PAY-INTERNAL-001 Internal Fund Transfer (MC, FIN) · PAY-NEFT-001 NEFT Simulation (MC, FIN, suspense + gateway message) ·
PAY-RTGS-001 RTGS Simulation (MC, FIN, ₹2,00,000 minimum) · PAY-SI-CREATE-001 / PAY-SI-EXECUTE-001 (MC, FIN) /
PAY-SI-CANCEL-001 Standing Instructions (MC).

## TERM_DEPOSITS (Phase 5)
TD-CREATE-001 (MC, FIN) · TD-INQUIRY-001 · TD-MATURITY-001 (MC, FIN) · TD-RENEW-001 (MC, FIN) ·
TD-PREMATURE-001 (MC, FIN) · TD-CLOSE-001 (MC, FIN).

## LOANS (Phase 6)
LOAN-APPLY-001 · LOAN-ASSESS-001 · LOAN-SANCTION-001 (manager decision) ·
LOAN-DISBURSE-001 (MC, FIN) · LOAN-EMI-INQUIRY-001 · LOAN-EMI-RECOVER-001 (MC, FIN) ·
LOAN-PARTPAY-001 (MC, FIN) · LOAN-PRECLOSE-001 (MC, FIN) · LOAN-OVERDUE-001 · LOAN-CLOSE-001 (MC, FIN).

## AUTHORISATION
AUT-QUEUE-001 Authorisation Queue (checker roles; Phase 2) · AUT-INQUIRY-001 Authorisation Inquiry (all roles; Phase 8).

## ENQUIRIES
TXN-INQUIRY-001 Transaction Inquiry (**live in Phase 4**; journal lines + legs) · TXN-FAILED-001 Failed Transaction Inquiry (Phase 7) ·
ENQ-AUDIT-001 Audit Inquiry (**live in Phase 1**).

## EXCEPTIONS (Phase 3/7)
TXN-REVERSE-001 Transaction Reversal (MC, FIN) — pulled forward to Phase 3, live with mirrored-journal posting · TXN-EXCEPTION-001 Exception Resolution (Phase 7) · EXC-QUEUE-001 Exception Queue (Phase 7).

## GENERAL_LEDGER (Phase 8)
GL-JOURNAL-INQUIRY-001 · GL-ACCOUNT-INQUIRY-001 · GL-TRIAL-BALANCE-001 · GL-SUSPENSE-001 · GL-OFFICE-ACCOUNT-001.

## INTEGRATION (Phase 8)
INT-CONSOLE-001 Integration Console (mock adapters only).

## REPORTS (Phase 8)
RPT-BRANCH-001 Branch Operations Report.

## DAY_END (Phase 9, Branch Manager)
EOD-PRECHECK-001 · EOD-TELLER-001 · EOD-BATCH-001 · EOD-CLOSE-001 · EOD-REPORT-001.

## ADMINISTRATION (SYSTEM_ADMIN)
ADMIN-USERS-001 Demo User Management (**live Phase 1**) · ADMIN-PARAMS-001 Parameter Management (Phase 8) ·
ADMIN-RESET-001 Reset Training Data (**live Phase 1**).
