<template>
  <div>
    <div class="page-header flex-between wrap">
      <div>
        <h1>Branch Dashboard</h1>
        <div class="subtitle">
          {{ environment.bankName }} · Branch {{ auth.branch }} · Business date {{ environment.businessDate }}
        </div>
      </div>
      <EnvironmentBadge />
    </div>

    <div class="card-grid">
      <div class="card stat-card">
        <div class="stat-value">{{ stats.customers }}</div>
        <div class="stat-label">Customers (fictional)</div>
      </div>
      <div class="card stat-card">
        <div class="stat-value">{{ stats.accounts }}</div>
        <div class="stat-label">Accounts</div>
      </div>
      <div class="card stat-card">
        <div class="stat-value">{{ environment.pendingAuthorisationCount }}</div>
        <div class="stat-label">Pending authorisations</div>
      </div>
      <div class="card stat-card">
        <div class="stat-value">{{ stats.auditEvents }}</div>
        <div class="stat-label">Audit events recorded</div>
      </div>
    </div>

    <div class="card">
      <div class="card-title">Get started</div>
      <p>
        Press <code>/</code> to focus the operation search, or <code>Ctrl+K</code> for the command
        palette. Every operation can also be reached from the left navigation. Each operation has
        a matching guide in the <router-link to="/training">Bank Operations Workbook</router-link>.
      </p>
    </div>

    <div v-if="operationStore.recentOperations.length" class="card">
      <div class="card-title">Recent operations</div>
      <table class="data-table">
        <thead>
          <tr><th>Code</th><th>Name</th><th>Module</th><th></th></tr>
        </thead>
        <tbody>
          <tr v-for="op in operationStore.recentOperations" :key="op.code">
            <td class="mono">{{ op.code }}</td>
            <td>{{ op.name }}</td>
            <td>{{ moduleLabel(op.module) }}</td>
            <td>
              <router-link v-if="auth.canAccessOperationCode(op.code)" class="btn btn-link" :to="`/simulator/operations/${op.code}`">Open</router-link>
              <span v-else class="badge badge-red">Not authorised</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="isDev" class="card">
      <div class="card-title">Switch Demo User (development only)</div>
      <p class="small muted">
        Ends the current session (audited) and signs in as the selected fictional demo user.
        Role checks still apply to the new session.
      </p>
      <div class="flex wrap">
        <select v-model="switchTarget" class="form-field" style="padding:6px 8px;" aria-label="Demo user to switch to">
          <option v-for="u in demoUsers" :key="u.username" :value="u.username">
            {{ u.username }} — {{ roleLabel(u.role) }}
          </option>
        </select>
        <button class="btn btn-accent" :disabled="!switchTarget || switching" @click="switchUser">
          {{ switching ? 'Switching…' : 'Switch user' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useAuthStore } from '../../../stores/authStore.js';
import { useEnvironmentStore } from '../../../stores/environmentStore.js';
import { useOperationStore } from '../../../stores/operationStore.js';
import { getRepository, COLLECTIONS, employeeRepository } from '../../../repositories/index.js';
import { MODULE_LABELS } from '../../../domain/enums/modules.js';
import { ROLE_LABELS } from '../../../domain/enums/roles.js';
import EnvironmentBadge from '../../../components/common/EnvironmentBadge.vue';

const auth = useAuthStore();
const environment = useEnvironmentStore();
const operationStore = useOperationStore();

const isDev = import.meta.env.DEV;
const stats = ref({ customers: 0, accounts: 0, auditEvents: 0 });
const demoUsers = ref([]);
const switchTarget = ref('');
const switching = ref(false);

function moduleLabel(module) {
  return MODULE_LABELS[module] ?? module;
}

function roleLabel(role) {
  return ROLE_LABELS[role] ?? role;
}

async function switchUser() {
  switching.value = true;
  try {
    await auth.switchDemoUser(switchTarget.value);
    await environment.load();
  } finally {
    switching.value = false;
  }
}

onMounted(async () => {
  const [customers, accounts, auditEvents, employees] = await Promise.all([
    getRepository(COLLECTIONS.CUSTOMERS).count(),
    getRepository(COLLECTIONS.ACCOUNTS).count(),
    getRepository(COLLECTIONS.AUDIT_EVENTS).count(),
    employeeRepository.findAll(),
  ]);
  stats.value = { customers, accounts, auditEvents };
  demoUsers.value = employees.filter((e) => e.isDemo);
  await environment.refreshPendingCount();
});
</script>
