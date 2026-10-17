/**
 * Audit event factory. Audit events are immutable once written.
 */
export function createAuditEvent({
  id,
  action,
  entityType = null,
  entityId = null,
  performedBy,
  performedByRole = null,
  branch = null,
  businessDate = null,
  result = 'SUCCESS',
  details = {},
  timestamp = new Date().toISOString(),
}) {
  return Object.freeze({
    id,
    action,
    entityType,
    entityId,
    performedBy,
    performedByRole,
    branch,
    businessDate,
    result,
    details,
    timestamp,
  });
}
