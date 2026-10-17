# Core Banking Training Environment

An independent, educational core-banking product made of **two completely separate
experiences** in one Vue 3 project:

- **Core Banking Simulator** (`/simulator`) — a pure employee workstation: login,
  operation search, dashboard, customer/account/teller/FD/loan/inquiry operations,
  authorisation queue, reports, audit and day end. It contains **no training content,
  walkthroughs or theory** — it behaves like production banking software.
- **Operations Academy** (`/academy`) — banking *concept* learning in its own
  application shell and navigation, opened in a separate browser window via the
  **Open Operations Academy** link on the sign-in page (`target="_blank"`). The
  Academy explains the business (what a CIF is, what happens during a cash
  withdrawal, how a journal balances) and ends every operation page with a
  **Simulator Practice** box: the demo credentials for that operation, the exact
  fictional training data, the expected result and where to verify it.

> **Disclaimer:** Independent educational core-banking simulator using fictional data.
> Not affiliated with or endorsed by any bank, Infosys or Finacle. Operation codes
> (e.g. `CIF-CREATE-001`) are training-system codes, not Finacle menu codes.

## Current status

**Phase 4 (Transfers and payments) is complete**, on top of the teller and
onboarding phases. Twenty-one operations now run end to end:

- *Phase 2*: Create Retail/Corporate CIF, Modify Customer, Customer 360, Open
  Savings/Current Account, Account Inquiry — with live queue decisions.
- *Phase 3*: Open Teller Session (`TEL-SESSION-OPEN-001`), Cash Deposit
  (`TEL-CASH-DEPOSIT-001`) and Cash Withdrawal (`TEL-CASH-WITHDRAWAL-001`) with
  denomination capture, freeze/dormant/lien/limit checks enforced at submission
  and again at approval; Teller Cash Inquiry (`TEL-CASH-POSITION-001`); Teller
  Cash Closing (`TEL-SESSION-CLOSE-001`) with declared-vs-system variance that
  raises an exception record; and Transaction Reversal (`TXN-REVERSE-001`) with
  mirrored compensating journals and an immutable REVERSED link.
- *Phase 4*: Internal Fund Transfer (`PAY-INTERNAL-001`) with one balanced
  two-leg posting; NEFT (`PAY-NEFT-001`) and RTGS (`PAY-RTGS-001`) outward
  payments that debit the customer into the Suspense GL and record a simulated
  gateway message (RTGS enforces the ₹2,00,000 minimum); Standing Instructions
  (`PAY-SI-CREATE/EXECUTE/CANCEL-001`) with a due list, date advancement and
  non-financial cancellation; and Transaction Inquiry (`TXN-INQUIRY-001`)
  showing balanced journal lines next to account legs.

See "Build phases" below for what later phases add.

## Installation

```bash
npm install
```

## Commands

```bash
npm run dev       # start the Vite dev server
npm run build     # production build into dist/
npm run preview   # serve the production build
npm test          # run the Vitest unit suite (140 tests)
```

## Demo credentials (fictional, local only)

| Username | Password | Role | Branch |
|---|---|---|---|
| maker01 | Maker@123 | Customer Service Maker | BR001 |
| checker01 | Checker@123 | Operations Checker | BR001 |
| teller01 | Teller@123 | Teller | BR001 |
| tellerauthoriser01 | TellerAuth@123 | Teller Authoriser | BR001 |
| depositmaker01 | Deposit@123 | Deposit Maker | BR001 |
| depositchecker01 | Deposit@123 | Deposit Checker | BR001 |
| loanofficer01 | Loan@123 | Loan Officer | BR001 |
| loanmanager01 | Loan@123 | Loan Manager | BR001 |
| manager01 | Manager@123 | Branch Manager | BR001 |
| auditor01 | Audit@123 | Auditor (read-only) | BR001 |
| admin01 | Admin@123 | System Administrator | HEAD-OFFICE |

The same credentials are shown on the login page (collapsible panel), inside every
training scenario, and under Administration → Demo User Management.

A development-only **Switch Demo User** action on the dashboard ends the current
session (audited) and creates a newly audited session for the chosen demo user.
Role checks still apply.

## Modules

