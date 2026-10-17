import { getRepository, COLLECTIONS } from '../repositories/index.js';
import {
  validateDebitAccount,
  validateCreditAccount,
  validateTransferAmount,
  validateSufficientFunds,
  validateInternalTransfer,
  validateBeneficiary,
  validateNeftAmount,
  validateRtgsAmount,
  validateSiPayload,
} from '../domain/validators/paymentValidator.js';
import { canMakeOperation } from '../domain/rules/permissionRules.js';
import { getOperation } from '../data/operationSpecifications/operations.js';
import { WORKFLOW_STATUS } from '../domain/enums/workflowStatus.js';
import { AUDIT_ACTIONS } from '../domain/enums/auditActions.js';
import { PermissionError, ValidationError, NotFoundError, WorkflowError } from '../utils/errors.js';
import { recordAudit } from './auditService.js';
import { environmentService } from './environmentService.js';
import { postFinancialTransaction } from './postingService.js';
import { DEPOSIT_LIABILITY_GL } from './accountService.js';
import { nextId } from '../utils/id.js';
import { toCents, add } from '../utils/money.js';

/**
 * TransferService - Phase 4 payments.
 *
 * Internal transfer: liability shifts between two accounts of this bank.
 * NEFT/RTGS: outward payments - the customer is debited into the Suspense GL
 * and a (simulated) gateway message is recorded; settlement/clearing is a
 * later-phase concern.
 * Standing instructions: recurring internal transfers, created and cancelled
 * under maker-checker, executed per due date with the same posting path.
 */

const SUSPENSE_GL = 'TRN-GL-9001';

function assertMaker(session, operationCode) {
  const operation = getOperation(operationCode);
  if (!canMakeOperation(session?.role, operation)) {
    throw new PermissionError('Not authorised for your current role.');
  }
  return operation;
}

async function loadAccount(accountNumber) {
  const account = await getRepository(COLLECTIONS.ACCOUNTS).findById(String(accountNumber ?? '').trim());
  return account ?? null;
}

async function productOf(account) {
  return getRepository(COLLECTIONS.PRODUCTS).findById(account.productCode);
}

function liabilityGlFor(product) {
  return DEPOSIT_LIABILITY_GL[product?.accountCategory] ?? DEPOSIT_LIABILITY_GL.SAVINGS;
}

/** Sum of posted debits of the given types for an account on a business date. */
export async function dailyDebitUsage(accountNumber, businessDate, types) {
  const legs = await getRepository(COLLECTIONS.TRANSACTION_LEGS).findWhere(
    (l) => l.accountNumber === accountNumber && l.side === 'DEBIT',
  );
  const transactions = getRepository(COLLECTIONS.TRANSACTIONS);
  let total = 0;
  for (const leg of legs) {
    const txn = await transactions.findById(leg.transactionId);
    if (txn && types.includes(txn.type) && txn.status === WORKFLOW_STATUS.POSTED && txn.businessDate === businessDate) {
      total = add(total, leg.amount);
    }
  }
  return total;
}

async function createPaymentRequest({ operationCode, entityId, summary, amount, payload, beforeValues, afterValues, session, businessDate }) {
  const request = {
    id: nextId('REQ'),
    operationCode,
    entityType: 'PAYMENT',
    entityId,
    summary,
    amount: amount != null ? toCents(amount) / 100 : null,
    payload,
    beforeValues,
    afterValues,
    makerId: session.username,
    makerRole: session.role,
    checkerId: null,
    decision: null,
    remarks: payload.remarks ?? '',
    status: WORKFLOW_STATUS.PENDING_AUTHORISATION,
    branch: session.branch,
    businessDate,
    createdAt: new Date().toISOString(),
    decidedAt: null,
  };
  await getRepository(COLLECTIONS.AUTHORISATION_REQUESTS).insert(request);
  await recordAudit({
    action: AUDIT_ACTIONS.REQUEST_SUBMITTED,
    entityType: 'PAYMENT',
    entityId,
    performedBy: session.username,
    performedByRole: session.role,
    branch: session.branch,
    businessDate,
    details: { operationCode, requestId: request.id, summary },
  });
  return request;
}

function collectErrors(checks) {
  const errors = Object.assign({}, ...checks.map((c) => c.errors));
  return Object.keys(errors).length ? errors : null;
}

