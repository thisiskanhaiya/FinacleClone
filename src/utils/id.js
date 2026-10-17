/**
 * Reference identifier generator. IDs are prefixed per entity type so
 * audit trails stay readable, e.g. REQ-20261017-000123, TXN-....
 */
let counter = 0;

export function nextId(prefix) {
  counter = (counter + 1) % 1000000;
  const datePart = new Date().toISOString().slice(0, 10).replaceAll('-', '');
  const seq = String(counter).padStart(6, '0');
  const rand = Math.floor(Math.random() * 900 + 100);
  return `${prefix}-${datePart}-${seq}${rand}`;
}

/** Test hook: deterministic IDs when a suite needs them. */
export function __resetIdCounterForTests() {
  counter = 0;
}
