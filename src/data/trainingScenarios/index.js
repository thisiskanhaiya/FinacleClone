/**
 * Training scenarios registry.
 *
 * Phase 1 ships the catalogue and guide-page shell. Executable scenario
 * definitions (training data, preconditions, prepare/verify scripts) are
 * delivered alongside each functional phase, starting with the Internal
 * Fund Transfer scenario (PAY-INTERNAL-001) in Phase 4.
 *
 * Scenario shape (for later phases):
 * {
 *   id, operationCode, title,
 *   maker: { username, password, role, branch },
 *   checker: { username, password, role, branch } | null,
 *   trainingData: { customers, accounts, amount, ... },
 *   preconditions: [{ key, description, check(ctx) }],
 *   steps: [{ login, screen, field, value, action, expectedResponse, statusAfter }],
 *   expectedResults: [{ key, description, verify(ctx) }],
 * }
 */
export const TRAINING_SCENARIOS = Object.freeze([]);

export function getScenario(scenarioId) {
  return TRAINING_SCENARIOS.find((s) => s.id === scenarioId) ?? null;
}
