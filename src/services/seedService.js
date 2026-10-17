import { SEED_FILES, EMPTY_COLLECTIONS, SEED_VERSION } from '../data/seed/manifest.js';
import { COLLECTIONS, getRepository, localStorageAdapter } from '../repositories/index.js';
import { AUDIT_ACTIONS } from '../domain/enums/auditActions.js';
import { AuditEngine } from '../engine/AuditEngine.js';
import { EnvironmentService } from './environmentService.js';

const META_KEY = 'meta';

function allCollectionNames() {
  return [...Object.keys(SEED_FILES), ...EMPTY_COLLECTIONS];
}

/**
 * SeedService - loads the fictional seed dataset into localStorage on first
 * boot and restores it on administrator reset. The audit trail of the reset
 * itself is written AFTER reseeding so the event survives the wipe.
 */
export class SeedService {
  constructor(adapter = localStorageAdapter) {
    this.adapter = adapter;
  }

  async isSeeded() {
    const meta = this.adapter.get(META_KEY);
    return meta?.seedVersion === SEED_VERSION;
  }

  /** Load seeds only when the environment is missing or version changed. */
  async ensureSeeded() {
    if (await this.isSeeded()) return false;
    await this.loadSeeds();
    await this._writeSystemAudit(AUDIT_ACTIONS.ENVIRONMENT_SEEDED, { seedVersion: SEED_VERSION });
    return true;
  }

  async loadSeeds() {
    for (const [collection, rows] of Object.entries(SEED_FILES)) {
      await getRepository(collection, this.adapter).replaceAll(structuredClone(rows));
    }
    // Runtime collections are created if absent; existing practice data is
    // preserved on version upgrades (only a full reset wipes them).
    for (const collection of EMPTY_COLLECTIONS) {
      if (this.adapter.get(collection) === null) {
        await getRepository(collection, this.adapter).replaceAll([]);
      }
    }
    this.adapter.set(META_KEY, { seedVersion: SEED_VERSION, seededAt: new Date().toISOString() });
  }

  /**
   * Full environment reset: wipes every training collection, restores seed
   * data, then audits the reset. Unrelated practice data is NOT preserved
   * (administrator reset is a clean restore, per spec).
   */
  async resetEnvironment({ performedBy = 'SYSTEM', performedByRole = null, branch = null } = {}) {
    for (const collection of Object.values(COLLECTIONS)) {
      this.adapter.remove(collection);
    }
    for (const [collection, rows] of Object.entries(SEED_FILES)) {
      await getRepository(collection, this.adapter).replaceAll(structuredClone(rows));
    }
    for (const collection of EMPTY_COLLECTIONS) {
      await getRepository(collection, this.adapter).replaceAll([]);
    }
    this.adapter.set(META_KEY, { seedVersion: SEED_VERSION, seededAt: new Date().toISOString() });

    const params = await new EnvironmentService(this.adapter).getBankParameters();
    const engine = new AuditEngine(getRepository(COLLECTIONS.AUDIT_EVENTS, this.adapter));
    await engine.record({
      action: AUDIT_ACTIONS.ENVIRONMENT_RESET,
      entityType: 'ENVIRONMENT',
      entityId: 'LOCAL_TRAINING_ENVIRONMENT',
      performedBy,
      performedByRole,
      branch,
      businessDate: params?.businessDate ?? null,
      details: { seedVersion: SEED_VERSION, scope: 'FULL_ENVIRONMENT' },
    });
    return true;
  }

  async _writeSystemAudit(action, details) {
    const params = await new EnvironmentService(this.adapter).getBankParameters();
    const engine = new AuditEngine(getRepository(COLLECTIONS.AUDIT_EVENTS, this.adapter));
    await engine.record({
      action,
      entityType: 'ENVIRONMENT',
      entityId: 'LOCAL_TRAINING_ENVIRONMENT',
      performedBy: 'SYSTEM',
      businessDate: params?.businessDate ?? null,
      details,
    });
  }
}

export const seedService = new SeedService();
