import { describe, it, expect, beforeEach } from 'vitest';
import {
  openTellerSession,
  getOpenTellerSession,
  cashDeposit,
  cashWithdrawal,
  requestSessionClose,
  getTellerPosition,
} from '../../src/services/tellerService.js';
import { requestReversal, listReversibleTransactions } from '../../src/services/reversalService.js';
import { decideRequest } from '../../src/services/authorisationService.js';
import { getRepository, COLLECTIONS } from '../../src/repositories/index.js';
import { AUDIT_ACTIONS } from '../../src/domain/enums/auditActions.js';
import { validateDenominations } from '../../src/domain/validators/tellerValidator.js';
import customers from '../../src/data/seed/customers.json';
import accounts from '../../src/data/seed/accounts.json';
import products from '../../src/data/seed/products.json';
import glAccounts from '../../src/data/seed/glAccounts.json';
import authorisationRequests from '../../src/data/seed/authorisationRequests.json';

/**
 * Phase 3 teller journeys: session lifecycle, maker-checker cash deposit and
 * withdrawal with real posting, session close with variance, and transaction
 * reversal with compensating entries.
 */

const TELLER = { username: 'teller01', role: 'TELLER', branch: 'BR001' };
const AUTHORISER = { username: 'tellerauthoriser01', role: 'TELLER_AUTHORISER', branch: 'BR001' };
const MAKER01 = { username: 'maker01', role: 'CUSTOMER_SERVICE_MAKER', branch: 'BR001' };

const repo = (name) => getRepository(COLLECTIONS[name]);
const gl = async (id) => (await repo('GL_ACCOUNTS').findById(id)).balance;
const acct = async (id) => repo('ACCOUNTS').findById(id);

beforeEach(() => {
  globalThis.localStorage.clear();
  globalThis.sessionStorage.clear();
  globalThis.localStorage.setItem('cbte:bankParameters', JSON.stringify([{ id: 'BANK-PARAMS', businessDate: '2026-10-17' }]));
  globalThis.localStorage.setItem('cbte:customers', JSON.stringify(structuredClone(customers)));
  globalThis.localStorage.setItem('cbte:accounts', JSON.stringify(structuredClone(accounts)));
  globalThis.localStorage.setItem('cbte:products', JSON.stringify(structuredClone(products)));
  globalThis.localStorage.setItem('cbte:glAccounts', JSON.stringify(structuredClone(glAccounts)));
  globalThis.localStorage.setItem('cbte:authorisationRequests', JSON.stringify(structuredClone(authorisationRequests)));
});

async function openSession(cash = '50000') {
  return openTellerSession({ openingCash: cash }, TELLER);
}

describe('teller session lifecycle', () => {
  it('opens a session, audits it, and blocks a second open session', async () => {
    const s = await openSession('50000');
    expect(s.status).toBe('OPEN');
    expect(s.systemCash).toBe(50000);

    await expect(openSession('1000')).rejects.toMatchObject({ code: 'WORKFLOW_VIOLATION' });

    const actions = (await repo('AUDIT_EVENTS').findAll()).map((e) => e.action);
    expect(actions).toContain(AUDIT_ACTIONS.TELLER_SESSION_OPENED);
  });

  it('a non-teller role cannot open a teller session', async () => {
    await expect(openTellerSession({ openingCash: '1000' }, MAKER01))
      .rejects.toMatchObject({ code: 'NOT_AUTHORISED' });
  });

  it('cash operations are blocked without an open session', async () => {
    await expect(cashDeposit({ accountNumber: 'SB000001', amount: '1000' }, TELLER))
      .rejects.toMatchObject({ code: 'WORKFLOW_VIOLATION' });
  });
});

describe('cash deposit journey', () => {
  it('teller submits with denominations -> authoriser approves -> money and cash move', async () => {
    const session = await openSession('50000');
    const { request } = await cashDeposit(
      { accountNumber: 'SB000001', amount: '5000', denominations: { 2000: 2, 500: 2 }, remarks: 'Counter deposit' },
      TELLER,
    );
    expect(request.status).toBe('PENDING_AUTHORISATION');
    // Nothing has moved yet.
    expect((await acct('SB000001')).ledgerBalance).toBe(100000);

    // Teller cannot authorise own request.
    await expect(decideRequest(request.id, 'APPROVE', '', TELLER))
      .rejects.toMatchObject({ code: 'NOT_AUTHORISED' });

    const { effect } = await decideRequest(request.id, 'APPROVE', '', AUTHORISER);
    expect(effect.effect).toBe('CASH_DEPOSIT_POSTED');

    const after = await acct('SB000001');
    expect(after.ledgerBalance).toBe(105000);
    expect(after.availableBalance).toBe(105000);

    expect(await gl('TRN-GL-1001')).toBe(505000); // teller cash rises
    expect(await gl('TRN-GL-2001')).toBe(5000); // savings liability rises

    const updatedSession = await repo('TELLER_SESSIONS').findById(session.id);
    expect(updatedSession.systemCash).toBe(55000);

    const actions = (await repo('AUDIT_EVENTS').findAll()).map((e) => e.action);
    expect(actions).toContain(AUDIT_ACTIONS.TRANSACTION_POSTED);
  });

  it('rejects deposits into frozen accounts and denomination mismatches', async () => {
    await openSession();
    await expect(cashDeposit({ accountNumber: 'SB000006', amount: '1000' }, TELLER))
      .rejects.toMatchObject({ code: 'VALIDATION_FAILED' }); // FROZEN
    await expect(
      cashDeposit({ accountNumber: 'SB000001', amount: '5000', denominations: { 500: 5 } }, TELLER),
    ).rejects.toMatchObject({ code: 'VALIDATION_FAILED' }); // 2500 != 5000
  });
});

