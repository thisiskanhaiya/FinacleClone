/**
 * Decimal-safe money helpers. All amounts are converted to integer cents
 * internally so floating point errors never reach balances or journals.
 */

export function toCents(amount) {
  if (amount === null || amount === undefined || amount === '') {
    throw new TypeError('Amount is required.');
  }
  const text = String(amount).trim();
  if (!/^-?\d+(\.\d{1,2})?$/.test(text)) {
    throw new TypeError(`Invalid amount: "${amount}". Use up to 2 decimal places.`);
  }
  const negative = text.startsWith('-');
  const [whole, fraction = ''] = text.replace('-', '').split('.');
  const cents = Number(whole) * 100 + Number((fraction + '00').slice(0, 2));
  return negative ? -cents : cents;
}

export function fromCents(cents) {
  return cents / 100;
}

export function add(a, b) {
  return fromCents(toCents(a) + toCents(b));
}

export function subtract(a, b) {
  return fromCents(toCents(a) - toCents(b));
}

/** Returns -1, 0 or 1 comparing two amounts exactly. */
export function compare(a, b) {
  const diff = toCents(a) - toCents(b);
  return diff === 0 ? 0 : diff > 0 ? 1 : -1;
}

export function isPositive(amount) {
  return toCents(amount) > 0;
}

export function isZero(amount) {
  return toCents(amount) === 0;
}

/** Formats an amount as Indian Rupees with lakh/crore grouping. */
export function formatINR(amount) {
  const cents = toCents(amount);
  const negative = cents < 0;
  const abs = Math.abs(cents) / 100;
  const [whole, fraction] = abs.toFixed(2).split('.');
  const lastThree = whole.slice(-3);
  const rest = whole.slice(0, -3);
  const grouped = rest ? rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree : lastThree;
  return `${negative ? '-' : ''}₹${grouped}.${fraction}`;
}
