import { getRepository, COLLECTIONS } from '../repositories/index.js';
import {
  validateCashAmount,
  validateWithdrawalAccount,
  validateDepositAccount,
  validateSufficientFunds,
  validateDenominations,
  validateDeclaredCash,
} from '../domain/validators/tellerValidator.js';
import { canMakeOperation } from '../domain/rules/permissionRules.js';
import { getOperation } from '../data/operationSpecifications/operations.js';
import { WORKFLOW_STATUS } from '../domain/enums/workflowStatus.js';
import { AUDIT_ACTIONS } from '../domain/enums/auditActions.js';
import { PermissionError, ValidationError, NotFoundError, WorkflowError } from '../utils/errors.js';
import { recordAudit } from './auditService.js';
import { environmentService } from './environmentService.js';
import { postFinancialTransaction } from './postingService.js';
import { DEPOSIT_LIABILITY_GL, TELLER_CASH_GL } from './accountService.js';
import { nextId } from '../utils/id.js';
import { toCents, add, subtract } from '../utils/money.js';

/**
 * TellerService - Phase 3 cash counter lifecycle.
 *
 * A teller must OPEN a session (with an opening cash float) before any cash
 * operation. Deposits and withdrawals are maker-checker: the teller submits,
 * a teller authoriser approves, and only then does money move. Session close
 * is maker-checker too, with declared vs system cash compared; a variance
 * raises an exception record instead of being silently ignored.
 */

function assertMaker(session, operationCode) {
  const operation = getOperation(operationCode);
  if (!canMakeOperation(session?.role, operation)) {
    throw new PermissionError('Not authorised for your current role.');
  }
  return operation;
}

async function requireOpenSession(username, businessDate) {
  const open = await getRepository(COLLECTIONS.TELLER_SESSIONS).findOneWhere(
    (s) => s.tellerId === username && s.status === 'OPEN',
  );
  if (!open) {
    throw new WorkflowError('No open teller session. Open one with TEL-SESSION-OPEN-001 before cash operations.');
  }
  if (open.businessDate !== businessDate) {
    throw new WorkflowError(`Open session belongs to business date ${open.businessDate}; today is ${businessDate}. Close it first.`);
  }
  return open;
}

async function createTellerRequest({ operationCode, account, amount, extraPayload, summary, session, businessDate }) {
  const request = {
    id: nextId('REQ'),
    operationCode,
    entityType: 'ACCOUNT',
    entityId: account?.accountNumber ?? null,
    summary,
    amount: toCents(amount) / 100,
    payload: { accountNumber: account?.accountNumber ?? null, amount: toCents(amount) / 100, ...extraPayload },
    beforeValues: account
      ? { ledgerBalance: account.ledgerBalance, availableBalance: account.availableBalance, status: account.status }
      : null,
    afterValues: account
      ? { accountNumber: account.accountNumber, amount: toCents(amount) / 100, ...extraPayload }
      : { ...extraPayload },
    makerId: session.username,
    makerRole: session.role,
    checkerId: null,
    decision: null,
    remarks: '',
    status: WORKFLOW_STATUS.PENDING_AUTHORISATION,
    branch: session.branch,
    businessDate,
    createdAt: new Date().toISOString(),
    decidedAt: null,
  };
  await getRepository(COLLECTIONS.AUTHORISATION_REQUESTS).insert(request);
  await recordAudit({
    action: AUDIT_ACTIONS.REQUEST_SUBMITTED,
    entityType: request.entityType,
    entityId: request.entityId ?? request.id,
    performedBy: session.username,
    performedByRole: session.role,
    branch: session.branch,
    businessDate,
    details: { operationCode, requestId: request.id, summary },
  });
  return request;
}

