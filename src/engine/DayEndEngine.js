import { NotImplementedInPhaseError } from '../utils/errors.js';

/**
 * DayEndEngine - day-end prechecks, batch events (FD maturity, EMI due,
 * standing instructions), journal validation and business-date closure.
 * Delivered in Phase 9. The duplicate-closure guard lives here later:
 * the same business date can never be closed twice.
 */
export class DayEndEngine {
  runPrechecks() {
    throw new NotImplementedInPhaseError('Day-end prechecks', 9);
  }

  closeBusinessDate() {
    throw new NotImplementedInPhaseError('Business date closure', 9);
  }
}

export const dayEndEngine = new DayEndEngine();
