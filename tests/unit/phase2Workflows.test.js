import { describe, it, expect, beforeEach } from 'vitest';
import { createCif, modifyCif, resubmitRequest } from '../../src/services/customerService.js';
import { openAccount } from '../../src/services/accountService.js';
import { decideRequest } from '../../src/services/authorisationService.js';
import { postFinancialTransaction } from '../../src/services/postingService.js';
import { getRepository, COLLECTIONS } from '../../src/repositories/index.js';
import { AUDIT_ACTIONS } from '../../src/domain/enums/auditActions.js';
import customers from '../../src/data/seed/customers.json';
import accounts from '../../src/data/seed/accounts.json';
import products from '../../src/data/seed/products.json';
import glAccounts from '../../src/data/seed/glAccounts.json';
import authorisationRequests from '../../src/data/seed/authorisationRequests.json';

/**
 * Phase 2 end-to-end maker-checker journeys, executed against jsdom
 * localStorage exactly as the running app does (same repositories).
 */

const MAKER = { username: 'maker01', role: 'CUSTOMER_SERVICE_MAKER', branch: 'BR001' };
const CHECKER = { username: 'checker01', role: 'OPERATIONS_CHECKER', branch: 'BR001' };
const TELLER = { username: 'teller01', role: 'TELLER', branch: 'BR001' };

function seedCollections() {
  globalThis.localStorage.setItem('cbte:bankParameters', JSON.stringify([{ id: 'BANK-PARAMS', businessDate: '2026-10-17' }]));
  globalThis.localStorage.setItem('cbte:customers', JSON.stringify(structuredClone(customers)));
  globalThis.localStorage.setItem('cbte:accounts', JSON.stringify(structuredClone(accounts)));
  globalThis.localStorage.setItem('cbte:products', JSON.stringify(structuredClone(products)));
  globalThis.localStorage.setItem('cbte:glAccounts', JSON.stringify(structuredClone(glAccounts)));
  globalThis.localStorage.setItem('cbte:authorisationRequests', JSON.stringify(structuredClone(authorisationRequests)));
}

const repo = (name) => getRepository(COLLECTIONS[name]);

async function auditActions() {
  return (await repo('AUDIT_EVENTS').findAll()).map((e) => e.action);
}

beforeEach(() => {
  globalThis.localStorage.clear();
  globalThis.sessionStorage.clear();
  seedCollections();
});