Customers (CIF), Accounts, Teller Operations, Transfers and Payments, Term Deposits,
Loans, Account Servicing, Authorisation, Enquiries, Exception Queue, General Ledger,
Integration Console, Reports, Day End, Administration. Concept learning lives only in
the separate Operations Academy (`/academy`).

## Learning workflow

1. Sign in to the simulator, or open the **Operations Academy** in a new window from
   the sign-in page.
2. In the Academy, pick a concept module (Customer & CIF … Day End) or search the
   All Operations Index.
3. Read the concept page: business concept, branch scenario, roles, end-to-end flow,
   accounting flow, records, statuses, exceptions, recovery.
4. Use the **Simulator Practice** box: it lists the exact demo credentials for that
   operation (maker first, then authoriser), the test customer/account/amount, the
   expected result and the inquiry screens to verify with.
5. Switch to the simulator window and perform the operation for real.
6. Verify balances, statuses, journals and audit events; reset the environment as
   `admin01` when you want a clean slate.

Global operation search: press `/` to focus the header search, `Ctrl+K` for the
command palette. Search accepts operation codes, names, keywords and module names,
and flags operations your role cannot run ("Not authorised for your current role").

## Data reset

Sign in as `admin01` → Administration → Reset Training Data (`ADMIN-RESET-001`).
This wipes all local collections, restores the fictional seed data and writes an
audited `ENVIRONMENT_RESET` event. Your current session is preserved.

## Data storage

All training data lives in `localStorage` under the `cbte:` prefix; the login
session lives in `sessionStorage`. Everything survives a browser refresh. There is
no backend, database or network call in Version 1.

## Known limitations (Phase 4)

- Twenty-one operations are executable end to end (list under "Current status");
  every other registry operation still renders an honest placeholder with its
  delivery phase.
- Posting covers initial deposits, teller cash movements, reversals, internal
  transfers and outward NEFT/RTGS payments (customer debit into Suspense).
  FD and loan movements arrive in Phase 5–6.
- Outward gateway messages are recorded as SENT with a correlation id; the
  Integration Console (retry/clearing) arrives in Phase 8. Suspense clearing is
  not yet an operation.
- Teller cash is tracked per session against a single branch Teller Cash GL;
  vault and inter-teller transfers are not modelled yet.
- Demo passwords are stored in plain text in seed JSON by design (local fictional
  training tool). Never reuse these credentials anywhere real.

## Future Spring Boot integration

The data layer sits behind `CollectionRepository` + storage adapter interfaces.
Replacing the local adapter with an HTTP adapter pointing at a Spring Boot API
requires no changes in services, engines, stores or views.
See [BACKEND_MIGRATION_GUIDE.md](BACKEND_MIGRATION_GUIDE.md).

## Documentation

- [ARCHITECTURE.md](ARCHITECTURE.md) — layers, folder structure, design rules
- [OPERATION_CATALOGUE.md](OPERATION_CATALOGUE.md) — all 69 operations
- [ROLE_PERMISSION_MATRIX.md](ROLE_PERMISSION_MATRIX.md) — who can do what
- [WORKFLOW_MATRIX.md](WORKFLOW_MATRIX.md) — journeys and status transitions
- [ACCOUNTING_POSTING_MATRIX.md](ACCOUNTING_POSTING_MATRIX.md) — Dr/Cr per operation
- [TRAINING_SCENARIOS.md](TRAINING_SCENARIOS.md) — journeys and guide structure
- [LOCAL_DATA_MODEL.md](LOCAL_DATA_MODEL.md) — collections and seed data
- [TESTING_GUIDE.md](TESTING_GUIDE.md) — test strategy and manual verification
- [BACKEND_MIGRATION_GUIDE.md](BACKEND_MIGRATION_GUIDE.md) — Spring Boot path

## Build phases

1. **Foundation** ✅ — architecture, auth, sessions, registry, search, permissions, audit, seed/reset
2. Customer & account journey (CIF create/verify, account opening, inquiries + guides)
3. Teller (session, deposit, withdrawal, cash position, closure + guides)
4. Transfers (internal/NEFT/RTGS, posting, journals, full transfer scenario)
5. Term deposits · 6. Loans · 7. Servicing & control (freeze/lien/KYC/reversal)
8. GL, integrations, reporting · 9. Day end · 10. Hardening
