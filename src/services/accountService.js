import { getRepository, COLLECTIONS } from '../repositories/index.js';
import { validateAccountOpening } from '../domain/validators/accountOpeningValidator.js';
import { canMakeOperation } from '../domain/rules/permissionRules.js';
import { getOperation } from '../data/operationSpecifications/operations.js';
import { WORKFLOW_STATUS } from '../domain/enums/workflowStatus.js';
import { AUDIT_ACTIONS } from '../domain/enums/auditActions.js';
import { PermissionError, ValidationError, NotFoundError } from '../utils/errors.js';
import { recordAudit } from './auditService.js';
import { environmentService } from './environmentService.js';
import { nextId } from '../utils/id.js';
import { nextSequentialId } from '../utils/sequences.js';

/** Product GL routing for initial deposits. */
export const DEPOSIT_LIABILITY_GL = { SAVINGS: 'TRN-GL-2001', CURRENT: 'TRN-GL-2002' };
export const TELLER_CASH_GL = 'TRN-GL-1001';

function assertMaker(session, operationCode) {
  const operation = getOperation(operationCode);
  if (!canMakeOperation(session?.role, operation)) {
    throw new PermissionError('Not authorised for your current role.');
  }
  return operation;
}

export async function openAccount({ cif, productCode, openingAmount, nomination }, session) {
  const accountsRepo = getRepository(COLLECTIONS.ACCOUNTS);
  const product = await getRepository(COLLECTIONS.PRODUCTS).findById(productCode);
  if (!product) throw new NotFoundError(`Product ${productCode} not found.`);

  const operationCode = product.accountCategory === 'CURRENT' ? 'ACCT-CUR-OPEN-001' : 'ACCT-SAV-OPEN-001';
  assertMaker(session, operationCode);

  const customer = await getRepository(COLLECTIONS.CUSTOMERS).findById(cif);
  if (!customer) throw new NotFoundError(`Customer ${cif} not found.`);

  const result = validateAccountOpening({ product, customer, openingAmount });
  if (!result.valid) throw new ValidationError('Account opening validation failed.', result.errors);

  // Savings accounts use the SB prefix, current accounts CA (matches seed data).
  const prefix = product.accountCategory === 'CURRENT' ? 'CA' : 'SB';
  const existingIds = (await accountsRepo.findAll()).map((a) => a.id);
  const accountNumber = nextSequentialId(prefix, existingIds, 6);
  const account = {
    id: accountNumber,
    accountNumber,
    cif,
    customerName: customer.name,
    productCode,
    category: product.accountCategory,
    branch: session.branch,
    status: WORKFLOW_STATUS.PENDING_AUTHORISATION,
    currency: 'INR',
    ledgerBalance: 0,
    availableBalance: 0,
    lienAmount: 0,
    openedOn: null,
    nominee: nomination ?? null,
    scheme: product.name,
    isStaffAccount: false,
    fictional: true,
  };
  await accountsRepo.insert(account);

  const businessDate = await environmentService.getBusinessDate();
  const request = {
    id: nextId('REQ'),
    operationCode,
    entityType: 'ACCOUNT',
    entityId: accountNumber,
    summary: `Open ${product.name} for ${customer.name} (${cif}) - initial deposit INR ${openingAmount}`,
    amount: Number(openingAmount),
    payload: { cif, productCode, openingAmount: Number(openingAmount), nomination: nomination ?? null, accountNumber },
    beforeValues: null,
    afterValues: { accountNumber, cif, productCode, openingAmount: Number(openingAmount) },
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
    entityType: 'ACCOUNT',
    entityId: accountNumber,
    performedBy: session.username,
    performedByRole: session.role,
    branch: session.branch,
    businessDate,
    details: { operationCode, requestId: request.id, summary: request.summary },
  });
  return { account, request };
}

export async function searchAccounts(query) {
  const q = String(query ?? '').trim().toLowerCase();
  const all = await getRepository(COLLECTIONS.ACCOUNTS).findAll();
  if (!q) return all;
  const customers = getRepository(COLLECTIONS.CUSTOMERS);
  const matched = [];
  for (const a of all) {
    if (a.accountNumber.toLowerCase().includes(q) || a.cif.toLowerCase().includes(q)) {
      matched.push(a);
      continue;
    }
    const c = await customers.findById(a.cif);
    if (c && c.name.toLowerCase().includes(q)) matched.push(a);
  }
  return matched;
}

export async function getAccount(accountNumber) {
  return getRepository(COLLECTIONS.ACCOUNTS).findById(accountNumber);
}

export async function getAccountTransactions(accountNumber) {
  const legs = await getRepository(COLLECTIONS.TRANSACTION_LEGS).findWhere(
    (l) => l.accountNumber === accountNumber,
  );
  const transactions = getRepository(COLLECTIONS.TRANSACTIONS);
  const rows = [];
  for (const leg of legs) {
    const txn = await transactions.findById(leg.transactionId);
    if (txn) rows.push({ ...leg, txn });
  }
  return rows.sort((a, b) => (a.txn.postedAt < b.txn.postedAt ? 1 : -1));
}