describe('Journey 1: CIF creation end to end', () => {
  const payload = {
    name: 'Priya Nair',
    type: 'RETAIL',
    segment: 'REGULAR',
    riskCategory: 'LOW',
    phone: '+91-9800000011',
    email: 'priya.nair@example.invalid',
    address: '22 Demo Lane, Kochi',
    idProofType: 'AADHAAR',
    idProofNumber: 'XXXX-XXXX-1234',
  };

  it('maker submits -> customer is PENDING_AUTHORISATION -> checker approves -> ACTIVE', async () => {
    const { customer, request } = await createCif(payload, MAKER);
    expect(customer.cif).toBe('CIF000008'); // next after the seven seeded CIFs
    expect(customer.status).toBe('PENDING_AUTHORISATION');
    expect(request.status).toBe('PENDING_AUTHORISATION');

    const { request: decided, effect } = await decideRequest(request.id, 'APPROVE', '', CHECKER);
    expect(decided.status).toBe('APPROVED');
    expect(decided.checkerId).toBe('checker01');
    expect(effect.effect).toBe('CUSTOMER_ACTIVATED');

    const after = await repo('CUSTOMERS').findById(customer.cif);
    expect(after.status).toBe('ACTIVE');
    expect(after.kycStatus).toBe('COMPLETE');

    const actions = await auditActions();
    expect(actions).toContain(AUDIT_ACTIONS.REQUEST_SUBMITTED);
    expect(actions).toContain(AUDIT_ACTIONS.REQUEST_APPROVED);
  });

  it('maker can never authorise their own request', async () => {
    const { request } = await createCif(payload, MAKER);
    await expect(decideRequest(request.id, 'APPROVE', '', MAKER))
      .rejects.toMatchObject({ code: 'NOT_AUTHORISED' });
    // The request is untouched.
    expect((await repo('AUTHORISATION_REQUESTS').findById(request.id)).status).toBe('PENDING_AUTHORISATION');
  });

  it('reject requires remarks and blocks the CIF', async () => {
    const { request, customer } = await createCif(payload, MAKER);
    await expect(decideRequest(request.id, 'REJECT', '', CHECKER))
      .rejects.toMatchObject({ code: 'VALIDATION_FAILED' });

    const { request: rejected } = await decideRequest(request.id, 'REJECT', 'ID proof unclear', CHECKER);
    expect(rejected.status).toBe('REJECTED');
    expect((await repo('CUSTOMERS').findById(customer.cif)).status).toBe('PENDING_AUTHORISATION');
  });

  it('duplicate approval is impossible', async () => {
    const { request } = await createCif(payload, MAKER);
    await decideRequest(request.id, 'APPROVE', '', CHECKER);
    await expect(decideRequest(request.id, 'APPROVE', '', CHECKER))
      .rejects.toMatchObject({ code: 'WORKFLOW_VIOLATION' });
  });

  it('a teller cannot make a CIF request (service-level permission)', async () => {
    await expect(createCif(payload, TELLER)).rejects.toMatchObject({ code: 'NOT_AUTHORISED' });
  });

  it('duplicate detection blocks same name + phone', async () => {
    await expect(createCif({ ...payload, name: 'Amit Sharma', phone: '+91-9000000001' }, MAKER))
      .rejects.toMatchObject({ code: 'VALIDATION_FAILED' });
  });

  it('return -> maker resubmits -> checker approves', async () => {
    const { request, customer } = await createCif(payload, MAKER);
    await decideRequest(request.id, 'RETURN', 'Address proof missing', CHECKER);
    expect((await repo('AUTHORISATION_REQUESTS').findById(request.id)).status).toBe('RETURNED_FOR_CORRECTION');

    const resubmitted = await resubmitRequest(request.id, { ...payload, address: '22 Demo Lane, Kochi - updated' }, MAKER);
    expect(resubmitted.status).toBe('PENDING_AUTHORISATION');

    await decideRequest(request.id, 'APPROVE', '', CHECKER);
    expect((await repo('CUSTOMERS').findById(customer.cif)).status).toBe('ACTIVE');
  });

  it('seeded pending request for CIF000004 is live in the queue', async () => {
    const seedReq = await repo('AUTHORISATION_REQUESTS').findById('REQ-SEED-001');
    expect(seedReq.status).toBe('PENDING_AUTHORISATION');
    const { effect } = await decideRequest('REQ-SEED-001', 'APPROVE', '', CHECKER);
    expect(effect.effect).toBe('CUSTOMER_ACTIVATED');
    expect((await repo('CUSTOMERS').findById('CIF000004')).status).toBe('ACTIVE');
  });
});

describe('Journey 2: CIF modification end to end', () => {
  it('maker modifies -> checker approves -> before/after applied', async () => {
    const { request, touched } = await modifyCif(
      'CIF000001',
      { phone: '+91-9111111111', email: 'amit.sharma@example.invalid', address: 'New Address 9', segment: 'PREMIUM' },
      MAKER,
    );
    expect(touched).toEqual(expect.arrayContaining(['phone', 'address', 'segment']));
    expect(request.beforeValues.phone).toBe('+91-9000000001');
    expect(request.afterValues.segment).toBe('PREMIUM');

    await decideRequest(request.id, 'APPROVE', '', CHECKER);
    const after = await repo('CUSTOMERS').findById('CIF000001');
    expect(after.phone).toBe('+91-9111111111');
    expect(after.segment).toBe('PREMIUM');
    expect(after.address).toBe('New Address 9');
  });

  it('rejects modification with no changes', async () => {
    const c = await repo('CUSTOMERS').findById('CIF000001');
    await expect(
      modifyCif('CIF000001', { phone: c.phone, email: c.email, address: '', segment: c.segment }, MAKER),
    ).rejects.toMatchObject({ code: 'VALIDATION_FAILED' });
  });
});

