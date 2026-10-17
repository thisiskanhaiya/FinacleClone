import { getOperation } from '../data/operationSpecifications/operations.js';
import { canAccessOperation } from '../domain/rules/permissionRules.js';
import { PermissionError, NotFoundError } from '../utils/errors.js';

/**
 * BankingOperationEngine - resolves operations from the registry and
 * enforces launch permission. This is the service-level gate that runs
 * even if a user bypasses the UI (deep link, console navigation).
 */
export class BankingOperationEngine {
  resolve(code) {
    const operation = getOperation(code);
    if (!operation) {
      throw new NotFoundError(`Unknown operation code: ${code}.`);
    }
    return operation;
  }

  canLaunch(role, code) {
    const operation = getOperation(code);
    if (!operation) return false;
    return canAccessOperation(role, operation);
  }

  assertLaunch(role, code) {
    const operation = this.resolve(code);
    if (!canAccessOperation(role, operation)) {
      throw new PermissionError('Not authorised for your current role.');
    }
    return operation;
  }

  /** Phase 1 delivers the framework; functional screens arrive per phase. */
  isExecutable(operation) {
    return operation.phase === 1;
  }
}

export const bankingOperationEngine = new BankingOperationEngine();
