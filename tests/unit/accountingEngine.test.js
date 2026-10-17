import { describe, it, expect } from 'vitest';
import { accountingEngine } from '../../src/engine/AccountingEngine.js';

describe('accounting engine - balancing invariant', () => {
  it('accepts a balanced journal', () => {
    const lines = [
      { side: 'DEBIT', amount: 5000 },
      { side: 'CREDIT', amount: 5000 },
    ];
    expect(accountingEngine.assertBalanced(lines)).toBe(true);
  });

  it('accepts multi-line balanced journals', () => {
    const lines = [
      { side: 'DEBIT', amount: 5000 },
      { side: 'CREDIT', amount: 4900 },
      { side: 'CREDIT', amount: 100 },
    ];
    expect(accountingEngine.assertBalanced(lines)).toBe(true);
  });

  it('blocks an unbalanced journal before posting', () => {
    const lines = [
      { side: 'DEBIT', amount: 5000 },
      { side: 'CREDIT', amount: 4999.99 },
    ];
    expect(() => accountingEngine.assertBalanced(lines)).toThrow(/unbalanced/i);
  });

  it('blocks journals without both sides', () => {
    expect(() => accountingEngine.assertBalanced([{ side: 'DEBIT', amount: 100 }])).toThrow();
    expect(() => accountingEngine.assertBalanced([])).toThrow();
  });

  it('computes totals without floating point drift', () => {
    const totals = accountingEngine.totals([
      { side: 'DEBIT', amount: 0.1 },
      { side: 'DEBIT', amount: 0.2 },
      { side: 'CREDIT', amount: 0.3 },
    ]);
    expect(totals.debits).toBe(0.3);
    expect(totals.credits).toBe(0.3);
    expect(totals.balanced).toBe(true);
  });
});
