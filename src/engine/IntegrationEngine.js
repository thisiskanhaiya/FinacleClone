import { NotImplementedInPhaseError } from '../utils/errors.js';

/**
 * IntegrationEngine - simulated adapters (KYC, AML, NEFT/RTGS gateways,
 * notifications, GL interface, ...). All integrations are local mocks and
 * are never presented as real bank integrations.
 *
 * Delivered in Phase 8 together with the Integration Console. Seeded
 * messages (including a simulated failure) are already visible in seed data.
 */
export class IntegrationEngine {
  dispatch() {
    throw new NotImplementedInPhaseError('Integration dispatch', 8);
  }

  retry() {
    throw new NotImplementedInPhaseError('Integration retry', 8);
  }
}

export const integrationEngine = new IntegrationEngine();