/** Shared source-side checks for any outgoing payment. */
async function validateSource(source, amount, extraChecks, businessDate, usageTypes) {
  const product = source ? await productOf(source) : null;
  const dailyUsed = source ? await dailyDebitUsage(source.accountNumber, businessDate, usageTypes) : 0;
  return collectErrors([
    validateDebitAccount(source),
    validateSufficientFunds(source ?? { availableBalance: 0 }, source ? amount : '0'),
    validateTransferAmount(amount, product, dailyUsed),
    ...extraChecks,
  ]);
}

// --------------------------------------------------------- internal transfer

export async function internalTransfer({ sourceAccountNumber, destinationAccountNumber, amount, remarks = '' }, session) {
  assertMaker(session, 'PAY-INTERNAL-001');
  const businessDate = await environmentService.getBusinessDate();
  const source = await loadAccount(sourceAccountNumber);
  const destination = await loadAccount(destinationAccountNumber);

  const errors = await validateSource(source, amount, [
    validateCreditAccount(destination),
    validateInternalTransfer({ sourceAccount: source, destinationAccount: destination, amount }),
  ], businessDate, ['INTERNAL_TRANSFER', 'NEFT_OUTWARD', 'RTGS_OUTWARD', 'SI_EXECUTION']);
  if (errors) throw new ValidationError('Transfer validation failed.', errors);

  const request = await createPaymentRequest({
    operationCode: 'PAY-INTERNAL-001',
    entityId: source.accountNumber,
    summary: `Internal transfer of INR ${amount} from ${source.accountNumber} to ${destination.accountNumber}`,
    amount,
    payload: {
      sourceAccountNumber: source.accountNumber,
      destinationAccountNumber: destination.accountNumber,
      amount: toCents(amount) / 100,
      remarks,
    },
    beforeValues: { [source.accountNumber]: source.availableBalance, [destination.accountNumber]: destination.availableBalance },
    afterValues: { [source.accountNumber]: `− ${amount}`, [destination.accountNumber]: `+ ${amount}` },
    session,
    businessDate,
  });
  return { request };
}

// ------------------------------------------------------------------ NEFT/RTGS

async function outwardPayment(operationCode, { sourceAccountNumber, amount, beneficiaryName, beneficiaryAccount, ifsc, remarks = '' }, session) {
  assertMaker(session, operationCode);
  const businessDate = await environmentService.getBusinessDate();
  const source = await loadAccount(sourceAccountNumber);
  const type = operationCode === 'PAY-RTGS-001' ? 'RTGS_OUTWARD' : 'NEFT_OUTWARD';

  const errors = await validateSource(source, amount, [
    validateBeneficiary({ beneficiaryName, beneficiaryAccount, ifsc }),
    operationCode === 'PAY-RTGS-001' ? validateRtgsAmount(amount) : validateNeftAmount(amount),
  ], businessDate, ['INTERNAL_TRANSFER', 'NEFT_OUTWARD', 'RTGS_OUTWARD', 'SI_EXECUTION']);
  if (errors) throw new ValidationError(`${operationCode === 'PAY-RTGS-001' ? 'RTGS' : 'NEFT'} validation failed.`, errors);

  const request = await createPaymentRequest({
    operationCode,
    entityId: source.accountNumber,
    summary: `${type === 'RTGS_OUTWARD' ? 'RTGS' : 'NEFT'} of INR ${amount} from ${source.accountNumber} to ${beneficiaryName.trim()} (${beneficiaryAccount}, ${ifsc.toUpperCase().trim()})`,
    amount,
    payload: {
      sourceAccountNumber: source.accountNumber,
      amount: toCents(amount) / 100,
      beneficiaryName: beneficiaryName.trim(),
      beneficiaryAccount: String(beneficiaryAccount).trim(),
      ifsc: ifsc.toUpperCase().trim(),
      remarks,
    },
    beforeValues: { [source.accountNumber]: source.availableBalance },
    afterValues: { [source.accountNumber]: `− ${amount}`, beneficiary: beneficiaryName.trim() },
    session,
    businessDate,
  });
  return { request };
}

export const neftTransfer = (payload, session) => outwardPayment('PAY-NEFT-001', payload, session);
export const rtgsTransfer = (payload, session) => outwardPayment('PAY-RTGS-001', payload, session);

// -------------------------------------------------------- standing instruction

function addMonths(isoDate, months) {
  const [y, m, d] = isoDate.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1 + months, d));
  return date.toISOString().slice(0, 10);
}

