import { OPERATIONS } from '../data/operationSpecifications/operations.js';
import { canAccessOperation } from '../domain/rules/permissionRules.js';
import { MODULE_LABELS } from '../domain/enums/modules.js';

/**
 * OperationSearchService - powers the global operation search and the
 * Ctrl+K command palette. Matches on operation code, name, keywords and
 * module label. Results always include an `authorised` flag for the
 * querying role so the UI can show "Not authorised for your current role"
 * without allowing navigation.
 */
export function searchOperations(query, role, { includeUnauthorised = true, limit = 12 } = {}) {
  const q = String(query ?? '').trim().toLowerCase();
  const withFlags = OPERATIONS.map((operation) => ({
    ...operation,
    moduleLabel: MODULE_LABELS[operation.module] ?? operation.module,
    authorised: canAccessOperation(role, operation),
  }));

  let matches;
  if (!q) {
    matches = withFlags;
  } else {
    const tokens = q.split(/\s+/).filter(Boolean);
    const scored = [];
    for (const operation of withFlags) {
      const code = operation.code.toLowerCase();
      const name = operation.name.toLowerCase();
      const moduleLabel = (operation.moduleLabel ?? '').toLowerCase();
      const keywords = operation.keywords.map((k) => k.toLowerCase());
      const haystack = `${code} ${name} ${moduleLabel} ${keywords.join(' ')}`;

      // Every token must match somewhere (code, name, keyword or module).
      if (!tokens.every((t) => haystack.includes(t))) continue;

      let score = 0;
      if (code === q) score = 100;
      else if (code.startsWith(q)) score = 80;
      else if (code.includes(q)) score = 60;
      else if (name.includes(q)) score = 50;
      else if (keywords.some((k) => k.includes(q))) score = 40;
      else if (moduleLabel.includes(q)) score = 30;
      else score = 20; // multi-token match across fields

      scored.push({ operation, score });
    }
    matches = scored
      .sort((a, b) => b.score - a.score || a.operation.code.localeCompare(b.operation.code))
      .map((s) => s.operation);
  }

  const visible = includeUnauthorised ? matches : matches.filter((m) => m.authorised);
  return visible.slice(0, limit);
}

/** Resolve a single operation by exact code or exact name (search "enter" path). */
export function resolveOperation(query) {
  const q = String(query ?? '').trim().toLowerCase();
  if (!q) return null;
  return OPERATIONS.find(
    (o) => o.code.toLowerCase() === q || o.name.toLowerCase() === q,
  ) ?? null;
}
