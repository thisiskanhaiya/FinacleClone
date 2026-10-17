import { getOperation } from '../data/operationSpecifications/operations.js';
import { canAccessOperation } from '../domain/rules/permissionRules.js';

/**
 * Pure navigation decision function - unit tested without a browser.
 *
 * Returns one of:
 *   { action: 'allow' }
 *   { action: 'login', redirect: string }
 *   { action: 'forbidden', reason: string }
 *   { action: 'notfound' }
 */
export function decideNavigation(to, session) {
  if (to.meta?.public) return { action: 'allow' };

  if (!session) {
    return { action: 'login', redirect: to.fullPath };
  }

  // Dynamic operation host: /simulator/operations/:code
  if (to.meta?.dynamicOperation) {
    const code = String(to.params.code ?? '').toUpperCase();
    const operation = getOperation(code);
    if (!operation) return { action: 'notfound' };
    if (!canAccessOperation(session.role, operation)) {
      return { action: 'forbidden', reason: 'NOT_AUTHORISED', operationCode: code };
    }
    return { action: 'allow', operationCode: code };
  }

  if (to.meta?.operationCode) {
    const operation = getOperation(to.meta.operationCode);
    if (!operation) return { action: 'notfound' };
    if (!canAccessOperation(session.role, operation)) {
      return { action: 'forbidden', reason: 'NOT_AUTHORISED', operationCode: operation.code };
    }
  }

  if (to.meta?.roles && !to.meta.roles.includes(session.role)) {
    return { action: 'forbidden', reason: 'ROLE_NOT_ALLOWED' };
  }

  return { action: 'allow' };
}
