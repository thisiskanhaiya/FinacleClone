/**
 * Operations that are fully executable in the simulator right now
 * (a real screen exists in OperationHostView's OPERATION_SCREENS map).
 *
 * The Academy uses this list to badge concept pages and module tables as
 * "Live in the simulator", so learners can distinguish operations they can
 * actually perform end to end from those still delivered as placeholders.
 * Keep in sync with OPERATION_SCREENS in src/views/simulator/OperationHostView.vue.
 */
export const LIVE_OPERATION_CODES = Object.freeze([
  'CIF-CREATE-001',
  'CIF-CORP-001',
  'CIF-MODIFY-001',
  'CIF-INQUIRY-001',
  'ACCT-SAV-OPEN-001',
  'ACCT-CUR-OPEN-001',
  'ACCT-INQUIRY-001',
  'TEL-SESSION-OPEN-001',
  'TEL-CASH-DEPOSIT-001',
  'TEL-CASH-WITHDRAWAL-001',
  'TEL-CASH-POSITION-001',
  'TEL-SESSION-CLOSE-001',
  'TXN-REVERSE-001',
  'PAY-INTERNAL-001',
  'PAY-NEFT-001',
  'PAY-RTGS-001',
  'PAY-SI-CREATE-001',
  'PAY-SI-EXECUTE-001',
  'PAY-SI-CANCEL-001',
  'TXN-INQUIRY-001',
  'AUT-QUEUE-001',
  'ENQ-AUDIT-001',
  'ADMIN-USERS-001',
  'ADMIN-RESET-001',
]);

/** Codes a learner can perform as a full banking journey (excludes admin/audit utilities). */
export const LIVE_JOURNEY_CODES = Object.freeze([
  'CIF-CREATE-001',
  'CIF-CORP-001',
  'CIF-MODIFY-001',
  'CIF-INQUIRY-001',
  'ACCT-SAV-OPEN-001',
  'ACCT-CUR-OPEN-001',
  'ACCT-INQUIRY-001',
  'TEL-SESSION-OPEN-001',
  'TEL-CASH-DEPOSIT-001',
  'TEL-CASH-WITHDRAWAL-001',
  'TEL-CASH-POSITION-001',
  'TEL-SESSION-CLOSE-001',
  'TXN-REVERSE-001',
  'PAY-INTERNAL-001',
  'PAY-NEFT-001',
  'PAY-RTGS-001',
  'PAY-SI-CREATE-001',
  'PAY-SI-EXECUTE-001',
  'PAY-SI-CANCEL-001',
  'TXN-INQUIRY-001',
  'AUT-QUEUE-001',
]);

export function isLiveOperation(code) {
  return LIVE_OPERATION_CODES.includes(code);
}
