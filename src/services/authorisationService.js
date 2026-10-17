import { getRepository, COLLECTIONS } from '../repositories/index.js';
import { authorisationEngine } from '../engine/AuthorisationEngine.js';
import { workflowEngine } from '../engine/WorkflowEngine.js';
import { WORKFLOW_STATUS } from '../domain/enums/workflowStatus.js';
import { AUDIT_ACTIONS } from '../domain/enums/auditActions.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import { getOperation } from '../data/operationSpecifications/operations.js';
import { recordAudit } from './auditService.js';
import { environmentService } from './environmentService.js';
import { postFinancialTransaction } from './postingService.js';
import { DEPOSIT_LIABILITY_GL, TELLER_CASH_GL } from './accountService.js';
import { applyTellerApprovalEffect } from './tellerService.js';
import { applyReversalEffect } from './reversalService.js';
import { applyPaymentApprovalEffect } from './transferService.js';

/**
 * AuthorisationService - checker decisions (Phase 2).
 * Approval applies the operation-specific effect:
 *   CIF create     -> customer becomes ACTIVE, KYC COMPLETE
 *   CIF modify     -> changes applied to the customer record
 *   Account open   -> account becomes ACTIVE and the initial deposit is posted
 *                     (Dr Teller Cash / Cr Deposit Liability, credit to the account)
 */

const DECISION_AUDIT = {
  APPROVE: AUDIT_ACTIONS.REQUEST_APPROVED,
  REJECT: AUDIT_ACTIONS.REQUEST_REJECTED,
  RETURN: AUDIT_ACTIONS.REQUEST_RETURNED,
};

const DECISION_STATUS = {
  APPROVE: WORKFLOW_STATUS.APPROVED,
  REJECT: WORKFLOW_STATUS.REJECTED,
  RETURN: WORKFLOW_STATUS.RETURNED_FOR_CORRECTION,
};

async function applyApprovalEffect(request, session, businessDate) {
  const customers = getRepository(COLLECTIONS.CUSTOMERS);
  const accounts = getRepository(COLLECTIONS.ACCOUNTS);

  switch (request.operationCode) {
    case 'CIF-CREATE-001':
    case 'CIF-CORP-001': {
      await customers.update(request.entityId, { status: 'ACTIVE', kycStatus: 'COMPLETE' });
      return { effect: 'CUSTOMER_ACTIVATED', entityId: request.entityId };
    }
    case 'CIF-MODIFY-001': {
      await customers.update(request.entityId, { ...request.payload.changes });
      return { effect: 'CUSTOMER_MODIFIED', entityId: request.entityId };
    }
    case 'ACCT-SAV-OPEN-001':
    case 'ACCT-CUR-OPEN-001': {
      const account = await accounts.findById(request.entityId);
      if (!account) throw new NotFoundError(`Account ${request.entityId} not found.`);
      await accounts.update(account.id, { status: 'ACTIVE', openedOn: businessDate });
      const liabilityGl = DEPOSIT_LIABILITY_GL[request.operationCode === 'ACCT-CUR-OPEN-001' ? 'CURRENT' : 'SAVINGS'];
      const { transaction } = await postFinancialTransaction({
        operationCode: request.operationCode,
        type: 'INITIAL_DEPOSIT',
        amount: request.payload.openingAmount,
        maker: request.makerId,
        checker: session.username,
        branch: request.branch,
        businessDate,
        remarks: `Initial deposit on account opening (${request.payload.accountNumber})`,
        relatedRequestId: request.id,
        journalLines: [
          { glCode: TELLER_CASH_GL, side: 'DEBIT', amount: request.payload.openingAmount, narrative: 'Cash received from customer' },
          { glCode: liabilityGl, side: 'CREDIT', amount: request.payload.openingAmount, narrative: 'Deposit liability to customer' },
        ],
        accountEffects: [{ accountNumber: request.payload.accountNumber, side: 'CREDIT' }],
      });
      return { effect: 'ACCOUNT_OPENED_WITH_DEPOSIT', entityId: request.entityId, transactionId: transaction.id };
    }
    case 'TEL-CASH-DEPOSIT-001':
    case 'TEL-CASH-WITHDRAWAL-001':
    case 'TEL-SESSION-CLOSE-001':
      return applyTellerApprovalEffect(request, session, businessDate);
    case 'TXN-REVERSE-001':
      return applyReversalEffect(request, session, businessDate);
    case 'PAY-INTERNAL-001':
    case 'PAY-NEFT-001':
    case 'PAY-RTGS-001':
    case 'PAY-SI-CREATE-001':
    case 'PAY-SI-EXECUTE-001':
    case 'PAY-SI-CANCEL-001':
      return applyPaymentApprovalEffect(request, session, businessDate);
    default:
      throw new ValidationError(`No approval effect is implemented for ${request.operationCode} in this phase.`);
  }
}

export async function decideRequest(requestId, decision, remarks, session) {
  const requests = getRepository(COLLECTIONS.AUTHORISATION_REQUESTS);
  const request = await requests.findById(requestId);
  if (!request) throw new NotFoundError(`Request ${requestId} not found.`);

  // Enforce: maker-checker, valid decision on pending request, remarks mandatory.
  const operation = getOperation(request.operationCode);
  authorisationEngine.assertCanDecide(request, session, operation);
  authorisationEngine.assertValidDecision(decision, remarks);
  const nextStatus = DECISION_STATUS[decision];
  workflowEngine.assertTransition(request.status, nextStatus);

  let effectResult = null;
  const businessDate = await environmentService.getBusinessDate();

  // Apply the business effect before marking the request decided; if the effect
  // fails (e.g. validation), the request stays pending and the error surfaces.
  if (decision === 'APPROVE') {
    effectResult = await applyApprovalEffect(request, session, businessDate);
  }

  await requests.update(requestId, {
    status: nextStatus,
    checkerId: session.username,
    decision,
    remarks,
    decidedAt: new Date().toISOString(),
  });

  await recordAudit({
    action: DECISION_AUDIT[decision],
    entityType: request.entityType,
    entityId: request.entityId,
    performedBy: session.username,
    performedByRole: session.role,
    branch: session.branch,
    businessDate,
    details: { requestId, operationCode: request.operationCode, decision, remarks, effect: effectResult },
  });

  return { request: await requests.findById(requestId), effect: effectResult };
}

export async function listQueue({ status = WORKFLOW_STATUS.PENDING_AUTHORISATION, includeMine = true } = {}, session) {
  const all = await getRepository(COLLECTIONS.AUTHORISATION_REQUESTS).findAll();
  return all
    .filter((r) => r.status === status)
    .filter((r) => includeMine || r.makerId !== session?.username)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export async function listRequestHistory(session) {
  const all = await getRepository(COLLECTIONS.AUTHORISATION_REQUESTS).findAll();
  return all
    .filter((r) => r.status !== WORKFLOW_STATUS.PENDING_AUTHORISATION)
    .filter((r) => r.makerId === session?.username || r.checkerId === session?.username)
    .sort((a, b) => ((a.decidedAt ?? '') < (b.decidedAt ?? '') ? 1 : -1));
}

export async function getRequest(id) {
  return getRepository(COLLECTIONS.AUTHORISATION_REQUESTS).findById(id);
}
