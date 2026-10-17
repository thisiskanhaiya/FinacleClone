# Testing Guide

## Automated tests (Vitest, jsdom)

`npm test` — 67 unit tests across 10 suites:

| Suite | Covers |
|---|---|
| money.test.js | decimal-safe cents math, INR formatting, invalid input |
| permissionRules.test.js | capability map, auditor read-only, maker/checker split, admin-only |
| operationsRegistry.test.js | 69 unique operations, mandatory fields, valid roles/modes/modules, spec-required codes |
| operationSearchService.test.js | code/name/keyword/module matching, "transfer" triple, role flagging, auditor view |
| workflowEngine.test.js | legal/illegal transitions, duplicate submission & approval guards |
| authorisationEngine.test.js | self-authorisation block, capability check, mandatory remarks, pending-only decisions |
| accountingEngine.test.js | balancing invariant, multi-line journals, float-safe totals |
| authService.test.js | login/logout/session persistence, failed-login audit, demo switch auditing, 11 demo roles |
| seedService.test.js | first-boot seeding, idempotency, full reset + audit, session preservation, mandated seed data |
| routeGuard.test.js | public routes, login redirect, role meta, dynamic operation guard, auditor boundaries |

Conventions: pure domain/engine logic is tested directly; services are tested with
`MemoryStorageAdapter`; guard logic is tested via the pure `decideNavigation`.

Phase 2 adds `phase2Validators.test.js` (CIF/account-opening validators, ID
sequences) and `phase2Workflows.test.js` (full maker-checker journeys executed
against the real repositories: CIF create/modify/approve, self-authorisation
block, reject/return/resubmit, account opening with balanced journal posting,
GL movement, duplicate-posting prevention, unbalanced-journal rejection).

Later phases add: transfer atomicity, FD maturity, EMI calculation/recovery,
reversal, day-end duplicate prevention, scenario preparation and completion
verification.

## Manual verification (Phase 2)

1. Sign in as `maker01` / `Maker@123` → open **Create Retail CIF** (search `cif`
   or press `Ctrl+K`). Fill the form and submit → green panel shows the new
   request ID and pending CIF (`CIF000008`).
2. Sign in as `checker01` / `Checker@123` → **Authorisation Queue** shows the
   request plus the seeded `REQ-SEED-001` (Karan Bedi). Click **Review** → the
   before/after detail card renders → **Authorise**.
3. Back as `maker01`, open **Customer 360 Inquiry** → the new customer is ACTIVE
   with KYC COMPLETE.
4. Negative path: as `maker01` submit a CIF, stay signed in, open the queue deep
   link → your own request shows "Own request" and cannot be decided
   (self-authorisation blocked; attempts are audited).
5. As `maker01`, open **Open Savings Account** → select `CIF000002` (Neha Verma),
   product `SAV-REG`, amount `5000.00` → submit. As `checker01`, authorise it.
6. Open **Account Inquiry** (`SB000008`): status ACTIVE, ledger 5,000.00, one
   CREDIT leg with balanceAfter 5,000.00. Audit Inquiry shows
   `TRANSACTION_POSTED`, `JOURNAL_POSTED` and `BALANCE_UPDATED`.
7. As `checker01`, try rejecting a request without remarks → the decision is
   blocked with a validation error; with remarks it succeeds.
8. As `admin01`, reset the environment → CIF000008/SB000008 disappear and the
   seeded pending request returns.

## Manual verification (Phase 1)

1. `npm install && npm run dev`, open the printed URL.
2. Login page shows the disclaimer and the collapsible demo-credentials panel.
3. Sign in as `teller01` / `Teller@123` → dashboard loads with stats and status bar
   (`LOCAL TRAINING ENVIRONMENT`, branch BR001, business date, session user).
4. Press `/`, type `transfer` → three transfer operations appear, all selectable
   for a teller. Type `Create Retail CIF` → it appears flagged
   "Not authorised for your current role" and cannot be opened.
5. Press `Ctrl+K`, browse recent/favourites, star an operation.
6. Open Customers in the left nav as teller01 → module page shows locked operations.
7. Deep-link to `/simulator/operations/CIF-CREATE-001` as teller01 → 403 page;
   the denial appears in Audit Inquiry.
8. Sign in as `checker01` → Authorisation Queue shows the two seeded pending items.
9. Sign in as `auditor01` → Administration is hidden/locked; Audit Inquiry works;
   `/simulator/operations/ADMIN-RESET-001` → 403.
10. Sign in as `admin01` → Administration → Reset Training Data → confirm →
    success message; Audit Inquiry then shows a single `ENVIRONMENT_RESET` event.
11. Refresh the browser mid-session → you stay signed in (sessionStorage); close the
    tab and reopen → you must sign in again.
12. Logout → Audit Inquiry shows LOGIN and LOGOUT events for the user.
