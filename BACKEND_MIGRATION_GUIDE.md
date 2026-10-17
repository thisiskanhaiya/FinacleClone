# Backend Migration Guide (Spring Boot)

Version 1 is deliberately backend-free. Every data access goes through
`CollectionRepository`, which is async and storage-agnostic. Migration keeps all
services, engines, stores and views unchanged.

## Mapping

| Local concept | Spring Boot counterpart |
|---|---|
| `cbte:<collection>` in localStorage | REST resource `/api/<collection>` |
| `CollectionRepository.findAll/findById/findWhere` | `GET /api/<collection>`, `GET /api/<collection>/{id}`, `GET` with query params |
| `insert / update / upsert / remove` | `POST / PUT / PUT / DELETE` |
| `sessionStorage` session | Server session/JWT from `POST /api/auth/login` |
| `seedService` | Flyway/Liquibase seed migrations + admin reset endpoint |
| `AuditEngine` local writes | `POST /api/audit-events` (or server-side audit interception) |

## Steps

1. **Implement `HttpStorageAdapter`** with the same contract as
   `LocalStorageAdapter` (`get/set/remove/keys` per collection), backed by `fetch`
   against the Spring Boot API. Swap it in `src/repositories/index.js` only.
2. **Entities**: collections in LOCAL_DATA_MODEL.md map 1:1 to JPA entities
   (`employees`, `customers`, `accounts`, …). Keep the same `id` fields.
3. **Auth**: replace `AuthService.login`'s local password check with
   `POST /api/auth/login`; keep `createSession` shape so stores don't change.
   Move password storage to BCrypt server-side (plain-text demo passwords are a
   local-training limitation, never acceptable server-side).
4. **Engines stay client-side for training** (workflow/authorisation rules), but the
   backend must re-enforce the same rules; treat client enforcement as UX only.
5. **Money**: integer cents client-side ↔ `BigDecimal`/minor units server-side.
6. **Audit**: keep `auditEvents` append-only; server should assign ids and timestamps.
7. **Business date / parameters**: `GET /api/parameters/bank` replaces the
   `BANK-PARAMS` seed row.

## What must NOT move as-is

- Plain-text demo passwords (replace with hashed credentials).
- Permission checks (mirror them server-side; never trust the client).
- The fictional seed identities (keep them clearly fictional in any shared env).
