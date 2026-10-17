import { describe, it, expect } from 'vitest';
import { toCents, fromCents, add, subtract, compare, formatINR, isPositive } from '../../src/utils/money.js';

describe('money utils (decimal-safe)', () => {
  it('converts amounts to integer cents', () => {
    expect(toCents('100000.00')).toBe(10000000);
    expect(toCents(0.1)).toBe(10);
    expect(toCents('-5.25')).toBe(-525);
  });

  it('rejects invalid amounts', () => {
    expect(() => toCents('abc')).toThrow(TypeError);
    expect(() => toCents('1.999')).toThrow(TypeError);
    expect(() => toCents(null)).toThrow(TypeError);
  });

  it('adds and subtracts without floating point error', () => {
    expect(add(0.1, 0.2)).toBe(0.3);
    expect(subtract(100000, 5000)).toBe(95000);
    expect(add(50000, 5000)).toBe(55000);
  });

  it('compares amounts exactly', () => {
    expect(compare(100.0, 100)).toBe(0);
    expect(compare(100.01, 100)).toBe(1);
    expect(compare(99.99, 100)).toBe(-1);
  });

  it('formats INR with Indian grouping', () => {
    expect(formatINR(100000)).toBe('₹1,00,000.00');
    expect(formatINR(5000)).toBe('₹5,000.00');
    expect(formatINR(-250.5)).toBe('-₹250.50');
  });

  it('detects positive amounts', () => {
    expect(isPositive(0.01)).toBe(true);
    expect(isPositive(0)).toBe(false);
  });

  it('round-trips cents', () => {
    expect(fromCents(toCents('12345.67'))).toBe(12345.67);
  });
});
