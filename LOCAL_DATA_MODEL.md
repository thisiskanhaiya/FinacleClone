# Local Data Model

All collections are JSON arrays in `localStorage` under the `cbte:` prefix, accessed
only through `CollectionRepository`. Sessions use `sessionStorage` (`cbte:session:`).
Seed files live in `src/data/seed/`; the loader is `src/services/seedService.js`.
Everything is fictional.

## Seeded collections

| Collection | Key fields | Seed highlights |
|---|---|---|
| employees | id, username, password, displayName, role, branch, status, isDemo | 11 demo users |
| customers | id/cif, name, type, segment, riskCategory, kycStatus, status, branch | Amit Sharma CIF000001, Neha Verma CIF000002, Raj Malhotra CIF000003, pending CIF000004, KYC-expired CIF000005, corporate CIF000006, Vikram Joshi CIF000007 |
| accounts | id/accountNumber, cif, productCode, category, ledgerBalance, availableBalance, lienAmount, status, branch | SB000001 ₹1,00,000 active · SB000002 ₹50,000 active · SB000003 ₹10,000 DEBIT_FROZEN · CA000001 current ₹2,50,000 · SB000004 KYC-expired owner · SB000005 DORMANT · SB000006 FROZEN · SB000007 lien ₹20,000 |
| products | productCode, accountCategory, minOpeningAmount, minBalance, interestRatePercent, perTransactionLimit, dailyLimit, dormancyMonths, makerCheckerRequired | SAV-REG, SAV-SAL, CUR-STD, TD-STD, LOAN-PL |
| branches | branchCode, name, cashLimit, tellerCashLimit, allowedProducts, status | BR001, HEAD-OFFICE |
| bankParameters | bankId, baseCurrency, businessDate, businessDateStatus, holidayCalendar, highValueThreshold | business date 2026-10-17, OPEN |
| glAccounts | code, name, category, balance | 10 training GLs (TRN-GL-*) |
| termDeposits | depositNumber, cif, principal, interestRatePercent, termMonths, maturesOn, status | FD000001 ACTIVE, FD000002 MATURED |
| loans | loanAccount, cif, principal, outstandingPrincipal, emiAmount, nextEmiDueOn, overdueAmount, status | LN000001 ACTIVE, LN000002 ACTIVE_OVERDUE |
| transactions | id, operationCode, type, account(s), amount, status, maker, checker, businessDate | one pending teller deposit, one pending transfer |
| integrationMessages | id, operation, adapter, responseStatus, responseCode, retryCount, correlationId | one FAILED mock NEFT message |

## Runtime collections (start empty)

standingInstructions · transactionLegs · journals · journalLines ·
authorisationRequests · tellerSessions · exceptions · auditEvents · notifications ·
receipts · trainingProgress

### auditEvents
`{ id, action, entityType, entityId, performedBy, performedByRole, branch,
businessDate, result, details, timestamp }` — immutable.

### authorisationRequests (from Phase 2)
`{ id, operationCode, makerId, status, summary, amount, payload, beforeValues,
afterValues, checkerId, decision, remarks, businessDate, createdAt, decidedAt }`

### transactions / journals (from Phase 3–4)
transactions: `{ id, operationCode, type, status, maker, checker, amount, currency,
accounts…, reversalOf, businessDate, createdAt, postedAt }`
journals: `{ id, transactionId, status }` + journalLines `{ journalId, glCode, side,
amount }` — Σ debit = Σ credit enforced.

### trainingProgress
`{ id, username, operationCode, scenarioId, status, startedAt, completedAt, attempts }`

## Storage keys and lifecycle

- First boot: `seedService.ensureSeeded()` writes seeds + `meta { seedVersion }` and
  audits `ENVIRONMENT_SEEDED`.
- Reset: wipes all `cbte:` collections, restores seeds, audits `ENVIRONMENT_RESET`.
- Version upgrades re-seed master data but preserve runtime practice data.
- The login session (`sessionStorage`) is never touched by reset.