/** Daily withdrawal usage for an account on a business date (posted only). */
export async function dailyWithdrawalUsage(accountNumber, businessDate) {
  const legs = await getRepository(COLLECTIONS.TRANSACTION_LEGS).findWhere(
    (l) => l.accountNumber === accountNumber && l.side === 'DEBIT',
  );
  const transactions = getRepository(COLLECTIONS.TRANSACTIONS);
  let total = 0;
  for (const leg of legs) {
    const txn = await transactions.findById(leg.transactionId);
    if (txn && txn.type === 'CASH_WITHDRAWAL' && txn.status === WORKFLOW_STATUS.POSTED && txn.businessDate === businessDate) {
      total = add(total, leg.amount);
    }
  }
  return total;
}

// ------------------------------------------------------------------ sessions

export async function getOpenTellerSession(username) {
  return getRepository(COLLECTIONS.TELLER_SESSIONS).findOneWhere(
    (s) => s.tellerId === username && s.status === 'OPEN',
  );
}

export async function openTellerSession({ openingCash }, session) {
  assertMaker(session, 'TEL-SESSION-OPEN-001');
  const businessDate = await environmentService.getBusinessDate();

  const existing = await getOpenTellerSession(session.username);
  if (existing) {
    throw new WorkflowError(`You already have an open session (${existing.id}) for ${existing.businessDate}.`);
  }
  const { valid, errors } = validateDeclaredCash(openingCash);
  if (!valid) throw new ValidationError('Opening cash is invalid.', errors);

  const record = {
    id: nextId('TELSES'),
    tellerId: session.username,
    branch: session.branch,
    businessDate,
    openingCash: toCents(openingCash) / 100,
    systemCash: toCents(openingCash) / 100,
    declaredCash: null,
    variance: null,
    status: 'OPEN',
    openedAt: new Date().toISOString(),
    closedAt: null,
    closedBy: null,
  };
  await getRepository(COLLECTIONS.TELLER_SESSIONS).insert(record);
  await recordAudit({
    action: AUDIT_ACTIONS.TELLER_SESSION_OPENED,
    entityType: 'TELLER_SESSION',
    entityId: record.id,
    performedBy: session.username,
    performedByRole: session.role,
    branch: session.branch,
    businessDate,
    details: { openingCash: record.openingCash },
  });
  return record;
}

/** Teller submits a session close with the physical cash counted; authoriser approves. */
export async function requestSessionClose({ declaredCash }, session) {
  assertMaker(session, 'TEL-SESSION-CLOSE-001');
  const businessDate = await environmentService.getBusinessDate();
  const open = await requireOpenSession(session.username, businessDate);

  const { valid, errors } = validateDeclaredCash(declaredCash);
  if (!valid) throw new ValidationError('Declared cash is invalid.', errors);

  return createTellerRequest({
    operationCode: 'TEL-SESSION-CLOSE-001',
    account: null,
    amount: declaredCash,
    extraPayload: { tellerSessionId: open.id, declaredCash: toCents(declaredCash) / 100, systemCash: open.systemCash },
    summary: `Close teller session ${open.id} (${session.username}) - declared cash INR ${declaredCash}`,
    session,
    businessDate,
  });
}

/** Cash position inquiry: session plus expected cash, from live data. */
export async function getTellerPosition(username) {
  const open = await getOpenTellerSession(username);
  if (!open) return { session: null };
  const businessDate = await environmentService.getBusinessDate();
  const transactions = await getRepository(COLLECTIONS.TRANSACTIONS).findWhere(
    (t) => t.maker === username && t.businessDate === businessDate && t.status === WORKFLOW_STATUS.POSTED,
  );
  const deposits = transactions.filter((t) => t.type === 'CASH_DEPOSIT').reduce((s, t) => add(s, t.amount), 0);
  const withdrawals = transactions.filter((t) => t.type === 'CASH_WITHDRAWAL').reduce((s, t) => add(s, t.amount), 0);
  return {
    session: open,
    deposits,
    withdrawals,
    expectedCash: subtract(add(open.openingCash, deposits), withdrawals),
    transactionCount: transactions.filter((t) => ['CASH_DEPOSIT', 'CASH_WITHDRAWAL'].includes(t.type)).length,
  };
}

// ------------------------------------------------------------- cash operations