describe('cash withdrawal journey', () => {
  it('withdrawal posts Dr liability / Cr teller cash and debits the account', async () => {
    const session = await openSession('50000');
    const { request } = await cashWithdrawal({ accountNumber: 'SB000001', amount: '2000' }, TELLER);
    await decideRequest(request.id, 'APPROVE', '', AUTHORISER);

    expect((await acct('SB000001')).ledgerBalance).toBe(98000);
    expect(await gl('TRN-GL-1001')).toBe(498000);
    expect((await repo('TELLER_SESSIONS').findById(session.id)).systemCash).toBe(48000);
  });

  it('blocks dormant, frozen and debit-frozen accounts', async () => {
    await openSession();
    for (const acc of ['SB000005', 'SB000006', 'SB000003']) {
      await expect(cashWithdrawal({ accountNumber: acc, amount: '100' }, TELLER))
        .rejects.toMatchObject({ code: 'VALIDATION_FAILED' });
    }
  });

  it('blocks amounts above available balance and above product limits', async () => {
    await openSession();
    // SB000004 has only 7,500 available.
    await expect(cashWithdrawal({ accountNumber: 'SB000004', amount: '8000' }, TELLER))
      .rejects.toMatchObject({ code: 'VALIDATION_FAILED' });
    // SAV-REG per-transaction limit is 2,00,000.
    await expect(cashWithdrawal({ accountNumber: 'SB000001', amount: '250000' }, TELLER))
      .rejects.toMatchObject({ code: 'VALIDATION_FAILED' });
  });

  it('lien reduces what can be withdrawn (SB000007: 80,000 ledger, 60,000 available)', async () => {
    await openSession();
    await expect(cashWithdrawal({ accountNumber: 'SB000007', amount: '70000' }, TELLER))
      .rejects.toMatchObject({ code: 'VALIDATION_FAILED' });
    const { request } = await cashWithdrawal({ accountNumber: 'SB000007', amount: '60000' }, TELLER);
    await decideRequest(request.id, 'APPROVE', '', AUTHORISER);
    const after = await acct('SB000007');
    expect(after.ledgerBalance).toBe(20000);
    expect(after.availableBalance).toBe(0); // lien of 20,000 still protects the rest
  });

  it('approval re-validates: if funds left meanwhile, approval is blocked and request stays pending', async () => {
    await openSession();
    const { request } = await cashWithdrawal({ accountNumber: 'SB000004', amount: '7000' }, TELLER);
    // Meanwhile another channel drained the account.
    await repo('ACCOUNTS').update('SB000004', { availableBalance: 100, ledgerBalance: 100 });
    await expect(decideRequest(request.id, 'APPROVE', '', AUTHORISER))
      .rejects.toMatchObject({ code: 'VALIDATION_FAILED' });
    expect((await repo('AUTHORISATION_REQUESTS').findById(request.id)).status).toBe('PENDING_AUTHORISATION');
  });
});

describe('teller session close', () => {
  it('clean close: declared equals system, no exception', async () => {
    const session = await openSession('50000');
    const { request } = await cashDeposit({ accountNumber: 'SB000001', amount: '5000' }, TELLER);
    await decideRequest(request.id, 'APPROVE', '', AUTHORISER);

    const closeReq = await requestSessionClose({ declaredCash: '55000' }, TELLER);
    const { effect } = await decideRequest(closeReq.id, 'APPROVE', '', AUTHORISER);
    expect(effect.effect).toBe('TELLER_SESSION_CLOSED');
    expect(effect.variance).toBe(0);

    const closed = await repo('TELLER_SESSIONS').findById(session.id);
    expect(closed.status).toBe('CLOSED');
    expect(closed.closedBy).toBe('tellerauthoriser01');
    expect(await repo('EXCEPTIONS').count()).toBe(0);
  });

  it('variance raises an exception record and audit event', async () => {
    await openSession('50000');
    const closeReq = await requestSessionClose({ declaredCash: '49500' }, TELLER);
    const { effect } = await decideRequest(closeReq.id, 'APPROVE', '', AUTHORISER);
    expect(effect.variance).toBe(-500);

    const exceptions = await repo('EXCEPTIONS').findAll();
    expect(exceptions.length).toBe(1);
    expect(exceptions[0].type).toBe('TELLER_CASH_VARIANCE');
    const actions = (await repo('AUDIT_EVENTS').findAll()).map((e) => e.action);
    expect(actions).toContain(AUDIT_ACTIONS.EXCEPTION_RAISED);
    expect(actions).toContain(AUDIT_ACTIONS.TELLER_SESSION_CLOSED);
  });

  it('position inquiry reports expected cash from live data', async () => {
    await openSession('50000');
    const d = await cashDeposit({ accountNumber: 'SB000001', amount: '5000' }, TELLER);
    await decideRequest(d.request.id, 'APPROVE', '', AUTHORISER);
    const w = await cashWithdrawal({ accountNumber: 'SB000002', amount: '3000' }, TELLER);
    await decideRequest(w.request.id, 'APPROVE', '', AUTHORISER);

    const position = await getTellerPosition('teller01');
    expect(position.deposits).toBe(5000);
    expect(position.withdrawals).toBe(3000);
    expect(position.expectedCash).toBe(52000);
  });
});

