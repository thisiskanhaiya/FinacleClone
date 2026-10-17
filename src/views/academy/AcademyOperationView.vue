<template>
  <div v-if="operation && concept">
    <div class="page-header flex-between wrap">
      <div>
        <h1>{{ operation.name }}</h1>
        <div class="subtitle">
          <span class="mono">{{ operation.code }}</span> ·
          Academy module: <router-link :to="`/academy/modules/${concept.academyModule}`">{{ moduleTitle }}</router-link> ·
          {{ operation.financial ? 'Financial' : 'Non-financial' }} ·
          {{ operation.makerChecker ? 'Maker-checker' : 'Single-user' }}
        </div>
      </div>
      <a class="btn btn-accent" href="/login" target="_blank" rel="noopener">
        Open Simulator to practise ↗
      </a>
    </div>

    <section class="card">
      <div class="card-title">1 · Business Concept</div>
      <p>{{ concept.concept }}</p>
    </section>

    <section class="card">
      <div class="card-title">2 · Real Branch Scenario</div>
      <p>{{ concept.branchScenario }}</p>
    </section>

    <section class="card">
      <div class="card-title">3 · Roles Involved</div>
      <table class="data-table">
        <thead><tr><th>Actor</th><th>Responsibility</th></tr></thead>
        <tbody>
          <tr v-for="r in concept.roles" :key="r.actor">
            <td><strong>{{ r.actor }}</strong></td>
            <td>{{ r.responsibility }}</td>
          </tr>
        </tbody>
      </table>
    </section>

    <section class="card">
      <div class="card-title">4 · End-to-End Business Flow</div>
      <ol class="flow-list">
        <li v-for="(step, i) in concept.flow" :key="i">
          <strong>{{ step.actor }}</strong> → {{ step.action }}
        </li>
      </ol>
    </section>

    <section class="card">
      <div class="card-title">5 · Accounting Flow</div>
      <template v-if="concept.accounting">
        <div class="detail-grid">
          <div><div class="label">Debit</div><div class="value">{{ concept.accounting.debit }}</div></div>
          <div><div class="label">Credit</div><div class="value">{{ concept.accounting.credit }}</div></div>
        </div>
        <p v-if="concept.accounting.note" class="small muted mt-8">{{ concept.accounting.note }}</p>
        <p class="small mt-8">Total debits must equal total credits — the simulator blocks unbalanced postings.</p>
      </template>
      <p v-else>This operation is non-financial: it changes master data or status, not money, so no journal is posted.</p>
    </section>

    <section class="card">
      <div class="card-title">6 · Records Created</div>
      <ul>
        <li v-for="rec in concept.recordsCreated" :key="rec">{{ rec }}</li>
      </ul>
    </section>

    <section class="card">
      <div class="card-title">7 · Status Changes</div>
      <div class="flex wrap">
        <template v-for="(s, i) in concept.statusChanges" :key="i">
          <span class="badge badge-grey" style="font-size:12px;">{{ s }}</span>
        </template>
      </div>
    </section>

    <section class="card">
      <div class="card-title">8 · Exception Scenarios</div>
      <table v-if="concept.exceptions.length" class="data-table">
        <thead><tr><th>Error</th><th>Why it occurs</th><th>How to correct</th></tr></thead>
        <tbody>
          <tr v-for="e in concept.exceptions" :key="e.error">
            <td><strong>{{ e.error }}</strong></td>
            <td>{{ e.cause }}</td>
            <td>{{ e.correction }}</td>
          </tr>
        </tbody>
      </table>
      <p v-else class="muted">Inquiry operations do not fail destructively — they change nothing.</p>
    </section>

    <section class="card">
      <div class="card-title">9 · Recovery</div>
      <p>{{ concept.recovery }}</p>
    </section>

    <section class="card" style="border-left: 4px solid var(--teal-600);">
      <div class="card-title">10 · Simulator Practice</div>
      <p class="small muted">
        Perform this in the Core Banking Simulator (separate window) using exactly this data.
      </p>

      <h3 class="mt-8">Credentials for this operation (fictional demo users)</h3>
      <table class="data-table">
        <thead>
          <tr><th>Used as</th><th>Username</th><th>Password</th><th>Role</th><th>Branch</th></tr>
        </thead>
        <tbody>
          <tr v-for="u in practiceUsers" :key="u.username">
            <td><span class="badge" :class="u.involvement === 'Maker' ? 'badge-teal' : u.involvement === 'Authoriser' ? 'badge-gold' : 'badge-grey'">{{ u.involvement }}</span></td>
            <td class="mono">{{ u.username }}</td>
            <td class="mono">{{ u.password }}</td>
            <td>{{ roleLabel(u.role) }}</td>
            <td class="mono">{{ u.branch }}</td>
          </tr>
        </tbody>
      </table>
      <p class="small muted mt-8">Sign-in sequence: <strong>{{ concept.practice.login }}</strong></p>

      <h3 class="mt-16">Training data</h3>
      <div class="detail-grid">
        <div><div class="label">Operation</div><div class="value mono">{{ operation.code }}</div></div>
        <div><div class="label">Customer</div><div class="value">{{ concept.practice.customer }}</div></div>
        <div><div class="label">CIF</div><div class="value mono">{{ concept.practice.cif }}</div></div>
        <div><div class="label">Account</div><div class="value mono">{{ concept.practice.account }}</div></div>
        <div><div class="label">Balance</div><div class="value">{{ concept.practice.balance }}</div></div>
        <div><div class="label">Amount</div><div class="value">{{ concept.practice.amount }}</div></div>
      </div>

      <h3 class="mt-16">Expected result</h3>
      <p>{{ concept.practice.expectedResult }}</p>

      <h3 class="mt-16">How to verify in the simulator</h3>
      <ul>
        <li v-for="v in concept.practice.verify" :key="v">{{ v }}</li>
      </ul>
    </section>
  </div>

  <EmptyState v-else title="Unknown operation" message="No concept page exists for this code.">
    <router-link class="btn btn-primary" to="/academy/operations">Back to operations index</router-link>
  </EmptyState>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { getOperation } from '../../data/operationSpecifications/operations.js';
import { getOperationConcept, practiceUsersForOperation } from '../../data/academyContent/operationConcepts.js';
import { getAcademyModule } from '../../data/academyContent/modules.js';
import { employeeRepository } from '../../repositories/index.js';
import { ROLE_LABELS } from '../../domain/enums/roles.js';
import EmptyState from '../../components/common/EmptyState.vue';

const route = useRoute();

const operation = computed(() => getOperation(String(route.params.code ?? '').toUpperCase()));
const concept = computed(() => (operation.value ? getOperationConcept(operation.value.code) : null));
const moduleTitle = computed(() =>
  concept.value ? getAcademyModule(concept.value.academyModule)?.title ?? concept.value.academyModule : '',
);

const practiceUsers = ref([]);

function roleLabel(role) {
  return ROLE_LABELS[role] ?? role;
}

onMounted(async () => {
  const employees = await employeeRepository.findAll();
  if (operation.value) {
    practiceUsers.value = practiceUsersForOperation(operation.value, employees);
  }
});
</script>

<style scoped>
.flow-list { margin: 0; padding-left: 20px; }
.flow-list li { margin-bottom: 6px; line-height: 1.5; }
</style>
