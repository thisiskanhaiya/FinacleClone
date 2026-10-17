import { AuditEngine } from '../engine/AuditEngine.js';
import { getRepository, COLLECTIONS, localStorageAdapter } from '../repositories/index.js';
import { environmentService } from './environmentService.js';

export const auditEngine = new AuditEngine(
  getRepository(COLLECTIONS.AUDIT_EVENTS, localStorageAdapter),
);

/**
 * Application-facing audit facade. Resolves the current business date and
 * records the event. Auditing must never crash the business flow, so write
 * failures are logged to the console and swallowed.
 */
export async function recordAudit(entry) {
  try {
    const params = await environmentService.getBankParameters();
    return await auditEngine.record({
      businessDate: params?.businessDate ?? null,
      ...entry,
    });
  } catch (err) {
    console.error('Audit write failed', err);
    return null;
  }
}
