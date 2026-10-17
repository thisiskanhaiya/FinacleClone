import { describe, it, expect, beforeEach } from 'vitest';
import {
  internalTransfer,
  neftTransfer,
  rtgsTransfer,
  createStandingInstruction,
  executeStandingInstruction,
  cancelStandingInstruction,
  dueStandingInstructions,
  searchTransactions,
  getTransactionDetail,
} from '../../src/services/transferService.js';
import { decideRequest } from '../../src/services/authorisationService.js';
import { getRepository, COLLECTIONS } from '../../src/repositories/index.js';
import { validateRtgsAmount, validateBeneficiary, RTGS_MIN_AMOUNT } from '../../src/domain/validators/paymentValidator.js';
import customers from '../../src/data/seed/customers.json';
import accounts from '../../src/data/seed/accounts.json';
import products from '../../src/data/seed/products.json';
import glAccounts from '../../src/data/seed/glAccounts.json';
import authorisationRequests from '../../src/data/seed/authorisationRequests.json';

/**
 * Phase 4 payment journeys: internal transfers, NEFT/RTGS outward payments
 * with suspense routing and gateway messages, standing instructions, and
 * transaction inquiry.
 */

const TELLER = { username: 'teller01', role: 'TELLER', branch: 'BR001' };
const AUTHORISER = { username: 'tellerauthoriser01', role: 'TELLER_AUTHORISER', branch: 'BR001' };

const repo = (name) => getRepository(COLLECTIONS[name]);
const gl = async (id) => (await repo('GL_ACCOUNTS').findById(id)).balance;
const acct = async (id) => repo('ACCOUNTS').findById(id);
const approve = (reqId) => decideRequest(reqId, 'APPROVE', '', AUTHORISER);

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

describe('internal fund transfer', () => {
  it('maker submits -> nothing moves -> approval shifts balances and liability', async () => {
    const { request } = await internalTransfer(
      { sourceAccountNumber: 'SB000001', destinationAccountNumber: 'SB000002', amount: '10000', remarks: 'Family support' },
      TELLER,
    );
    expect((await acct('SB000001')).ledgerBalance).toBe(100000); // nothing yet

    const { effect } = await approve(request.id);
    expect(effect.effect).toBe('INTERNAL_TRANSFER_POSTED');

    expect((await acct('SB000001')).ledgerBalance).toBe(90000);
    expect((await acct('SB000002')).ledgerBalance).toBe(60000);
    // Both accounts are SAVINGS: liability GL nets to zero overall.
    expect(await gl('TRN-GL-2001')).toBe(0);

    const legs = await repo('TRANSACTION_LEGS').findAll();
    expect(legs.length).toBe(2);
    expect(legs.find((l) => l.accountNumber === 'SB000001').side).toBe('DEBIT');
    expect(legs.find((l) => l.accountNumber === 'SB000002').balanceAfter).toBe(60000);
  });

  it('cross-category transfer moves between the two liability GLs', async () => {
    const { request } = await internalTransfer(
      { sourceAccountNumber: 'CA000001', destinationAccountNumber: 'SB000002', amount: '25000' },
      TELLER,
    );
    await approve(request.id);
    expect(await gl('TRN-GL-2002')).toBe(-25000); // current liability falls
    expect(await gl('TRN-GL-2001')).toBe(25000); // savings liability rises
  });

  it('blocks same-account, frozen destination and insufficient funds', async () => {
    await expect(
      internalTransfer({ sourceAccountNumber: 'SB000001', destinationAccountNumber: 'SB000001', amount: '100' }, TELLER),
    ).rejects.toMatchObject({ code: 'VALIDATION_FAILED' });
    await expect(
      internalTransfer({ sourceAccountNumber: 'SB000001', destinationAccountNumber: 'SB000006', amount: '100' }, TELLER),
    ).rejects.toMatchObject({ code: 'VALIDATION_FAILED' }); // FROZEN destination
    await expect(
      internalTransfer({ sourceAccountNumber: 'SB000004', destinationAccountNumber: 'SB000002', amount: '8000' }, TELLER),
    ).rejects.toMatchObject({ code: 'VALIDATION_FAILED' }); // only 7,500 available
  });

  it('maker cannot authorise own transfer', async () => {
    const { request } = await internalTransfer(
      { sourceAccountNumber: 'SB000001', destinationAccountNumber: 'SB000002', amount: '1000' },
      TELLER,
    );
    await expect(decideRequest(request.id, 'APPROVE', '', TELLER))
      .rejects.toMatchObject({ code: 'NOT_AUTHORISED' });
  });
});