function nextDueFrom(frequency, fromDate) {
  return addMonths(fromDate, frequency === 'QUARTERLY' ? 3 : 1);
}

export async function createStandingInstruction({ sourceAccountNumber, destinationAccountNumber, amount, frequency, startDate }, session) {
  assertMaker(session, 'PAY-SI-CREATE-001');
  const businessDate = await environmentService.getBusinessDate();
  const source = await loadAccount(sourceAccountNumber);
  const destination = await loadAccount(destinationAccountNumber);

  const errors = collectErrors([
    validateDebitAccount(source),
    validateCreditAccount(destination),
    validateSiPayload({ sourceAccount: source, destinationAccount: destination, amount, frequency, startDate }),
  ]);
  if (errors) throw new ValidationError('Standing instruction validation failed.', errors);
  if (startDate < businessDate) {
    throw new ValidationError('Standing instruction validation failed.', { startDate: `Start date cannot be before the business date (${businessDate}).` });
  }

  const existingIds = (await getRepository(COLLECTIONS.STANDING_INSTRUCTIONS).findAll()).map((s) => s.id);
  const n = existingIds.length + 1;
  const si = {
    id: `SI${String(n).padStart(6, '0')}`,
    sourceAccountNumber: source.accountNumber,
    destinationAccountNumber: destination.accountNumber,
    amount: toCents(amount) / 100,
    frequency,
    startDate,
    nextDueDate: startDate,
    status: WORKFLOW_STATUS.PENDING_AUTHORISATION,
    branch: session.branch,
    createdBy: session.username,
    fictional: true,
  };
  await getRepository(COLLECTIONS.STANDING_INSTRUCTIONS).insert(si);

  const request = await createPaymentRequest({
    operationCode: 'PAY-SI-CREATE-001',
    entityId: si.id,
    summary: `Standing instruction: INR ${amount} ${frequency.toLowerCase()} from ${si.sourceAccountNumber} to ${si.destinationAccountNumber}, starting ${startDate}`,
    amount,
    payload: { siId: si.id },
    beforeValues: null,
    afterValues: { siId: si.id, amount: si.amount, frequency, nextDueDate: startDate },
    session,
    businessDate,
  });
  return { si, request };
}

export async function listStandingInstructions(statusFilter = null) {
  const all = await getRepository(COLLECTIONS.STANDING_INSTRUCTIONS).findAll();
  return all.filter((s) => !statusFilter || s.status === statusFilter);
}

export async function dueStandingInstructions() {
  const businessDate = await environmentService.getBusinessDate();
  const all = await listStandingInstructions('ACTIVE');
  return all.filter((s) => s.nextDueDate <= businessDate);
}

export async function executeStandingInstruction(siId, session) {
  assertMaker(session, 'PAY-SI-EXECUTE-001');
  const businessDate = await environmentService.getBusinessDate();
  const si = await getRepository(COLLECTIONS.STANDING_INSTRUCTIONS).findById(siId);
  if (!si) throw new NotFoundError(`Standing instruction ${siId} not found.`);
  if (si.status !== 'ACTIVE') throw new WorkflowError(`Standing instruction is ${si.status} - only ACTIVE ones execute.`);
  if (si.nextDueDate > businessDate) {
    throw new WorkflowError(`Not due yet - next due date is ${si.nextDueDate} (business date ${businessDate}).`);
  }

  const source = await loadAccount(si.sourceAccountNumber);
  const errors = await validateSource(source, si.amount, [], businessDate, ['INTERNAL_TRANSFER', 'NEFT_OUTWARD', 'RTGS_OUTWARD', 'SI_EXECUTION']);
  if (errors) throw new ValidationError('SI execution validation failed.', errors);

  const request = await createPaymentRequest({
    operationCode: 'PAY-SI-EXECUTE-001',
    entityId: si.id,
    summary: `Execute standing instruction ${si.id}: INR ${si.amount} from ${si.sourceAccountNumber} to ${si.destinationAccountNumber}`,
    amount: si.amount,
    payload: { siId: si.id, dueDate: si.nextDueDate },
    beforeValues: { nextDueDate: si.nextDueDate },
    afterValues: { executes: si.nextDueDate, then: nextDueFrom(si.frequency, si.nextDueDate) },
    session,
    businessDate,
  });
  return { si, request };
}