describe('transaction reversal', () => {
  it('reversal posts mirrored entries, restores balances and marks the original REVERSED', async () => {
    await openSession('50000');
    const { request } = await cashDeposit({ accountNumber: 'SB000001', amount: '5000' }, TELLER);
    await decideRequest(request.id, 'APPROVE', '', AUTHORISER);
    expect((await acct('SB000001')).ledgerBalance).toBe(105000);

    const original = (await repo('TRANSACTIONS').findAll())[0];
    const rev = await requestReversal({ transactionId: original.id, reason: 'Wrong account entered' }, TELLER);
    await decideRequest(rev.request.id, 'APPROVE', '', AUTHORISER);

    const after = await repo('TRANSACTIONS').findById(original.id);
    expect(after.status).toBe('REVERSED');
    expect(after.reversedBy).toBeTruthy();

    expect((await acct('SB000001')).ledgerBalance).toBe(100000);
    expect(await gl('TRN-GL-1001')).toBe(500000); // restored
    expect(await gl('TRN-GL-2001')).toBe(0);

    // Reversal transaction exists with mirrored type and is itself not reversible.
    const reversal = await repo('TRANSACTIONS').findById(after.reversedBy);
    expect(reversal.type).toBe('CASH_DEPOSIT_REVERSAL');
    const reversible = await listReversibleTransactions();
    expect(reversible.some((t) => t.id === original.id)).toBe(false);
    expect(reversible.some((t) => t.id === reversal.id)).toBe(false);

    const actions = (await repo('AUDIT_EVENTS').findAll()).map((e) => e.action);
    expect(actions).toContain(AUDIT_ACTIONS.TRANSACTION_REVERSED);
  });

  it('reversal requires a reason and blocks double reversal', async () => {
    await openSession();
    const { request } = await cashDeposit({ accountNumber: 'SB000001', amount: '5000' }, TELLER);
    await decideRequest(request.id, 'APPROVE', '', AUTHORISER);
    const original = (await repo('TRANSACTIONS').findAll())[0];

    await expect(requestReversal({ transactionId: original.id, reason: '' }, TELLER))
      .rejects.toMatchObject({ code: 'VALIDATION_FAILED' });

    const rev = await requestReversal({ transactionId: original.id, reason: 'Mistake' }, TELLER);
    await decideRequest(rev.request.id, 'APPROVE', '', AUTHORISER);
    await expect(requestReversal({ transactionId: original.id, reason: 'Again' }, TELLER))
      .rejects.toMatchObject({ code: 'WORKFLOW_VIOLATION' });
  });

  it('reversal is blocked if the credited money is already gone', async () => {
    await openSession('50000');
    const d = await cashDeposit({ accountNumber: 'SB000002', amount: '5000' }, TELLER);
    await decideRequest(d.request.id, 'APPROVE', '', AUTHORISER);
    // Customer withdraws the deposited amount (and more) through a second approved withdrawal.
    const w = await cashWithdrawal({ accountNumber: 'SB000002', amount: '52000' }, TELLER);
    await decideRequest(w.request.id, 'APPROVE', '', AUTHORISER);
    // Available is now 3,000 - reversing the 5,000 deposit would go negative.
    const original = (await repo('TRANSACTIONS').findAll()).find((t) => t.type === 'CASH_DEPOSIT');
    const rev = await requestReversal({ transactionId: original.id, reason: 'Try to pull money back' }, TELLER);
    await expect(decideRequest(rev.request.id, 'APPROVE', '', AUTHORISER))
      .rejects.toMatchObject({ code: 'VALIDATION_FAILED' });
    // Original stays POSTED, request stays pending.
    expect((await repo('TRANSACTIONS').findById(original.id)).status).toBe('POSTED');
    expect((await repo('AUTHORISATION_REQUESTS').findById(rev.request.id)).status).toBe('PENDING_AUTHORISATION');
  });
});

describe('denomination validator', () => {
  it('accepts matching breakdowns and rejects mismatches', () => {
    expect(validateDenominations({ 2000: 2, 500: 2 }, '5000').valid).toBe(true);
    expect(validateDenominations({ 500: 3 }, '5000').valid).toBe(false);
    expect(validateDenominations({}, '5000').valid).toBe(true); // optional capture
  });
});