describe('NEFT and RTGS outward payments', () => {
  const beneficiary = { beneficiaryName: 'Supplier One', beneficiaryAccount: '502000123456', ifsc: 'HDFC0001234' };

  it('NEFT debits the customer into suspense and records a gateway message', async () => {
    const { request } = await neftTransfer(
      { sourceAccountNumber: 'CA000001', amount: '50000', ...beneficiary },
      TELLER,
    );
    const { effect } = await approve(request.id);
    expect(effect.effect).toBe('NEFT_OUTWARD_POSTED');

    expect((await acct('CA000001')).ledgerBalance).toBe(200000);
    expect(await gl('TRN-GL-2002')).toBe(-50000); // liability falls
    expect(await gl('TRN-GL-9001')).toBe(50000); // suspense parks it

    const messages = await repo('INTEGRATION_MESSAGES').findWhere((m) => m.operation === 'NEFT_OUTWARD');
    expect(messages.length).toBe(1);
    expect(messages[0].responseStatus).toBe('SENT');
    expect(messages[0].correlationId).toBe(request.id);
  });

  it('RTGS enforces the high-value minimum', async () => {
    await expect(
      rtgsTransfer({ sourceAccountNumber: 'CA000001', amount: '50000', ...beneficiary }, TELLER),
    ).rejects.toMatchObject({ code: 'VALIDATION_FAILED' });

    const { request } = await rtgsTransfer(
      { sourceAccountNumber: 'CA000001', amount: '200000', ...beneficiary },
      TELLER,
    );
    await approve(request.id);
    expect((await acct('CA000001')).ledgerBalance).toBe(50000);
    expect(await gl('TRN-GL-9001')).toBe(200000);
  });

  it('validates beneficiary details (IFSC format)', async () => {
    await expect(
      neftTransfer({ sourceAccountNumber: 'CA000001', amount: '1000', ...beneficiary, ifsc: 'BAD-IFSC' }, TELLER),
    ).rejects.toMatchObject({ code: 'VALIDATION_FAILED' });
  });
});

describe('standing instructions', () => {
  async function createAndActivateSi() {
    const { si, request } = await createStandingInstruction(
      {
        sourceAccountNumber: 'SB000001',
        destinationAccountNumber: 'SB000002',
        amount: '2000',
        frequency: 'MONTHLY',
        startDate: '2026-10-17',
      },
      TELLER,
    );
    expect(si.status).toBe('PENDING_AUTHORISATION');
    await approve(request.id);
    return si.id;
  }

  it('create -> approve -> ACTIVE; execute -> posts and advances the due date', async () => {
    const siId = await createAndActivateSi();
    expect((await repo('STANDING_INSTRUCTIONS').findById(siId)).status).toBe('ACTIVE');

    // Due today (business date 2026-10-17).
    const due = await dueStandingInstructions();
    expect(due.map((s) => s.id)).toContain(siId);

    const { request } = await executeStandingInstruction(siId, TELLER);
    await approve(request.id);

    expect((await acct('SB000001')).ledgerBalance).toBe(98000);
    expect((await acct('SB000002')).ledgerBalance).toBe(52000);

    const after = await repo('STANDING_INSTRUCTIONS').findById(siId);
    expect(after.nextDueDate).toBe('2026-11-17');
    expect(after.lastExecutedOn).toBe('2026-10-17');

    // No longer due.
    expect((await dueStandingInstructions()).map((s) => s.id)).not.toContain(siId);
    await expect(executeStandingInstruction(siId, TELLER)).rejects.toMatchObject({ code: 'WORKFLOW_VIOLATION' });
  });

  it('rejects past start dates and same-account instructions', async () => {
    await expect(
      createStandingInstruction(
        { sourceAccountNumber: 'SB000001', destinationAccountNumber: 'SB000002', amount: '100', frequency: 'MONTHLY', startDate: '2026-10-01' },
        TELLER,
      ),
    ).rejects.toMatchObject({ code: 'VALIDATION_FAILED' });
    await expect(
      createStandingInstruction(
        { sourceAccountNumber: 'SB000001', destinationAccountNumber: 'SB000001', amount: '100', frequency: 'MONTHLY', startDate: '2026-10-17' },
        TELLER,
      ),
    ).rejects.toMatchObject({ code: 'VALIDATION_FAILED' });
  });

  it('cancel -> approve -> CANCELLED and no longer executable', async () => {
    const siId = await createAndActivateSi();
    const { request } = await cancelStandingInstruction(siId, TELLER);
    await approve(request.id);
    expect((await repo('STANDING_INSTRUCTIONS').findById(siId)).status).toBe('CANCELLED');
    await expect(executeStandingInstruction(siId, TELLER)).rejects.toMatchObject({ code: 'WORKFLOW_VIOLATION' });
  });
});

describe('transaction inquiry', () => {
  it('finds transactions and returns journal lines plus legs', async () => {
    const { request } = await internalTransfer(
      { sourceAccountNumber: 'SB000001', destinationAccountNumber: 'SB000002', amount: '3000' },
      TELLER,
    );
    await approve(request.id);

    const found = await searchTransactions('INTERNAL_TRANSFER');
    expect(found.length).toBe(1);

    const detail = await getTransactionDetail(found[0].id);
    expect(detail.journalLines.length).toBe(2);
    expect(detail.legs.length).toBe(2);
    const debit = detail.journalLines.filter((l) => l.side === 'DEBIT').reduce((s, l) => s + l.amount, 0);
    const credit = detail.journalLines.filter((l) => l.side === 'CREDIT').reduce((s, l) => s + l.amount, 0);
    expect(debit).toBe(credit);
  });
});

describe('payment validators', () => {
  it('RTGS minimum is enforced as a teaching rule', () => {
    expect(validateRtgsAmount(RTGS_MIN_AMOUNT).valid).toBe(true);
    expect(validateRtgsAmount(RTGS_MIN_AMOUNT - 0.01).valid).toBe(false);
  });

  it('IFSC format is validated', () => {
    expect(validateBeneficiary({ beneficiaryName: 'X Y', beneficiaryAccount: '123456', ifsc: 'HDFC0001234' }).valid).toBe(true);
    expect(validateBeneficiary({ beneficiaryName: 'X Y', beneficiaryAccount: '123456', ifsc: 'hdfc1234' }).valid).toBe(false);
  });
});
