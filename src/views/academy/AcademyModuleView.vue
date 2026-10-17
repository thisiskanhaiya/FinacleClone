<template>
  <div v-if="module">
    <div class="page-header">
      <h1>{{ module.number }}. {{ module.title }}</h1>
      <div class="subtitle">{{ module.summary }}</div>
    </div>

    <div class="card" v-for="topic in module.topics" :key="topic.id" :id="topic.id">
      <div class="card-title">{{ topic.title }}</div>
      <p v-for="(para, i) in topic.body" :key="i">{{ para }}</p>
    </div>

    <h2 class="mt-16">Operations in this domain</h2>
    <p class="small muted mb-8">
      Each link opens the concept page for that operation, ending with the exact simulator
      practice data (login, account, amount, expected result, verification).
    </p>
    <table class="data-table">
      <thead>
        <tr><th>Operation</th><th>Name</th><th>Financial</th><th>Maker-checker</th><th>Status</th><th></th></tr>
      </thead>
      <tbody>
        <tr v-for="op in moduleOperations" :key="op.code">
          <td class="mono">{{ op.code }}</td>
          <td>{{ op.name }}</td>
          <td>{{ op.financial ? 'Yes' : 'No' }}</td>
          <td>{{ op.makerChecker ? 'Yes' : 'No' }}</td>
          <td>
            <span v-if="isLiveOperation(op.code)" class="badge badge-green">Live in simulator</span>
            <span v-else class="badge badge-grey">Phase {{ op.phase }}</span>
          </td>
          <td><router-link class="btn btn-link" :to="`/academy/operations/${op.code}`">Learn the concept</router-link></td>
        </tr>
      </tbody>
    </table>
  </div>

  <EmptyState v-else title="Unknown module" message="This academy module does not exist.">
    <router-link class="btn btn-primary" to="/academy">Back to academy home</router-link>
  </EmptyState>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { getAcademyModule } from '../../data/academyContent/modules.js';
import { OPERATION_CONCEPTS } from '../../data/academyContent/operationConcepts.js';
import { getOperation } from '../../data/operationSpecifications/operations.js';
import { isLiveOperation } from '../../data/operationSpecifications/liveOperations.js';
import EmptyState from '../../components/common/EmptyState.vue';

const route = useRoute();
const module = computed(() => getAcademyModule(String(route.params.module ?? '')));

const moduleOperations = computed(() => {
  if (!module.value) return [];
  return Object.entries(OPERATION_CONCEPTS)
    .filter(([, c]) => c.academyModule === module.value.key)
    .map(([code]) => getOperation(code))
    .filter(Boolean)
    .sort((a, b) => a.code.localeCompare(b.code));
});
</script>
