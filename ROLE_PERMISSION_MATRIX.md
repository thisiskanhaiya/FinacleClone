# Role-Permission Matrix

Enforced at: router guard · operation search · `BankingOperationEngine.assertLaunch` ·
service methods · `WorkflowEngine` transitions · `AuthorisationEngine` decisions ·
financial posting (from Phase 3). Hiding buttons is only the last, cosmetic layer.

Capabilities (see `src/domain/rules/permissionRules.js`):
MAKE_REQUEST, AUTHORISE_REQUEST, POST_FINANCIAL, TELLER_TRANSACT, RUN_DAY_END,
ADMINISTER, INQUIRE, VIEW_AUDIT.

## Capability matrix

| Role | MAKE | AUTHORISE | POST_FIN | TELLER | DAY_END | ADMIN | INQUIRE | AUDIT_VIEW |
|---|---|---|---|---|---|---|---|---|
| CUSTOMER_SERVICE_MAKER | ✔ | | | | | | ✔ | |
| OPERATIONS_CHECKER | | ✔ | | | | | ✔ | ✔ |
| TELLER | ✔ | | via workflow | ✔ | | | ✔ | |
| TELLER_AUTHORISER | | ✔ | | | | | ✔ | ✔ |
| DEPOSIT_MAKER | ✔ | | | | | | ✔ | |
| DEPOSIT_CHECKER | | ✔ | | | | | ✔ | ✔ |
| LOAN_OFFICER | ✔ | | | | | | ✔ | |
| LOAN_MANAGER | | ✔ | | | | | ✔ | ✔ |
| BRANCH_MANAGER | | ✔ | | | ✔ | | ✔ | ✔ |
| AUDITOR | | | | | | | ✔ | ✔ |
| SYSTEM_ADMIN | | | | | | ✔ | ✔ | ✔ |

## Per-module access (allowedRoles in the registry)

| Module / operation group | Roles |
|---|---|
| CIF create/modify, account opening | CUSTOMER_SERVICE_MAKER, OPERATIONS_CHECKER, BRANCH_MANAGER |
| CIF/Account/TD/EMI/Transaction inquiries | All roles (incl. AUDITOR) |
| Teller operations | TELLER, TELLER_AUTHORISER, BRANCH_MANAGER |
| Transfers & payments | TELLER, TELLER_AUTHORISER, BRANCH_MANAGER |
| Term deposits | DEPOSIT_MAKER, DEPOSIT_CHECKER, BRANCH_MANAGER |
| Loans | LOAN_OFFICER, LOAN_MANAGER, BRANCH_MANAGER |
| Loan sanction | LOAN_MANAGER, BRANCH_MANAGER |
| Freeze/lien/risk/dormancy servicing | OPERATIONS_CHECKER, BRANCH_MANAGER |
| Authorisation queue | OPERATIONS_CHECKER, TELLER_AUTHORISER, DEPOSIT_CHECKER, LOAN_MANAGER, BRANCH_MANAGER |
| Reversal | TELLER (maker), TELLER_AUTHORISER/BRANCH_MANAGER (checker) |
| Exception queue/resolution | OPERATIONS_CHECKER, BRANCH_MANAGER, AUDITOR (queue read-only) |
| GL inquiries | All roles; Trial balance: BRANCH_MANAGER, AUDITOR, SYSTEM_ADMIN, OPERATIONS_CHECKER |
| Integration console | OPERATIONS_CHECKER, BRANCH_MANAGER, AUDITOR, SYSTEM_ADMIN |
| Day end | BRANCH_MANAGER (TELLER_AUTHORISER: teller-closure validation) |
| Administration | SYSTEM_ADMIN only |

## Hard rules

- Maker can never authorise their own request (`AuthorisationEngine`).
- REJECT and RETURN decisions require remarks.
- AUDITOR is read-only: no create/modify/submit/approve/post anywhere.
- High-value transactions (above `highValueThreshold` in bank parameters) require
  BRANCH_MANAGER approval after TELLER_AUTHORISER approval (from Phase 4).
- Approved records cannot be silently modified: any change is a new workflow cycle.
