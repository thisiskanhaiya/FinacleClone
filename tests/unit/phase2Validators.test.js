import { describe, it, expect } from 'vitest';
import { validateCifPayload, validateCifModification } from '../../src/domain/validators/cifValidator.js';
import { validateAccountOpening } from '../../src/domain/validators/accountOpeningValidator.js';
import { nextSequentialId } from '../../src/utils/sequences.js';

const validRetail = {
  name: 'Test Customer',
  type: 'RETAIL',
  segment: 'REGULAR',
  riskCategory: 'LOW',
  phone: '+91-9800000000',
  email: 'test@example.invalid',
  address: '1 Demo Street',
  idProofType: 'PAN_CARD',
  idProofNumber: 'TESTP0001A',
};

describe('CIF payload validator', () => {
  it('accepts a complete retail payload', () => {
    expect(validateCifPayload(validRetail).valid).toBe(true);
  });

  it('rejects missing name, bad phone and missing ID proof', () => {
    const { valid, errors } = validateCifPayload({ ...validRetail, name: '', phone: 'abc', idProofNumber: '' });
    expect(valid).toBe(false);
    expect(errors.name).toBeTruthy();
    expect(errors.phone).toBeTruthy();
    expect(errors.idProofNumber).toBeTruthy();
  });

  it('requires a registration reference for corporate customers', () => {
    const { valid, errors } = validateCifPayload({ ...validRetail, type: 'CORPORATE', segment: 'SME' });
    expect(valid).toBe(false);
    expect(errors.registrationRef).toBeTruthy();
  });
});

describe('CIF modification validator', () => {
  const before = { phone: '+91-9000000001', email: 'a@example.invalid', address: 'Old', segment: 'REGULAR' };

  it('rejects a submission with no changes', () => {
    const { valid, errors } = validateCifModification(before, { ...before });
    expect(valid).toBe(false);
    expect(errors._form).toBeTruthy();
  });

  it('reports only the touched fields', () => {
    const { valid, touched } = validateCifModification(before, { ...before, email: 'b@example.invalid' });
    expect(valid).toBe(true);
    expect(touched).toEqual(['email']);
  });

  it('rejects invalid phone on a touched field', () => {
    const { valid, errors } = validateCifModification(before, { ...before, phone: 'x' });
    expect(valid).toBe(false);
    expect(errors.phone).toBeTruthy();
  });
});

describe('account opening validator', () => {
  const customer = { cif: 'CIF000001', status: 'ACTIVE', kycStatus: 'COMPLETE', type: 'RETAIL' };
  const product = { productCode: 'SAV-REG', status: 'ACTIVE', accountCategory: 'SAVINGS', minOpeningAmount: 1000 };

  it('accepts an eligible customer meeting the minimum', () => {
    expect(validateAccountOpening({ customer, product, openingAmount: 1000 }).valid).toBe(true);
  });

  it('blocks pending KYC and non-active customers', () => {
    const { errors } = validateAccountOpening({
      customer: { ...customer, status: 'PENDING_AUTHORISATION', kycStatus: 'SUBMITTED' },
      product,
      openingAmount: 5000,
    });
    expect(errors.cif).toMatch(/PENDING_AUTHORISATION/);
    expect(errors.kyc).toMatch(/SUBMITTED/);
  });

  it('enforces the product minimum opening amount', () => {
    const { errors } = validateAccountOpening({ customer, product, openingAmount: 999.99 });
    expect(errors.openingAmount).toMatch(/minimum/i);
  });

  it('blocks savings products for corporate customers', () => {
    const { errors } = validateAccountOpening({
      customer: { ...customer, type: 'CORPORATE' },
      product,
      openingAmount: 5000,
    });
    expect(errors.productCode).toMatch(/retail/i);
  });
});

describe('sequential id helper', () => {
  it('takes the max numeric suffix and adds one', () => {
    expect(nextSequentialId('SB', ['SB000001', 'SB000007'], 6)).toBe('SB000008');
  });

  it('ignores ids with other prefixes', () => {
    expect(nextSequentialId('CA', ['SB000009', 'CA000001'], 6)).toBe('CA000002');
  });

  it('starts at 1 when the collection is empty', () => {
    expect(nextSequentialId('CIF', [], 6)).toBe('CIF000001');
  });
});