export async function cancelStandingInstruction(siId, session) {
  assertMaker(session, 'PAY-SI-CANCEL-001');
  const businessDate = await environmentService.getBusinessDate();
  const si = await getRepository(COLLECTIONS.STANDING_INSTRUCTIONS).findById(siId);
  if (!si) throw new NotFoundError(`Standing instruction ${siId} not found.`);
  if (si.status !== 'ACTIVE') throw new WorkflowError(`Standing instruction is ${si.status} - only ACTIVE ones can be cancelled.`);

  const request = await createPaymentRequest({
    operationCode: 'PAY-SI-CANCEL-001',
    entityId: si.id,
    summary: `Cancel standing instruction ${si.id} (${si.sourceAccountNumber} → ${si.destinationAccountNumber}, INR ${si.amount} ${si.frequency.toLowerCase()})`,
    amount: null,
    payload: { siId: si.id },
    beforeValues: { status: si.status },
    afterValues: { status: 'CANCELLED' },
    session,
    businessDate,
  });
  return { si, request };
}

// --------------------------------------------------------- approval effects

async function recordGatewayMessage(request, transactionId, type) {
  const message = {
    id: nextId('MSG'),
    operation: type,
    adapter: type === 'RTGS_OUTWARD' ? 'RTGS_GATEWAY' : 'NEFT_GATEWAY',
    requestSummary: `${type} for txn ${transactionId} to ${request.payload.beneficiaryName} (${request.payload.ifsc})`,
    responseStatus: 'SENT',
    responseCode: 'MOCK_ACCEPTED',
    failureReason: null,
    retryCount: 0,
    correlationId: request.id,
    timestamp: new Date().toISOString(),
    fictional: true,
  };
  await getRepository(COLLECTIONS.INTEGRATION_MESSAGES).insert(message);
  return message;
}

