import { accountingEngine } from '../engine/AccountingEngine.js';
import { getRepository, COLLECTIONS } from '../repositories/index.js';
import { recordAudit } from './auditService.js';
import { AUDIT_ACTIONS } from '../domain/enums/auditActions.js';
import { WORKFLOW_STATUS } from '../domain/enums/workflowStatus.js';
import { nextId } from '../utils/id.js';
import { toCents, fromCents, add, subtract } from '../utils/money.js';
import { ValidationError, WorkflowError } from '../utils/errors.js';

/**
 * PostingService - the only path through which money moves.
 *
 * Creates, atomically (local single-store write):
 *   - transaction record (status POSTED)
 *   - transaction legs (per-account debit/credit view with balanceAfter)
 *   - journal header + journal lines (balanced, enforced)
 *   - GL balance updates
 *   - customer account balance updates
 *   - audit events
 *
 * Called only after an operation's authorisation completes (APPROVED),
 * never directly from a component.
 */

/**
 * Signed GL impact: assets/expenses grow with debits; liabilities/income grow
 * with credits. SUSPENSE here is the outward-payment parking account (money
 * owed to settlement), so it behaves like a liability: credits increase it.
 */
export function glBalanceDelta(glCategory, side, amount) {
  const cents = toCents(amount);
  const debitIncreases = ['ASSET', 'EXPENSE'].includes(glCategory);
  if (!['ASSET', 'EXPENSE', 'SUSPENSE', 'LIABILITY', 'INCOME'].includes(glCategory)) {
    throw new ValidationError(`Unknown GL category: ${glCategory}.`);
  }
  const magnitude = debitIncreases ? (side === 'DEBIT' ? cents : -cents) : (side === 'CREDIT' ? cents : -cents);
  return fromCents(magnitude);
}

export async function postFinancialTransaction({
  operationCode,
  type,
  amount,
  currency = 'INR',
  maker,
  checker = null,
  branch,
  businessDate,
  remarks = '',
  journalLines,
  accountEffects = [],
  relatedRequestId = null,
}) {
  // Mandatory invariant: total debit equals total credit before posting.
  accountingEngine.assertBalanced(journalLines);

  const transactions = getRepository(COLLECTIONS.TRANSACTIONS);
  const legs = getRepository(COLLECTIONS.TRANSACTION_LEGS);
  const journals = getRepository(COLLECTIONS.JOURNALS);
  const journalLinesRepo = getRepository(COLLECTIONS.JOURNAL_LINES);
  const glAccounts = getRepository(COLLECTIONS.GL_ACCOUNTS);
  const accounts = getRepository(COLLECTIONS.ACCOUNTS);

  // Guard against double-posting the same originating request.
  if (relatedRequestId) {
    const existing = await transactions.findOneWhere(
      (t) => t.relatedRequestId === relatedRequestId && t.status === WORKFLOW_STATUS.POSTED,
    );
    if (existing) {
      throw new WorkflowError(`Request ${relatedRequestId} already has a posted transaction (${existing.id}).`);
    }
  }

  const transactionId = nextId('TXN');
  const journalId = nextId('JRN');
  const now = new Date().toISOString();

  // 1. Journal header + lines
  await journals.insert({
    id: journalId,
    transactionId,
    operationCode,
    status: 'POSTED',
    businessDate,
    createdAt: now,
  });
  for (const line of journalLines) {
    const gl = await glAccounts.findById(line.glCode);
    if (!gl) throw new ValidationError(`Unknown GL account: ${line.glCode}.`);
    await journalLinesRepo.insert({
      id: nextId('JRL'),
      journalId,
      glCode: line.glCode,
      glName: gl.name,
      side: line.side,
      amount: toCents(line.amount) / 100,
      narrative: line.narrative ?? '',
    });
    // 2. GL balance update
    const delta = glBalanceDelta(gl.category, line.side, line.amount);
    await glAccounts.update(gl.id, { balance: add(gl.balance, delta) });
  }

  // 3. Transaction legs + customer account balances
  const writtenLegs = [];
  for (const effect of accountEffects) {
    const account = await accounts.findById(effect.accountNumber);
    if (!account) throw new ValidationError(`Unknown account: ${effect.accountNumber}.`);
    const apply = (balance) => (effect.side === 'CREDIT' ? add(balance, amount) : subtract(balance, amount));
    const newAvailable = apply(account.availableBalance);
    if (toCents(newAvailable) < 0) {
      throw new ValidationError(`Posting would take account ${account.accountNumber} negative - blocked.`);
    }
    const newLedger = apply(account.ledgerBalance);
    await accounts.update(account.id, { availableBalance: newAvailable, ledgerBalance: newLedger });
    const leg = {
      id: nextId('LEG'),
      transactionId,
      accountNumber: account.accountNumber,
      side: effect.side,
      amount: toCents(amount) / 100,
      balanceAfter: newLedger,
    };
    await legs.insert(leg);
    writtenLegs.push(leg);

    await recordAudit({
      action: AUDIT_ACTIONS.BALANCE_UPDATED,
      entityType: 'ACCOUNT',
      entityId: account.accountNumber,
      performedBy: checker ?? maker,
      branch,
      businessDate,
      details: { side: effect.side, amount, ledgerAfter: newLedger, availableAfter: newAvailable, transactionId },
    });
  }

  // 4. Transaction record
  const transaction = {
    id: transactionId,
    operationCode,
    type,
    amount: toCents(amount) / 100,
    currency,
    status: WORKFLOW_STATUS.POSTED,
    maker,
    checker,
    branch,
    businessDate,
    remarks,
    journalId,
    relatedRequestId,
    createdAt: now,
    postedAt: now,
  };
  await transactions.insert(transaction);

  // 5. Audit
  await recordAudit({
    action: AUDIT_ACTIONS.JOURNAL_POSTED,
    entityType: 'JOURNAL',
    entityId: journalId,
    performedBy: checker ?? maker,
    branch,
    businessDate,
    details: { transactionId, lines: journalLines.length, amount },
  });
  await recordAudit({
    action: AUDIT_ACTIONS.TRANSACTION_POSTED,
    entityType: 'TRANSACTION',
    entityId: transactionId,
    performedBy: checker ?? maker,
    branch,
    businessDate,
    details: { operationCode, type, amount, relatedRequestId },
  });

  return { transaction, journal: { id: journalId }, legs: writtenLegs };
}