describe('Journey 3: account opening with initial deposit posting', () => {
  it('maker opens savings -> checker approves -> deposit posts, journal balances, GLs move', async () => {
    const { account, request } = await openAccount(
      { cif: 'CIF000002', productCode: 'SAV-REG', openingAmount: '5000.00' },
      MAKER,
    );
    expect(account.accountNumber).toBe('SB000008');
    expect(account.status).toBe('PENDING_AUTHORISATION');

    const cashBefore = (await repo('GL_ACCOUNTS').findById('TRN-GL-1001')).balance;
    const savBefore = (await repo('GL_ACCOUNTS').findById('TRN-GL-2001')).balance;

    const { effect } = await decideRequest(request.id, 'APPROVE', '', CHECKER);
    expect(effect.effect).toBe('ACCOUNT_OPENED_WITH_DEPOSIT');

    // Account is ACTIVE with the deposit credited.
    const opened = await repo('ACCOUNTS').findById('SB000008');
    expect(opened.status).toBe('ACTIVE');
    expect(opened.ledgerBalance).toBe(5000);
    expect(opened.availableBalance).toBe(5000);
    expect(opened.openedOn).toBe('2026-10-17');

    // GL movement: Dr Teller Cash 5000, Cr Savings Liability 5000.
    expect((await repo('GL_ACCOUNTS').findById('TRN-GL-1001')).balance).toBe(cashBefore + 5000);
    expect((await repo('GL_ACCOUNTS').findById('TRN-GL-2001')).balance).toBe(savBefore + 5000);

    // Journal is balanced and fully written.
    const journals = await repo('JOURNALS').findAll();
    expect(journals.length).toBe(1);
    const lines = await repo('JOURNAL_LINES').findWhere((l) => l.journalId === journals[0].id);
    const debit = lines.filter((l) => l.side === 'DEBIT').reduce((s, l) => s + l.amount, 0);
    const credit = lines.filter((l) => l.side === 'CREDIT').reduce((s, l) => s + l.amount, 0);
    expect(debit).toBe(5000);
    expect(credit).toBe(5000);

    // Transaction leg shows balanceAfter.
    const legs = await repo('TRANSACTION_LEGS').findWhere((l) => l.accountNumber === 'SB000008');
    expect(legs.length).toBe(1);
    expect(legs[0].side).toBe('CREDIT');
    expect(legs[0].balanceAfter).toBe(5000);

    const actions = await auditActions();
    expect(actions).toContain(AUDIT_ACTIONS.TRANSACTION_POSTED);
    expect(actions).toContain(AUDIT_ACTIONS.JOURNAL_POSTED);
    expect(actions).toContain(AUDIT_ACTIONS.BALANCE_UPDATED);
  });

  it('current accounts route to the current liability GL', async () => {
    const { request } = await openAccount(
      { cif: 'CIF000006', productCode: 'CUR-STD', openingAmount: '25000' },
      MAKER,
    );
    await decideRequest(request.id, 'APPROVE', '', CHECKER);
    expect((await repo('GL_ACCOUNTS').findById('TRN-GL-2002')).balance).toBe(25000);
  });

  it('the same request can never post twice', async () => {
    const { request } = await openAccount(
      { cif: 'CIF000002', productCode: 'SAV-REG', openingAmount: '5000' },
      MAKER,
    );
    await decideRequest(request.id, 'APPROVE', '', CHECKER);

    await expect(
      postFinancialTransaction({
        operationCode: 'ACCT-SAV-OPEN-001',
        type: 'INITIAL_DEPOSIT',
        amount: 5000,
        maker: 'maker01',
        checker: 'checker01',
        branch: 'BR001',
        businessDate: '2026-10-17',
        relatedRequestId: request.id,
        journalLines: [
          { glCode: 'TRN-GL-1001', side: 'DEBIT', amount: 5000 },
          { glCode: 'TRN-GL-2001', side: 'CREDIT', amount: 5000 },
        ],
        accountEffects: [],
      }),
    ).rejects.toMatchObject({ code: 'WORKFLOW_VIOLATION' });
  });

  it('blocks opening below the product minimum', async () => {
    await expect(
      openAccount({ cif: 'CIF000002', productCode: 'SAV-REG', openingAmount: '100' }, MAKER),
    ).rejects.toMatchObject({ code: 'VALIDATION_FAILED' });
  });

  it('blocks accounts for customers whose KYC is not complete', async () => {
    await expect(
      openAccount({ cif: 'CIF000005', productCode: 'SAV-REG', openingAmount: '5000' }, MAKER),
    ).rejects.toMatchObject({ code: 'VALIDATION_FAILED' });
  });

  it('blocks savings accounts for corporate customers', async () => {
    await expect(
      openAccount({ cif: 'CIF000006', productCode: 'SAV-REG', openingAmount: '5000' }, MAKER),
    ).rejects.toMatchObject({ code: 'VALIDATION_FAILED' });
  });

  it('unbalanced journals can never post (engine invariant)', async () => {
    await expect(
      postFinancialTransaction({
        operationCode: 'ACCT-SAV-OPEN-001',
        type: 'INITIAL_DEPOSIT',
        amount: 5000,
        maker: 'maker01',
        branch: 'BR001',
        businessDate: '2026-10-17',
        journalLines: [
          { glCode: 'TRN-GL-1001', side: 'DEBIT', amount: 5000 },
          { glCode: 'TRN-GL-2001', side: 'CREDIT', amount: 4999.99 },
        ],
        accountEffects: [],
      }),
    ).rejects.toMatchObject({ code: 'WORKFLOW_VIOLATION' });
  });
});
