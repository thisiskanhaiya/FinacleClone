# Core Banking Training Environment

An independent, educational core-banking training product that combines two deeply
connected applications in one Vue 3 project:

- **Branch Operations Simulator** (Application A) — enterprise, employee-operated
  branch banking console with maker-checker authorisation, double-entry posting,
  audit trail and day-end processing.
- **Bank Operations Workbook** (Application B) — a practical training manual where
  each simulator operation has a dedicated guide page (`/training/operations/{code}`)
  with demo credentials, training data, walkthrough steps and live verification.

> **Disclaimer:** Independent educational core-banking simulator using fictional data.
> Not affiliated with or endorsed by any bank, Infosys or Finacle. Operation codes
> (e.g. `CIF-CREATE-001`) are training-system codes, not Finacle menu codes.

## Current status

**Phase 1 (Foundation) is complete.** See "Build phases" below for what each phase adds.

## Installation

```bash
npm install
```

## Commands

```bash
npm run dev       # start the Vite dev server
npm run build     # production build into dist/
npm run preview   # serve the production build
npm test          # run the Vitest unit suite (67 tests)
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
Integration Console, Reports, Day End, Administration — plus the cross-application
Bank Operations Workbook.

## Training workflow

1. Open **Bank Operations Workbook** and pick an operation in the catalogue.
2. Read the guide: purpose, demo credentials, exact training data, preconditions.
3. Launch the operation from the guide into the simulator.
4. Perform it as the maker; log out; approve/reject/return as the checker.
5. Verify balances, statuses, journals and audit events via inquiry screens.
6. Reset the scenario (or the whole environment) and practise again.

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

## Known limitations (Phase 1)

- Executable operation screens are delivered per phase; Phase 1 ships the framework
  (auth, permissions, registry, search, audit, seed/reset) with honest placeholders
  showing each operation's identity and delivery phase.
- Demo passwords are stored in plain text in seed JSON by design (local fictional
  training tool). Never reuse these credentials anywhere real.
- AccountingEngine ships the balancing invariant only; posting arrives in Phase 3–4.
- Integration adapters are planned mocks (Phase 8); no real integrations exist.

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
