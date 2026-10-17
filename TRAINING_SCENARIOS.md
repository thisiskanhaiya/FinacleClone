# Training Scenarios (Operations Academy)

Educational material lives ONLY in the Operations Academy (`/academy`), a separate
application shell that opens in its own browser window. The Core Banking Simulator
contains no training content.

## Academy information architecture

- `/academy` — home: the 9 concept modules and how the Academy relates to the simulator.
- `/academy/modules/{module}` — concept topics per domain, plus the operations of that domain.
- `/academy/operations` — searchable index of all 69 operations.
- `/academy/operations/{code}` — the concept page for one operation, with ten sections:
  1. **Business Concept** — what the operation means to the bank
  2. **Real Branch Scenario** — what physically happens at the branch
  3. **Roles Involved** — customer, teller/maker, checker/authoriser, manager
  4. **End-to-End Business Flow** — request → validation → approval → posting
  5. **Accounting Flow** — debit and credit GL categories (financial ops)
  6. **Records Created** — customer/account/transaction/journal/audit artefacts
  7. **Status Changes** — the visible state flow
  8. **Exception Scenarios** — error, cause, correction
  9. **Recovery** — return, reject, reverse, reset paths
  10. **Simulator Practice** — see below

## Simulator Practice box (every operation)

| Field | Source |
|---|---|
| Credentials for this operation | Derived from the operation's allowedRoles mapped to the fictional demo employees, ordered Maker → Authoriser → inquiry-only, with username, password, role and branch |
| Sign-in sequence | The exact order of logins, e.g. `teller01`, then `tellerauthoriser01` |
| Training data | Customer, CIF, account, balance, amount from the fictional seed dataset |
| Expected result | Balances/statuses after the operation |
| How to verify | The simulator inquiry screens (Account/Transaction/Journal/Audit) |

## Reference practice scenario: internal fund transfer

`PAY-INTERNAL-001` — teller01 submits ₹5,000.00 from SB000001 (Amit Sharma,
₹1,00,000.00) to SB000002 (Neha Verma, ₹50,000.00) → PENDING_AUTHORISATION →
tellerauthoriser01 approves in the Authorisation Queue → POSTED with a balanced
journal → SB000001 = ₹95,000.00, SB000002 = ₹55,000.00. Verified via Account
Inquiry, Transaction Inquiry, Journal Inquiry and Audit Inquiry. Reversal
(TXN-REVERSE-001) restores both balances while keeping the original immutable.

## Data hygiene

The simulator's `admin01` → Reset Training Data (`ADMIN-RESET-001`) restores the
fictional seed dataset so every Academy scenario starts from the documented numbers.