async function loadAccountAndProduct(accountNumber) {
  const account = await getRepository(COLLECTIONS.ACCOUNTS).findById(accountNumber);
  if (!account) throw new NotFoundError(`Account ${accountNumber} not found.`);
  const product = await getRepository(COLLECTIONS.PRODUCTS).findById(account.productCode);
  return { account, product };
}

export async function cashDeposit({ accountNumber, amount, denominations = {}, remarks = '' }, session) {
  assertMaker(session, 'TEL-CASH-DEPOSIT-001');
  const businessDate = await environmentService.getBusinessDate();
  await requireOpenSession(session.username, businessDate);

  const { account, product } = await loadAccountAndProduct(accountNumber);
  const checks = [
    validateDepositAccount(account),
    validateCashAmount(amount, product),
    validateDenominations(denominations, amount),
  ];
  const errors = Object.assign({}, ...checks.map((c) => c.errors));
  if (Object.keys(errors).length) throw new ValidationError('Cash deposit validation failed.', errors);

  const request = await createTellerRequest({
    operationCode: 'TEL-CASH-DEPOSIT-001',
    account,
    amount,
    extraPayload: { denominations, remarks },
    summary: `Cash deposit of INR ${amount} into ${accountNumber} (${account.customerName ?? account.cif})`,
    session,
    businessDate,
  });
  return { request };
}

export async function cashWithdrawal({ accountNumber, amount, denominations = {}, remarks = '' }, session) {
  assertMaker(session, 'TEL-CASH-WITHDRAWAL-001');
  const businessDate = await environmentService.getBusinessDate();
  await requireOpenSession(session.username, businessDate);

  const { account, product } = await loadAccountAndProduct(accountNumber);
  const dailyUsed = await dailyWithdrawalUsage(accountNumber, businessDate);
  const checks = [
    validateWithdrawalAccount(account),
    validateCashAmount(amount, product, dailyUsed),
    validateSufficientFunds(account, amount),
    validateDenominations(denominations, amount),
  ];
  const errors = Object.assign({}, ...checks.map((c) => c.errors));
  if (Object.keys(errors).length) throw new ValidationError('Cash withdrawal validation failed.', errors);

  const request = await createTellerRequest({
    operationCode: 'TEL-CASH-WITHDRAWAL-001',
    account,
    amount,
    extraPayload: { denominations, remarks, dailyUsedBefore: dailyUsed },
    summary: `Cash withdrawal of INR ${amount} from ${accountNumber} (${account.customerName ?? account.cif})`,
    session,
    businessDate,
  });
  return { request };
}

// --------------------------------------------------------- approval effects
// Called by authorisationService when a checker approves. State is
// re-validated here because it may have changed while the request waited.

