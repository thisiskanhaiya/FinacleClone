import { NotImplementedInPhaseError } from '../utils/errors.js';
import { toCents } from '../utils/money.js';
import { WorkflowError } from '../utils/errors.js';

/**
 * AccountingEngine - educational double-entry posting.
 *
 * Phase 1 ships the balancing invariant (fully implemented and unit tested,
 * because every later phase depends on it). Journal persistence, GL balance
 * updates and posting orchestration arrive with the first financial
 * operation in Phase 3-4.
 */
export class AccountingEngine {
  /**
   * Enforce the mandatory rule: total debits must equal total credits.
   * @param {Array<{side: 'DEBIT'|'CREDIT', amount: number|string}>} lines
   */
  assertBalanced(lines) {
    if (!Array.isArray(lines) || lines.length < 2) {
      throw new WorkflowError('A journal needs at least one debit and one credit line.');
    }
    let debits = 0;
    let credits = 0;
    for (const line of lines) {
      if (line.side === 'DEBIT') debits += toCents(line.amount);
      else if (line.side === 'CREDIT') credits += toCents(line.amount);
      else throw new WorkflowError(`Unknown journal line side: ${line.side}.`);
    }
    if (debits !== credits) {
      throw new WorkflowError(
        `Journal is unbalanced: debits ${debits / 100} != credits ${credits / 100}. Posting blocked.`,
      );
    }
    return true;
  }

  totals(lines) {
    let debits = 0;
    let credits = 0;
    for (const line of lines) {
      if (line.side === 'DEBIT') debits += toCents(line.amount);
      else if (line.side === 'CREDIT') credits += toCents(line.amount);
    }
    return { debits: debits / 100, credits: credits / 100, balanced: debits === credits };
  }

  postJournal() {
    throw new NotImplementedInPhaseError('Journal posting', 4);
  }
}

export const accountingEngine = new AccountingEngine();
