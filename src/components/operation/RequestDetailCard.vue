<template>
  <div class="card">
    <div class="card-title">Request {{ request.id }}</div>
    <div class="detail-grid">
      <div><div class="label">Operation</div><div class="value mono">{{ request.operationCode }}</div></div>
      <div><div class="label">Entity</div><div class="value mono">{{ request.entityType }} {{ request.entityId }}</div></div>
      <div><div class="label">Maker</div><div class="value mono">{{ request.makerId }}</div></div>
      <div><div class="label">Business date</div><div class="value mono">{{ request.businessDate }}</div></div>
      <div><div class="label">Status</div><div class="value"><span class="badge badge-amber">{{ request.status }}</span></div></div>
      <div v-if="request.amount != null">
        <div class="label">Amount</div><div class="value mono">{{ formatINR(request.amount) }}</div>
      </div>
    </div>
    <p class="mt-8 mb-8">{{ request.summary }}</p>

    <table v-if="rows.length" class="data-table mt-8">
      <thead>
        <tr><th>Field</th><th>Before</th><th>After</th></tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="row.field">
          <td class="mono">{{ row.field }}</td>
          <td :class="{ muted: row.changed }">{{ row.before }}</td>
          <td :class="{ changed: row.changed }">{{ row.after }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { formatINR } from '../../utils/money.js';

/**
 * Renders an authorisation request with a before/after comparison.
 * For create operations (no beforeValues) only the "After" column differs.
 */
const props = defineProps({
  request: { type: Object, required: true },
});

const rows = computed(() => {
  const before = props.request.beforeValues ?? {};
  const after = props.request.afterValues ?? {};
  const fields = [...new Set([...Object.keys(before), ...Object.keys(after)])];
  return fields.map((field) => {
    const b = before[field];
    const a = after[field];
    return {
      field,
      before: b === null || b === undefined ? '-' : String(b),
      after: a === null || a === undefined ? '-' : String(a),
      changed: String(b ?? '') !== String(a ?? ''),
    };
  });
});
</script>

<style scoped>
.changed { font-weight: 700; color: var(--teal-600); }
</style>
