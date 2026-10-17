import { getRepository, COLLECTIONS } from '../repositories/index.js';
import { canMakeOperation } from '../domain/rules/permissionRules.js';
import { getOperation } from '../data/operationSpecifications/operations.js';
import { WORKFLOW_STATUS } from '../domain/enums/workflowStatus.js';
import { AUDIT_ACTIONS } from '../domain/enums/auditActions.js';
import { PermissionError, ValidationError, NotFoundError, WorkflowError } from '../utils/errors.js';
import { recordAudit } from './auditService.js';
import { environmentService } from './environmentService.js';
import { postFinancialTransaction } from './postingService.js';
import { adjustSessionCashForReversal } from './tellerService.js';
import { nextId } from '../utils/id.js';

/**
 * ReversalService - TXN-REVERSE-001 (Phase 3).
 *
 * A posted transaction is never edited or deleted. Reversal creates a NEW
 * transaction whose journal mirrors the original with every debit and credit
 * swapped, restoring balances while preserving complete history.
 * Maker-checker controlled: the requester cannot approve their own reversal.
 */

export async function listReversibleTransactions() {
  const all = await getRepository(COLLECTIONS.TRANSACTIONS).findAll();
  return all
    .filter((t) => t.status === WORKFLOW_STATUS.POSTED && !t.type.endsWith('_REVERSAL') && !t.reversedBy)
    .sort((a, b) => (a.postedAt < b.postedAt ? 1 : -1));
}

export async function requestReversal({ transactionId, reason }, session) {
  const operation = getOperation('TXN-REVERSE-001');
  if (!canMakeOperation(session?.role, operation)) {
    throw new PermissionError('Not authorised for your current role.');
  }
  if (!reason || !reason.trim()) {
    throw new ValidationError('A reversal reason is mandatory - it becomes part of the permanent audit trail.');
  }

  const transactions = getRepository(COLLECTIONS.TRANSACTIONS);
  const original = await transactions.findById(transactionId);
  if (!original) throw new NotFoundError(`Transaction ${transactionId} not found.`);
  if (original.status !== WORKFLOW_STATUS.POSTED) {
    throw new WorkflowError(`Only POSTED transactions can be reversed (this one is ${original.status}).`);
  }
  if (original.type.endsWith('_REVERSAL')) {
    throw new WorkflowError('A reversal transaction cannot itself be reversed.');
  }
  if (original.reversedBy) {
    throw new WorkflowError(`Already reversed by ${original.reversedBy} - double reversal is prohibited.`);
  }

  const businessDate = await environmentService.getBusinessDate();
  const request = {
    id: nextId('REQ'),
    operationCode: 'TXN-REVERSE-001',
    entityType: 'TRANSACTION',
    entityId: original.id,
    summary: `Reverse ${original.type} ${original.id} (INR ${original.amount}) - ${reason.trim()}`,
    amount: original.amount,
    payload: { transactionId: original.id, reason: reason.trim() },
    beforeValues: { status: original.status, type: original.type, amount: original.amount },
    afterValues: { status: 'REVERSED' },
    makerId: session.username,
    makerRole: session.role,
    checkerId: null,
    decision: null,
    remarks: reason.trim(),
    status: WORKFLOW_STATUS.PENDING_AUTHORISATION,
    branch: session.branch,
    businessDate,
    createdAt: new Date().toISOString(),
    decidedAt: null,
  };
  await getRepository(COLLECTIONS.AUTHORISATION_REQUESTS).insert(request);
  await recordAudit({
    action: AUDIT_ACTIONS.REQUEST_SUBMITTED,
    entityType: 'TRANSACTION',
    entityId: original.id,
    performedBy: session.username,
    performedByRole: session.role,
    branch: session.branch,
    businessDate,
    details: { operationCode: 'TXN-REVERSE-001', requestId: request.id, reason: reason.trim() },
  });
  return { request, original };
}

/** Approval effect: post the compensating transaction and mark the original REVERSED. */
export async function applyReversalEffect(request, session, businessDate) {
  const transactions = getRepository(COLLECTIONS.TRANSACTIONS);
  const journalLinesRepo = getRepository(COLLECTIONS.JOURNAL_LINES);
  const legsRepo = getRepository(COLLECTIONS.TRANSACTION_LEGS);

  const original = await transactions.findById(request.payload.transactionId);
  if (!original) throw new NotFoundError('Original transaction not found.');
  if (original.status !== WORKFLOW_STATUS.POSTED || original.reversedBy) {
    throw new WorkflowError('Original transaction is no longer reversible (already reversed or not posted).');
  }

  const originalLines = await journalLinesRepo.findWhere((l) => l.journalId === original.journalId);
  const originalLegs = await legsRepo.findWhere((l) => l.transactionId === original.id);

  const { transaction } = await postFinancialTransaction({
    operationCode: 'TXN-REVERSE-001',
    type: `${original.type}_REVERSAL`,
    amount: original.amount,
    maker: request.makerId,
    checker: session.username,
    branch: request.branch,
    businessDate,
    remarks: `Reversal of ${original.id}: ${request.payload.reason}`,
    relatedRequestId: request.id,
    journalLines: originalLines.map((l) => ({
      glCode: l.glCode,
      side: l.side === 'DEBIT' ? 'CREDIT' : 'DEBIT',
      amount: l.amount,
      narrative: `Reversal of ${original.journalId}: ${l.narrative}`,
    })),
    accountEffects: originalLegs.map((l) => ({
      accountNumber: l.accountNumber,
      side: l.side === 'CREDIT' ? 'DEBIT' : 'CREDIT',
    })),
  });

  await transactions.update(original.id, { status: WORKFLOW_STATUS.REVERSED, reversedBy: transaction.id });

  // If the original was a teller cash movement and the maker's session is still
  // open, the expected cash moves back too.
  if (['CASH_DEPOSIT', 'CASH_WITHDRAWAL'].includes(original.type)) {
    await adjustSessionCashForReversal(original.maker, original.type, original.amount);
  }

  await recordAudit({
    action: AUDIT_ACTIONS.TRANSACTION_REVERSED,
    entityType: 'TRANSACTION',
    entityId: original.id,
    performedBy: session.username,
    performedByRole: session.role,
    branch: request.branch,
    businessDate,
    details: { reversalTransactionId: transaction.id, reason: request.payload.reason },
  });

  return { effect: 'TRANSACTION_REVERSED', entityId: original.id, transactionId: transaction.id };
}
