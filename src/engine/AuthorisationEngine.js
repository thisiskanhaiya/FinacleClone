import { PermissionError, ValidationError } from '../utils/errors.js';
import { canAuthoriseOperation } from '../domain/rules/permissionRules.js';
import { workflowEngine } from './WorkflowEngine.js';

/**
 * AuthorisationEngine - central maker-checker decision rules.
 *
 * Rules enforced here (service layer calls these before persisting anything):
 *   - maker can never authorise their own request
 *   - checker must hold authorisation capability for the operation
 *   - rejection and return require remarks
 *   - only PENDING_AUTHORISATION requests can be decided (no duplicates)
 */
export class AuthorisationEngine {
  /**
   * @param {object} request  authorisation request { makerId, operationCode, status }
   * @param {object} user     session user { username, role }
   * @param {object} operation operation registry entry
   */
  assertCanDecide(request, user, operation) {
    if (!request) throw new ValidationError('Authorisation request not found.');
    workflowEngine.assertDecidable(request.status);
    if (request.makerId === user.username) {
      throw new PermissionError('Maker cannot authorise their own request.');
    }
    if (!canAuthoriseOperation(user.role, operation)) {
      throw new PermissionError('Your role cannot authorise this operation.');
    }
    return true;
  }

  /**
   * Validate a decision payload.
   * decision: APPROVE | REJECT | RETURN
   */
  assertValidDecision(decision, remarks) {
    const allowed = ['APPROVE', 'REJECT', 'RETURN'];
    if (!allowed.includes(decision)) {
      throw new ValidationError(`Decision must be one of ${allowed.join(', ')}.`);
    }
    if ((decision === 'REJECT' || decision === 'RETURN') && !(remarks && remarks.trim())) {
      throw new ValidationError(`Remarks are mandatory when the decision is ${decision}.`);
    }
    return true;
  }
}

export const authorisationEngine = new AuthorisationEngine();
