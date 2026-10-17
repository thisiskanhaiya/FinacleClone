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

Later phases add: CIF/account validators, transfer atomicity, duplicate posting,
FD maturity, EMI calculation/recovery, reversal, day-end duplicate prevention,
scenario preparation and completion verification.

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