export async function applyTellerApprovalEffect(request, session, businessDate) {
  const sessionsRepo = getRepository(COLLECTIONS.TELLER_SESSIONS);

  if (request.operationCode === 'TEL-SESSION-CLOSE-001') {
    const open = await sessionsRepo.findById(request.payload.tellerSessionId);
    if (!open || open.status !== 'OPEN') {
      throw new WorkflowError('Teller session is no longer open.');
    }
    const variance = subtract(request.payload.declaredCash, open.systemCash);
    await sessionsRepo.update(open.id, {
      status: 'CLOSED',
      declaredCash: request.payload.declaredCash,
      variance,
      closedAt: new Date().toISOString(),
      closedBy: session.username,
    });
    await recordAudit({
      action: AUDIT_ACTIONS.TELLER_SESSION_CLOSED,
      entityType: 'TELLER_SESSION',
      entityId: open.id,
      performedBy: session.username,
      performedByRole: session.role,
      branch: request.branch,
      businessDate,
      details: { tellerId: open.tellerId, declaredCash: request.payload.declaredCash, systemCash: open.systemCash, variance },
    });
    if (toCents(variance) !== 0) {
      const exception = {
        id: nextId('EXC'),
        type: 'TELLER_CASH_VARIANCE',
        status: 'OPEN',
        entityId: open.id,
        tellerId: open.tellerId,
        branch: request.branch,
        businessDate,
        message: `Teller ${open.tellerId} declared ${request.payload.declaredCash} but the system expected ${open.systemCash} (variance ${variance}).`,
        createdAt: new Date().toISOString(),
      };
      await getRepository(COLLECTIONS.EXCEPTIONS).insert(exception);
      await recordAudit({
        action: AUDIT_ACTIONS.EXCEPTION_RAISED,
        entityType: 'EXCEPTION',
        entityId: exception.id,
        performedBy: 'SYSTEM',
        branch: request.branch,
        businessDate,
        details: { type: exception.type, tellerId: open.tellerId, variance },
      });
    }
    return { effect: 'TELLER_SESSION_CLOSED', entityId: open.id, variance };
  }

  const { account, product } = await loadAccountAndProduct(request.payload.accountNumber);
  const amount = request.payload.amount;
  const isDeposit = request.operationCode === 'TEL-CASH-DEPOSIT-001';
  const liabilityGl = DEPOSIT_LIABILITY_GL[product?.accountCategory] ?? DEPOSIT_LIABILITY_GL.SAVINGS;

  // Re-validate at approval time: the account may have been frozen or drained meanwhile.
  const rechecks = isDeposit
    ? [validateDepositAccount(account), validateCashAmount(amount, product)]
    : [
        validateWithdrawalAccount(account),
        validateCashAmount(amount, product, await dailyWithdrawalUsage(account.accountNumber, businessDate)),
        validateSufficientFunds(account, amount),
      ];
  const errors = Object.assign({}, ...rechecks.map((c) => c.errors));
  if (Object.keys(errors).length) {
    throw new ValidationError('Approval blocked - account state changed since submission.', errors);
  }

  const { transaction } = await postFinancialTransaction({
    operationCode: request.operationCode,
    type: isDeposit ? 'CASH_DEPOSIT' : 'CASH_WITHDRAWAL',
    amount,
    maker: request.makerId,
    checker: session.username,
    branch: request.branch,
    businessDate,
    remarks: request.payload.remarks || request.summary,
    relatedRequestId: request.id,
    journalLines: isDeposit
      ? [
          { glCode: TELLER_CASH_GL, side: 'DEBIT', amount, narrative: 'Cash received over the counter' },
          { glCode: liabilityGl, side: 'CREDIT', amount, narrative: 'Customer deposit liability rises' },
        ]
      : [
          { glCode: liabilityGl, side: 'DEBIT', amount, narrative: 'Customer deposit liability falls' },
          { glCode: TELLER_CASH_GL, side: 'CREDIT', amount, narrative: 'Cash paid out over the counter' },
        ],
    accountEffects: [{ accountNumber: account.accountNumber, side: isDeposit ? 'CREDIT' : 'DEBIT' }],
  });

  // Track the teller's expected cash for the open session.
  const tellerSession = await getOpenTellerSession(request.makerId);
  if (tellerSession) {
    await sessionsRepo.update(tellerSession.id, {
      systemCash: isDeposit ? add(tellerSession.systemCash, amount) : subtract(tellerSession.systemCash, amount),
    });
  }

  return { effect: isDeposit ? 'CASH_DEPOSIT_POSTED' : 'CASH_WITHDRAWAL_POSTED', entityId: account.accountNumber, transactionId: transaction.id };
}

/** Reversals of teller cash movements adjust the maker's open session cash. */
export async function adjustSessionCashForReversal(tellerId, type, amount) {
  const open = await getOpenTellerSession(tellerId);
  if (!open) return;
  const sessionsRepo = getRepository(COLLECTIONS.TELLER_SESSIONS);
  await sessionsRepo.update(open.id, {
    systemCash: type === 'CASH_DEPOSIT' ? subtract(open.systemCash, amount) : add(open.systemCash, amount),
  });
}

export async function listTellerSessions(username = null) {
  const all = await getRepository(COLLECTIONS.TELLER_SESSIONS).findAll();
  return all
    .filter((s) => !username || s.tellerId === username)
    .sort((a, b) => (a.openedAt < b.openedAt ? 1 : -1));
}
