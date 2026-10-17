/**
 * Operation modes supported by the operation screen framework.
 */
export const OPERATION_MODES = Object.freeze({
  ADD: 'ADD',
  MODIFY: 'MODIFY',
  INQUIRE: 'INQUIRE',
  VERIFY: 'VERIFY',
  AUTHORISE: 'AUTHORISE',
  REJECT: 'REJECT',
  RETURN: 'RETURN',
  CANCEL: 'CANCEL',
  CLOSE: 'CLOSE',
  REVERSE: 'REVERSE',
});

export function isValidMode(mode) {
  return Object.values(OPERATION_MODES).includes(mode);
}
