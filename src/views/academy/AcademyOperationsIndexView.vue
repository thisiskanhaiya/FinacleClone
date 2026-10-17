<template>
  <div>
    <div class="page-header">
      <h1>All Operations Index</h1>
      <div class="subtitle">Every simulator operation and its concept page. {{ filtered.length }} of {{ rows.length }} shown.</div>
    </div>

    <div class="card">
      <div class="form-row">
        <div class="form-field" style="flex:1; min-width:260px;">
          <label for="academy-q">Search</label>
          <input id="academy-q" v-model="query" type="text" placeholder="Code, name or keyword…" />
        </div>
        <div class="form-field">
          <label for="academy-module">Academy module</label>
          <select id="academy-module" v-model="moduleFilter">
            <option value="">All modules</option>
            <option v-for="m in modules" :key="m.key" :value="m.key">{{ m.number }}. {{ m.title }}</option>
          </select>
        </div>
      </div>
    </div>

    <EmptyState v-if="!filtered.length" title="No operations match" message="Adjust the search or filter." />

    <table v-else class="data-table">
      <thead>
        <tr><th>Code</th><th>Operation</th><th>Academy module</th><th>Financial</th><th>Maker-checker</th><th>Status</th><th></th></tr>
      </thead>
      <tbody>
        <tr v-for="row in filtered" :key="row.code">
          <td class="mono">{{ row.code }}</td>
          <td>{{ row.name }}</td>
          <td>{{ row.moduleTitle }}</td>
          <td>{{ row.financial ? 'Yes' : 'No' }}</td>
          <td>{{ row.makerChecker ? 'Yes' : 'No' }}</td>
          <td>
            <span v-if="isLiveOperation(row.code)" class="badge badge-green">Live</span>
            <span v-else class="badge badge-grey">Phase {{ row.phase }}</span>
          </td>
          <td><router-link class="btn btn-link" :to="`/academy/operations/${row.code}`">Learn</router-link></td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { OPERATIONS } from '../../data/operationSpecifications/operations.js';
import { isLiveOperation } from '../../data/operationSpecifications/liveOperations.js';
import { OPERATION_CONCEPTS } from '../../data/academyContent/operationConcepts.js';
import { ACADEMY_MODULES_BY_KEY } from '../../data/academyContent/modules.js';
import EmptyState from '../../components/common/EmptyState.vue';

const query = ref('');
const moduleFilter = ref('');
const modules = ACADEMY_MODULES_BY_KEY;

const rows = OPERATIONS.map((op) => {
  const c = OPERATION_CONCEPTS[op.code];
  return {
    ...op,
    academyModule: c?.academyModule ?? null,
    moduleTitle: c ? ACADEMY_MODULES_BY_KEY[c.academyModule]?.title ?? c.academyModule : '-',
    searchText: `${op.code} ${op.name} ${op.keywords.join(' ')}`.toLowerCase(),
  };
});

const filtered = computed(() => rows.filter((row) => {
  if (moduleFilter.value && row.academyModule !== moduleFilter.value) return false;
  if (query.value.trim()) {
    const tokens = query.value.trim().toLowerCase().split(/\s+/);
    if (!tokens.every((t) => row.searchText.includes(t))) return false;
  }
  return true;
}));
</script>
