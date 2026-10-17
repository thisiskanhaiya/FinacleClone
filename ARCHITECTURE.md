# Architecture

## Product structure

One Vue 3 + Vite project containing two applications with separate layouts:

- **Core Banking Simulator** (`/simulator`) — `SimulatorLayout` (header with global
  operation search, branch, business date, clock, user/role, pending authorisation
  count; left module navigation; bottom status bar with the LOCAL TRAINING
  ENVIRONMENT flag). It contains no training content, walkthroughs or theory.
- **Operations Academy** (`/academy`) — `AcademyLayout`, a separate application shell
  with its own navigation (9 concept modules + operations index). Public routes so
  the Academy can open in a second browser window next to the simulator. Content
  teaches banking concepts only; each operation concept page ends with a Simulator
  Practice box (demo credentials for the operation, test data, expected result,
  verification pointers).
- **Auth** — `AuthLayout` (login + about, both carrying the affiliation disclaimer
  and the Open Operations Academy link with `target="_blank"`).

## Layering rules

```
views / layouts / components   → presentation + interaction only (no banking logic)
stores (Pinia)                 → session/UI state, delegates to services
services                       → application use cases (auth, seed, search, audit, environment)
engine/                        → business rules: audit, workflow, authorisation,
                                 accounting, integration, day-end
domain/                        → enums, models, pure rules, validators, workflow map
repositories/                  → CollectionRepository over a storage adapter
data/                          → JSON seeds, operation registry, training scenarios
utils/                         → money (integer cents), ids, dates, keyboard, errors
```

A component never touches `localStorage` directly and never contains a banking rule;
it calls a service. An engine never touches the DOM or the router.

## Data layer seam (backend-ready)

`CollectionRepository` exposes an async CRUD interface (`findAll/findById/findWhere/
insert/upsert/update/remove/replaceAll/clear`) over an adapter:

- `LocalStorageAdapter` — durable training data (`cbte:` prefix)
- `SessionStorageAdapter` — the current login session (`cbte:session:` prefix)
- `MemoryStorageAdapter` — unit tests

A future `HttpStorageAdapter` implementing the same contract maps each collection
to a Spring Boot REST resource with zero changes above the repository layer
(see BACKEND_MIGRATION_GUIDE.md).

## Permission enforcement (defence in depth)

1. Router guard (`router/guards.js` → pure `decideNavigation`) — tested in isolation.
2. Operation search — results carry `authorised`; denied entries cannot be selected.
3. `BankingOperationEngine.assertLaunch` — service-level gate on operation start.
4. `AuthorisationEngine` — maker≠checker, capability check, mandatory remarks,
   no duplicate decisions.
5. `WorkflowEngine` — legal status transitions only.
6. Route denials are audited (`ROUTE_DENIED`).

## Folder structure

```
src/
  app/App.vue
  assets/styles/main.css
  components/{common,forms,tables,dialogs,operation,training}/
  layouts/{SimulatorLayout,TrainingLayout,AuthLayout}.vue
  views/
    auth/  errors/
    simulator/{dashboard,customer,accounts,teller,transfers,deposits,loans,
               servicing,authorisation,enquiries,generalLedger,dayEnd,administration}/
    academy/   (AcademyHome, AcademyModule, AcademyOperation, AcademyOperationsIndex)
  data/academyContent/   (modules.js concept curriculum, operationConcepts.js)
  domain/{models,enums,rules,validators,workflows}/
  engine/{BankingOperationEngine,WorkflowEngine,AuthorisationEngine,
          AccountingEngine,AuditEngine,IntegrationEngine,DayEndEngine}.js
  services/  repositories/  stores/  router/
  data/{seed,operationSpecifications,trainingScenarios}/
  utils/
tests/unit/
```

View folders for later phases (customer, teller, transfers, …) are created as those
phases land; Phase 1 implements dashboard, authorisation, enquiries, administration,
plus shared `ModuleOperationsView` and `OperationHostView` (registry-driven host that
maps implemented operation screens and renders an honest phase placeholder otherwise).

## Registries as the source of truth

`data/operationSpecifications/operations.js` defines all 69 operations with code,
name, module, keywords, route, allowedRoles, modes, makerChecker, financial flag,
difficulty and delivery phase. Navigation, search, catalogue, guides and guards all
read from this single registry.

## Audit

`AuditEngine` writes immutable events for login, logout, failed login, session
switch, environment seed/reset, operation launch, route denial, training progress
reset — and, in later phases, every workflow transition and posting.
