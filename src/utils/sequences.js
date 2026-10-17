/**
 * Sequential identifier helper: nextCif/nextAccount style numbering.
 * Scans existing IDs, takes the max numeric suffix and adds 1.
 * Local single-user training tool - no concurrency concerns.
 */
export function nextSequentialId(prefix, existingIds, width = 6) {
  let max = 0;
  for (const id of existingIds) {
    if (typeof id !== 'string' || !id.startsWith(prefix)) continue;
    const n = Number(id.slice(prefix.length));
    if (Number.isFinite(n)) max = Math.max(max, n);
  }
  return `${prefix}${String(max + 1).padStart(width, '0')}`;
}
