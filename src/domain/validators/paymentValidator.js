import { toCents } from '../../utils/money.js';

/**
 * Payment validators. Pure functions - no Vue, no storage.
 * Enforced by transferService at submission and re-checked at approval.
 */

const DEBIT_BLOCKED_STATUSES = ['DEBIT_FROZEN', 'FROZEN', 'DORMANT', 'CLOSED', 'PENDING_AUTHORISATION'];
const CREDIT_BLOCKED_STATUSES = ['FROZEN', 'CLOSED', 'PENDING_AUTHORISATION'];

/** Real-world RTGS minimum (₹2 lakh) - kept as a teaching rule. */
export const RTGS_MIN_AMOUNT = 200000;
/** Real-world NEFT has no floor; a soft ceiling keeps training data sane. */
export const NEFT_MAX_AMOUNT = 5000000;

const IFSC_RE = /^[A-Z]{4}0[A-Z0-9]{6}$/;
export const SI_FREQUENCIES = Object.freeze(['MONTHLY', 'QUARTERLY']);

export function validateDebitAccount(account) {
  const errors = {};
  if (!account) {
    errors.sourceAccount = 'Source account not found.';
    return { valid: false, errors };
  }
  if (DEBIT_BLOCKED_STATUSES.includes(account.status)) {
    errors.sourceAccount = `Account ${account.accountNumber} is ${account.status} - debits are not permitted.`;
  }
  return { valid: Object.keys(errors).length === 0, errors };
}

export function validateCreditAccount(account) {
  const errors = {};
  if (!account) {
    errors.destinationAccount = 'Destination account not found.';
    return { valid: false, errors };
  }
  if (CREDIT_BLOCKED_STATUSES.includes(account.status)) {
    errors.destinationAccount = `Account ${account.accountNumber} is ${account.status} - credits are not permitted.`;
  }
  return { valid: Object.keys(errors).length === 0, errors };
}

export function validateTransferAmount(amount, product, dailyUsed = 0) {
  const errors = {};
  let cents;
  try {
    cents = toCents(amount);
    if (cents <= 0) errors.amount = 'Amount must be greater than zero.';
  } catch {
    errors.amount = 'Enter a valid amount (up to 2 decimal places).';
    return { valid: false, errors };
  }
  if (product?.perTransactionLimit != null && cents > toCents(product.perTransactionLimit)) {
    errors.amount = `Amount exceeds the per-transaction limit of ${product.perTransactionLimit.toFixed(2)} for ${product.productCode}.`;
  }
  if (product?.dailyLimit != null && cents + toCents(dailyUsed) > toCents(product.dailyLimit)) {
    errors.amount = `Daily limit for ${product.productCode} would be exceeded (limit ${product.dailyLimit.toFixed(2)}, already used ${Number(dailyUsed).toFixed(2)} today).`;
  }
  return { valid: Object.keys(errors).length === 0, errors };
}

export function validateSufficientFunds(account, amount) {
  const errors = {};
  try {
    if (toCents(account.availableBalance) < toCents(amount)) {
      errors.amount = `Insufficient available balance: ${account.availableBalance.toFixed(2)} available (liens and holds are excluded).`;
    }
  } catch {
    errors.amount = 'Enter a valid amount.';
  }
  return { valid: Object.keys(errors).length === 0, errors };
}

export function validateInternalTransfer({ sourceAccount, destinationAccount, amount }) {
  const errors = {};
  if (sourceAccount && destinationAccount && sourceAccount.accountNumber === destinationAccount.accountNumber) {
    errors.destinationAccount = 'Source and destination cannot be the same account.';
  }
  return { valid: Object.keys(errors).length === 0, errors };
}

export function validateBeneficiary({ beneficiaryName, beneficiaryAccount, ifsc }) {
  const errors = {};
  if (!beneficiaryName || beneficiaryName.trim().length < 3) {
    errors.beneficiaryName = 'Beneficiary name is required (min 3 characters).';
  }
  if (!beneficiaryAccount || String(beneficiaryAccount).trim().length < 6) {
    errors.beneficiaryAccount = 'Beneficiary account number is required (min 6 characters).';
  }
  if (!ifsc || !IFSC_RE.test(ifsc.trim().toUpperCase())) {
    errors.ifsc = 'IFSC must look like ABCD0123456 (4 letters, 0, 6 characters).';
  }
  return { valid: Object.keys(errors).length === 0, errors };
}

export function validateNeftAmount(amount) {
  const errors = {};
  try {
    const cents = toCents(amount);
    if (cents <= 0) errors.amount = 'Amount must be greater than zero.';
    else if (cents > toCents(NEFT_MAX_AMOUNT)) {
      errors.amount = `NEFT above ${NEFT_MAX_AMOUNT.toFixed(2)} must go via RTGS.`;
    }
  } catch {
    errors.amount = 'Enter a valid amount.';
  }
  return { valid: Object.keys(errors).length === 0, errors };
}

export function validateRtgsAmount(amount) {
  const errors = {};
  try {
    if (toCents(amount) < toCents(RTGS_MIN_AMOUNT)) {
      errors.amount = `RTGS is for high-value payments: minimum ${RTGS_MIN_AMOUNT.toFixed(2)}. Use NEFT below that.`;
    }
  } catch {
    errors.amount = 'Enter a valid amount.';
  }
  return { valid: Object.keys(errors).length === 0, errors };
}

export function validateSiPayload({ sourceAccount, destinationAccount, amount, frequency, startDate }) {
  const errors = {};
  if (!SI_FREQUENCIES.includes(frequency)) {
    errors.frequency = `Frequency must be one of ${SI_FREQUENCIES.join(', ')}.`;
  }
  if (!startDate || !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
    errors.startDate = 'Start date is required (YYYY-MM-DD).';
  }
  if (sourceAccount && destinationAccount && sourceAccount.accountNumber === destinationAccount.accountNumber) {
    errors.destinationAccount = 'Source and destination cannot be the same account.';
  }
  try {
    if (toCents(amount) <= 0) errors.amount = 'Amount must be greater than zero.';
  } catch {
    errors.amount = 'Enter a valid amount.';
  }
  return { valid: Object.keys(errors).length === 0, errors };
}
