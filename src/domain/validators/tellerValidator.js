import { toCents } from '../../utils/money.js';

/**
 * Teller validations. Pure functions - no Vue, no storage.
 * Enforced by tellerService at entry AND re-checked on approval (the account
 * state may have changed while the request waited in the queue).
 */

/** Statuses from which money may not leave the account. */
const DEBIT_BLOCKED_STATUSES = ['DEBIT_FROZEN', 'FROZEN', 'DORMANT', 'CLOSED', 'PENDING_AUTHORISATION'];
/** Statuses that may not receive money either. */
const CREDIT_BLOCKED_STATUSES = ['FROZEN', 'CLOSED', 'PENDING_AUTHORISATION'];

export const DENOMINATIONS = Object.freeze([2000, 500, 200, 100, 50, 20, 10, 5, 2, 1]);

export function validateCashAmount(amount, product, dailyUsed = 0) {
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

export function validateWithdrawalAccount(account) {
  const errors = {};
  if (!account) {
    errors.accountNumber = 'Account not found.';
    return { valid: false, errors };
  }
  if (DEBIT_BLOCKED_STATUSES.includes(account.status)) {
    errors.accountNumber = `Account ${account.accountNumber} is ${account.status} - withdrawals are not permitted.`;
  }
  return { valid: Object.keys(errors).length === 0, errors };
}

export function validateDepositAccount(account) {
  const errors = {};
  if (!account) {
    errors.accountNumber = 'Account not found.';
    return { valid: false, errors };
  }
  if (CREDIT_BLOCKED_STATUSES.includes(account.status)) {
    errors.accountNumber = `Account ${account.accountNumber} is ${account.status} - deposits are not permitted.`;
  }
  return { valid: Object.keys(errors).length === 0, errors };
}

export function validateSufficientFunds(account, amount) {
  const errors = {};
  try {
    if (toCents(account.availableBalance) < toCents(amount)) {
      errors.amount = `Insufficient available balance: ${account.availableBalance.toFixed(2)} available (lien and holds are excluded).`;
    }
  } catch {
    errors.amount = 'Enter a valid amount.';
  }
  return { valid: Object.keys(errors).length === 0, errors };
}

/** Denomination capture: if any denomination is entered, the total must equal the amount. */
export function validateDenominations(denominations, amount) {
  const counts = Object.entries(denominations ?? {})
    .filter(([, n]) => Number(n) > 0)
    .map(([d, n]) => [Number(d), Number(n)]);
  if (counts.length === 0) return { valid: true, errors: {}, total: 0, captured: false };
  for (const [d, n] of counts) {
    if (!DENOMINATIONS.includes(d) || !Number.isInteger(n)) {
      return { valid: false, errors: { denominations: 'Invalid denomination breakdown.' }, total: 0, captured: true };
    }
  }
  const totalCents = counts.reduce((s, [d, n]) => s + d * 100 * n, 0);
  if (totalCents !== toCents(amount)) {
    return {
      valid: false,
      errors: { denominations: `Denominations total ${(totalCents / 100).toFixed(2)} - must equal the amount exactly.` },
      total: totalCents / 100,
      captured: true,
    };
  }
  return { valid: true, errors: {}, total: totalCents / 100, captured: true };
}

export function validateDeclaredCash(declared) {
  const errors = {};
  try {
    const cents = toCents(declared);
    if (cents < 0) errors.declaredCash = 'Declared cash cannot be negative.';
  } catch {
    errors.declaredCash = 'Enter the physical cash counted (e.g. 45000.00).';
  }
  return { valid: Object.keys(errors).length === 0, errors };
}
