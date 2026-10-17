import { createAuditEvent } from '../domain/models/auditEvent.js';
import { nextId } from '../utils/id.js';

/**
 * AuditEngine - writes immutable audit events for every sensitive action:
 * logins, logouts, resets, denied access, workflow transitions, postings.
 *
 * The engine depends only on a repository interface, so it works unchanged
 * when the repository is backed by Spring Boot instead of localStorage.
 */
export class AuditEngine {
  constructor(auditRepository, contextProvider = () => ({})) {
    this.auditRepository = auditRepository;
    // contextProvider supplies { branch, businessDate } of the environment.
    this.contextProvider = contextProvider;
  }

  async record({
    action,
    entityType = null,
    entityId = null,
    performedBy = 'SYSTEM',
    performedByRole = null,
    branch = null,
    businessDate = null,
    result = 'SUCCESS',
    details = {},
  }) {
    const context = this.contextProvider() ?? {};
    const event = createAuditEvent({
      id: nextId('AUD'),
      action,
      entityType,
      entityId,
      performedBy,
      performedByRole,
      branch: branch ?? context.branch ?? null,
      businessDate: businessDate ?? context.businessDate ?? null,
      result,
      details,
    });
    // Repository stores a mutable copy; the frozen event object is what
    // callers receive, so in-memory references cannot be tampered with.
    await this.auditRepository.insert({ ...event, details: { ...event.details } });
    return event;
  }

  async list(filter = {}) {
    let events = await this.auditRepository.findAll();
    if (filter.action) events = events.filter((e) => e.action === filter.action);
    if (filter.performedBy) {
      events = events.filter((e) => e.performedBy.toLowerCase().includes(filter.performedBy.toLowerCase()));
    }
    if (filter.entityType) events = events.filter((e) => e.entityType === filter.entityType);
    if (filter.entityId) events = events.filter((e) => e.entityId === filter.entityId);
    if (filter.result) events = events.filter((e) => e.result === filter.result);
    return events.sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));
  }

  async forEntity(entityType, entityId) {
    return this.list({ entityType, entityId });
  }
}