export async function applyPaymentApprovalEffect(request, session, businessDate) {
  const sis = getRepository(COLLECTIONS.STANDING_INSTRUCTIONS);

  switch (request.operationCode) {
    case 'PAY-INTERNAL-001': {
      const source = await loadAccount(request.payload.sourceAccountNumber);
      const destination = await loadAccount(request.payload.destinationAccountNumber);
      const errors = await validateSource(source, request.payload.amount, [
        validateCreditAccount(destination),
      ], businessDate, ['INTERNAL_TRANSFER', 'NEFT_OUTWARD', 'RTGS_OUTWARD', 'SI_EXECUTION']);
      if (errors) throw new ValidationError('Approval blocked - account state changed since submission.', errors);

      const sourceGl = liabilityGlFor(await productOf(source));
      const destGl = liabilityGlFor(await productOf(destination));
      const { transaction } = await postFinancialTransaction({
        operationCode: request.operationCode,
        type: 'INTERNAL_TRANSFER',
        amount: request.payload.amount,
        maker: request.makerId,
        checker: session.username,
        branch: request.branch,
        businessDate,
        remarks: request.payload.remarks || request.summary,
        relatedRequestId: request.id,
        journalLines: [
          { glCode: sourceGl, side: 'DEBIT', amount: request.payload.amount, narrative: `Liability to ${source.accountNumber} falls` },
          { glCode: destGl, side: 'CREDIT', amount: request.payload.amount, narrative: `Liability to ${destination.accountNumber} rises` },
        ],
        accountEffects: [
          { accountNumber: source.accountNumber, side: 'DEBIT' },
          { accountNumber: destination.accountNumber, side: 'CREDIT' },
        ],
      });
      return { effect: 'INTERNAL_TRANSFER_POSTED', entityId: source.accountNumber, transactionId: transaction.id };
    }

    case 'PAY-NEFT-001':
    case 'PAY-RTGS-001': {
      const type = request.operationCode === 'PAY-RTGS-001' ? 'RTGS_OUTWARD' : 'NEFT_OUTWARD';
      const source = await loadAccount(request.payload.sourceAccountNumber);
      const errors = await validateSource(source, request.payload.amount, [], businessDate, ['INTERNAL_TRANSFER', 'NEFT_OUTWARD', 'RTGS_OUTWARD', 'SI_EXECUTION']);
      if (errors) throw new ValidationError('Approval blocked - account state changed since submission.', errors);

      const sourceGl = liabilityGlFor(await productOf(source));
      const { transaction } = await postFinancialTransaction({
        operationCode: request.operationCode,
        type,
        amount: request.payload.amount,
        maker: request.makerId,
        checker: session.username,
        branch: request.branch,
        businessDate,
        remarks: request.payload.remarks || request.summary,
        relatedRequestId: request.id,
        journalLines: [
          { glCode: sourceGl, side: 'DEBIT', amount: request.payload.amount, narrative: `Customer debited for outward ${type}` },
          { glCode: SUSPENSE_GL, side: 'CREDIT', amount: request.payload.amount, narrative: `Parked in suspense awaiting ${type === 'RTGS_OUTWARD' ? 'RTGS settlement' : 'NEFT batch settlement'}` },
        ],
        accountEffects: [{ accountNumber: source.accountNumber, side: 'DEBIT' }],
      });
      const message = await recordGatewayMessage(request, transaction.id, type);
      return { effect: `${type}_POSTED`, entityId: source.accountNumber, transactionId: transaction.id, messageId: message.id };
    }

    case 'PAY-SI-CREATE-001': {
      await sis.update(request.payload.siId, { status: 'ACTIVE' });
      return { effect: 'SI_ACTIVATED', entityId: request.payload.siId };
    }

    case 'PAY-SI-EXECUTE-001': {
      const si = await sis.findById(request.payload.siId);
      if (!si || si.status !== 'ACTIVE') throw new WorkflowError('Standing instruction is no longer ACTIVE.');
      if (si.nextDueDate !== request.payload.dueDate) {
        throw new WorkflowError(`Due date moved since submission (${si.nextDueDate}); submit a fresh execution.`);
      }
      const source = await loadAccount(si.sourceAccountNumber);
      const destination = await loadAccount(si.destinationAccountNumber);
      const errors = await validateSource(source, si.amount, [validateCreditAccount(destination)], businessDate, ['INTERNAL_TRANSFER', 'NEFT_OUTWARD', 'RTGS_OUTWARD', 'SI_EXECUTION']);
      if (errors) throw new ValidationError('Approval blocked - account state changed since submission.', errors);

      const sourceGl = liabilityGlFor(await productOf(source));
      const destGl = liabilityGlFor(await productOf(destination));
      const { transaction } = await postFinancialTransaction({
        operationCode: request.operationCode,
        type: 'SI_EXECUTION',
        amount: si.amount,
        maker: request.makerId,
        checker: session.username,
        branch: request.branch,
        businessDate,
        remarks: `Standing instruction ${si.id} execution for ${si.nextDueDate}`,
        relatedRequestId: request.id,
        journalLines: [
          { glCode: sourceGl, side: 'DEBIT', amount: si.amount, narrative: `SI ${si.id}: liability to ${source.accountNumber} falls` },
          { glCode: destGl, side: 'CREDIT', amount: si.amount, narrative: `SI ${si.id}: liability to ${destination.accountNumber} rises` },
        ],
        accountEffects: [
          { accountNumber: source.accountNumber, side: 'DEBIT' },
          { accountNumber: destination.accountNumber, side: 'CREDIT' },
        ],
      });
      await sis.update(si.id, { nextDueDate: nextDueFrom(si.frequency, si.nextDueDate), lastExecutedOn: businessDate });
      return { effect: 'SI_EXECUTED', entityId: si.id, transactionId: transaction.id };
    }

    case 'PAY-SI-CANCEL-001': {
      await sis.update(request.payload.siId, { status: 'CANCELLED', cancelledAt: new Date().toISOString() });
      return { effect: 'SI_CANCELLED', entityId: request.payload.siId };
    }

    default:
      throw new ValidationError(`No approval effect is implemented for ${request.operationCode} in this phase.`);
  }
}

// ----------------------------------------------------------- inquiry helpers

export async function searchTransactions(query) {
  const q = String(query ?? '').trim().toLowerCase();
  const all = await getRepository(COLLECTIONS.TRANSACTIONS).findAll();
  const filtered = q
    ? all.filter((t) =>
        [t.id, t.type, t.operationCode, t.maker, t.checker, t.status]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q)),
      )
    : all;
  return filtered.sort((a, b) => (a.postedAt ?? a.createdAt) < (b.postedAt ?? b.createdAt) ? 1 : -1);
}

export async function getTransactionDetail(id) {
  const txn = await getRepository(COLLECTIONS.TRANSACTIONS).findById(id);
  if (!txn) return null;
  const lines = await getRepository(COLLECTIONS.JOURNAL_LINES).findWhere((l) => l.journalId === txn.journalId);
  const legs = await getRepository(COLLECTIONS.TRANSACTION_LEGS).findWhere((l) => l.transactionId === txn.id);
  return { transaction: txn, journalLines: lines, legs };
}
