/**
 * Canonical workflow statuses for maker-checker requests and transactions.
 */
export const WORKFLOW_STATUS = Object.freeze({
  DRAFT: 'DRAFT',
  VALIDATED: 'VALIDATED',
  PENDING_AUTHORISATION: 'PENDING_AUTHORISATION',
  RETURNED_FOR_CORRECTION: 'RETURNED_FOR_CORRECTION',
  RESUBMITTED: 'RESUBMITTED',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  POSTED: 'POSTED',
  ACTIVE: 'ACTIVE',
  CANCELLED: 'CANCELLED',
  REVERSED: 'REVERSED',
  FAILED: 'FAILED',
});

export function isTerminalStatus(status) {
  return [
    WORKFLOW_STATUS.REJECTED,
    WORKFLOW_STATUS.CANCELLED,
    WORKFLOW_STATUS.REVERSED,
  ].includes(status);
}
