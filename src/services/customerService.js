import { getRepository, COLLECTIONS } from '../repositories/index.js';
import { validateCifPayload, validateCifModification } from '../domain/validators/cifValidator.js';
import { canMakeOperation } from '../domain/rules/permissionRules.js';
import { getOperation } from '../data/operationSpecifications/operations.js';
import { WORKFLOW_STATUS } from '../domain/enums/workflowStatus.js';
import { AUDIT_ACTIONS } from '../domain/enums/auditActions.js';
import { PermissionError, ValidationError, NotFoundError } from '../utils/errors.js';
import { recordAudit } from './auditService.js';
import { environmentService } from './environmentService.js';
import { nextId } from '../utils/id.js';
import { nextSequentialId } from '../utils/sequences.js';

/**
 * CustomerService - CIF lifecycle use cases (Phase 2).
 * Service-level permission enforcement: a component bug or a crafted call
 * cannot create a CIF without the maker capability.
 */

function assertMaker(session, operationCode) {
  const operation = getOperation(operationCode);
  if (!canMakeOperation(session?.role, operation)) {
    throw new PermissionError('Not authorised for your current role.');
  }
  return operation;
}

async function createRequest({ operationCode, entityType, entityId, summary, payload, beforeValues, afterValues, session }) {
  const businessDate = await environmentService.getBusinessDate();
  const request = {
    id: nextId('REQ'),
    operationCode,
    entityType,
    entityId,
    summary,
    amount: null,
    payload,
    beforeValues,
    afterValues,
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
    entityType,
    entityId,
    performedBy: session.username,
    performedByRole: session.role,
    branch: session.branch,
    businessDate,
    details: { operationCode, requestId: request.id, summary },
  });
  return request;
}

export async function createCif(payload, session) {
  const operationCode = payload.type === 'CORPORATE' ? 'CIF-CORP-001' : 'CIF-CREATE-001';
  assertMaker(session, operationCode);

  const { valid, errors } = validateCifPayload(payload);
  if (!valid) throw new ValidationError('CIF validation failed. Review the validation panel.', errors);

  const customers = getRepository(COLLECTIONS.CUSTOMERS);
  const duplicate = await customers.findOneWhere(
    (c) => c.name.toLowerCase() === payload.name.trim().toLowerCase()
      && c.phone === payload.phone
      && c.status !== 'REJECTED',
  );
  if (duplicate) {
    throw new ValidationError(`Possible duplicate: ${duplicate.name} (${duplicate.cif}) already exists with this phone.`);
  }

  const existingIds = (await customers.findAll()).map((c) => c.cif);
  const cif = nextSequentialId('CIF', existingIds, 6);
  const customer = {
    id: cif,
    cif,
    name: payload.name.trim(),
    type: payload.type,
    segment: payload.segment,
    riskCategory: payload.riskCategory,
    kycStatus: 'SUBMITTED',
    kyc: { idProofType: payload.idProofType, idProofNumber: payload.idProofNumber },
    registrationRef: payload.registrationRef ?? null,
    status: WORKFLOW_STATUS.PENDING_AUTHORISATION,
    branch: session.branch,
    email: payload.email ?? '',
    phone: payload.phone,
    address: payload.address,
    isStaff: false,
    fictional: true,
  };
  await customers.insert(customer);

  const request = await createRequest({
    operationCode,
    entityType: 'CUSTOMER',
    entityId: cif,
    summary: `Create ${payload.type === 'CORPORATE' ? 'corporate' : 'retail'} CIF - ${customer.name}`,
    payload: { ...payload, cif },
    beforeValues: null,
    afterValues: { ...payload, cif },
    session,
  });

  return { customer, request };
}

export async function modifyCif(cif, changes, session) {
  assertMaker(session, 'CIF-MODIFY-001');

  const customers = getRepository(COLLECTIONS.CUSTOMERS);
  const customer = await customers.findById(cif);
  if (!customer) throw new NotFoundError(`Customer ${cif} not found.`);
  if (customer.status !== 'ACTIVE') {
    throw new ValidationError(`CIF ${cif} is ${customer.status} - only ACTIVE customers can be modified.`);
  }

  const { valid, errors, touched } = validateCifModification(customer, changes);
  if (!valid) throw new ValidationError('Modification validation failed.', errors);

  const beforeValues = Object.fromEntries(touched.map((k) => [k, customer[k]]));
  const afterValues = Object.fromEntries(touched.map((k) => [k, changes[k]]));

  const request = await createRequest({
    operationCode: 'CIF-MODIFY-001',
    entityType: 'CUSTOMER',
    entityId: cif,
    summary: `Modify customer ${customer.name} (${cif}): ${touched.join(', ')}`,
    payload: { changes: afterValues },
    beforeValues,
    afterValues,
    session,
  });
  return { customer, request, touched };
}

/** Maker edits a returned request and resubmits it for authorisation. */
export async function resubmitRequest(requestId, updatedPayload, session) {
  const requests = getRepository(COLLECTIONS.AUTHORISATION_REQUESTS);
  const request = await requests.findById(requestId);
  if (!request) throw new NotFoundError(`Request ${requestId} not found.`);
  if (request.makerId !== session.username) {
    throw new PermissionError('Only the original maker can resubmit a returned request.');
  }
  if (request.status !== WORKFLOW_STATUS.RETURNED_FOR_CORRECTION) {
    throw new ValidationError(`Request is ${request.status} - only RETURNED_FOR_CORRECTION requests can be resubmitted.`);
  }

  // For create operations, the payload replaces the record content too.
  if (request.operationCode === 'CIF-CREATE-001' || request.operationCode === 'CIF-CORP-001') {
    const { valid, errors } = validateCifPayload(updatedPayload);
    if (!valid) throw new ValidationError('CIF validation failed. Review the validation panel.', errors);
    await getRepository(COLLECTIONS.CUSTOMERS).update(request.entityId, {
      name: updatedPayload.name.trim(),
      type: updatedPayload.type,
      segment: updatedPayload.segment,
      riskCategory: updatedPayload.riskCategory,
      email: updatedPayload.email ?? '',
      phone: updatedPayload.phone,
      address: updatedPayload.address,
      registrationRef: updatedPayload.registrationRef ?? null,
      kyc: { idProofType: updatedPayload.idProofType, idProofNumber: updatedPayload.idProofNumber },
    });
  }

  await requests.update(requestId, {
    payload: { ...updatedPayload },
    afterValues: { ...updatedPayload, cif: request.entityId },
    status: WORKFLOW_STATUS.PENDING_AUTHORISATION, // RETURNED -> RESUBMITTED -> PENDING
    resubmittedAt: new Date().toISOString(),
  });
  const businessDate = await environmentService.getBusinessDate();
  await recordAudit({
    action: AUDIT_ACTIONS.REQUEST_SUBMITTED,
    entityType: request.entityType,
    entityId: request.entityId,
    performedBy: session.username,
    performedByRole: session.role,
    branch: session.branch,
    businessDate,
    details: { operationCode: request.operationCode, requestId, resubmission: true },
  });
  return requests.findById(requestId);
}

export async function searchCustomers(query) {
  const q = String(query ?? '').trim().toLowerCase();
  const all = await getRepository(COLLECTIONS.CUSTOMERS).findAll();
  if (!q) return all;
  return all.filter(
    (c) => c.cif.toLowerCase().includes(q) || c.name.toLowerCase().includes(q),
  );
}

export async function getCustomer(cif) {
  return getRepository(COLLECTIONS.CUSTOMERS).findById(cif);
}
