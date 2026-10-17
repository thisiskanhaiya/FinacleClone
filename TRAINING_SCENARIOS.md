# Training Scenarios

## Workbook information architecture

- `/training` — catalogue: search, module filter, role filter, difficulty filter,
  progress badges (Not started / In progress / Completed), reset progress (audited).
- `/training/operations/{code}` — one dedicated page per operation with 8 tabs:
  1. **Operation Overview** — identity, purpose, employees involved, demo credentials (live in Phase 1)
  2. **Required Setup** — training data, preconditions, *Check Preconditions*, *Prepare Scenario*
  3. **Guided Walkthrough** — numbered steps: login, screen, field, exact value, button, expected response, status
  4. **Authorisation** — handoff: request reference, next role/credentials, comparison checklist, *Switch to Required User*
  5. **Verification** — live checklist against real local data + links to inquiry screens
  6. **Exceptions and Recovery** — error → cause → failed validation → correction → reversal/retry
  7. **Practice Exercise** — a scenario variation, verified against real data (never by clicking "Next")
  8. **Activity History** — attempts/completions from the `trainingProgress` collection

Scenario definitions (shape documented in `src/data/trainingScenarios/index.js`) are
delivered with each operation's phase.

## Phase 4 reference scenario: PAY-INTERNAL-001

- Maker: `teller01` / `Teller@123` · Authoriser: `tellerauthoriser01` / `TellerAuth@123`
- Source: Amit Sharma, CIF000001, SB000001, available ₹1,00,000.00
- Destination: Neha Verma, CIF000002, SB000002, available ₹50,000.00
- Amount ₹5,000.00, remarks "Training internal transfer"
- Maker stage: request reference generated, status PENDING_AUTHORISATION, no balance
  movement before approval, audit + authorisation item created
- Authoriser stage: AUT-QUEUE-001 → filter Internal Fund Transfer → compare
  source/destination/amount/maker → Approve
- Posted result: SB000001 = ₹95,000.00 · SB000002 = ₹55,000.00 · status POSTED ·
  balanced journal (Dr source deposit liability / Cr destination deposit liability)
- Records: request, authorisation decision, transaction, 2 legs, journal, maker/checker/
  posting audit events, receipt
- Negative variants: same source/destination · insufficient balance · debit-frozen source
  (SB000003) · closed destination · duplicate submission · self-authorisation ·
  reject · return · reversal after posting (TXN-REVERSE-001)

## Journeys

See WORKFLOW_MATRIX.md for the 8 journeys (Customer onboarding, Savings opening,
Teller cash, Internal transfer, Fixed deposit, Loan, Account servicing, Day end).
Each journey becomes a chain of guide pages whose verification tabs read live data.

## Scenario data hygiene

*Prepare Scenario* restores only the entities the scenario touches and records a
`TRAINING_SCENARIO_PREPARED` audit event; *Reset Training Data* (admin01) restores
the entire environment.
