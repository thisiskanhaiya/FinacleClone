import { describe, it, expect } from 'vitest';
import { searchOperations, resolveOperation } from '../../src/services/operationSearchService.js';
import { ROLES } from '../../src/domain/enums/roles.js';

describe('global operation search', () => {
  it('resolves by code, name and keyword to the same operation', () => {
    const byCode = resolveOperation('CIF-CREATE-001');
    const byName = resolveOperation('Create Retail CIF');
    expect(byCode).toBe(byName);

    const viaKeyword = searchOperations('CIF Creation', ROLES.CUSTOMER_SERVICE_MAKER);
    expect(viaKeyword.some((r) => r.code === 'CIF-CREATE-001')).toBe(true);
  });

  it('searching "transfer" surfaces all three transfer operations', () => {
    const results = searchOperations('transfer', ROLES.TELLER);
    const codes = results.map((r) => r.code);
    expect(codes).toContain('PAY-INTERNAL-001');
    expect(codes).toContain('PAY-NEFT-001');
    expect(codes).toContain('PAY-RTGS-001');
  });

  it('matches on module label', () => {
    const results = searchOperations('Term Deposits', ROLES.DEPOSIT_MAKER);
    expect(results.some((r) => r.code === 'TD-CREATE-001')).toBe(true);
  });

  it('flags unauthorised results instead of hiding them by default', () => {
    const results = searchOperations('Create Retail CIF', ROLES.TELLER, { includeUnauthorised: true });
    const cif = results.find((r) => r.code === 'CIF-CREATE-001');
    expect(cif).toBeDefined();
    expect(cif.authorised).toBe(false);
  });

  it('filters out unauthorised operations when configured', () => {
    const results = searchOperations('Create Retail CIF', ROLES.TELLER, { includeUnauthorised: false });
    expect(results.find((r) => r.code === 'CIF-CREATE-001')).toBeUndefined();
  });

  it('auditor sees inquiry operations as authorised but not posting operations', () => {
    const inquiries = searchOperations('Account Inquiry', ROLES.AUDITOR);
    expect(inquiries.find((r) => r.code === 'ACCT-INQUIRY-001')?.authorised).toBe(true);

    const deposits = searchOperations('Cash Deposit', ROLES.AUDITOR);
    expect(deposits.find((r) => r.code === 'TEL-CASH-DEPOSIT-001')?.authorised).toBe(false);
  });

  it('empty query returns the catalogue (palette browse mode)', () => {
    expect(searchOperations('', ROLES.TELLER).length).toBeGreaterThan(0);
  });
});
