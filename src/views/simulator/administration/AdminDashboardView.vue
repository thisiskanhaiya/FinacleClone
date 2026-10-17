<template>
  <div>
    <div class="page-header">
      <h1>Administration</h1>
      <div class="subtitle">System Administrator workspace for the local training environment</div>
    </div>

    <div class="card-grid">
      <div class="card">
        <h3>Demo User Management</h3>
        <p class="small muted">View the fictional demo employees, their roles and branches. <span class="mono">ADMIN-USERS-001</span></p>
        <router-link class="btn btn-primary" to="/simulator/operations/ADMIN-USERS-001">Open</router-link>
      </div>
      <div class="card">
        <h3>Reset Training Data</h3>
        <p class="small muted">Restore every collection to its original fictional seed data. <span class="mono">ADMIN-RESET-001</span></p>
        <router-link class="btn btn-danger" to="/simulator/operations/ADMIN-RESET-001">Open</router-link>
      </div>
      <div class="card">
        <h3>System Logs</h3>
        <p class="small muted">Audit events including logins, logouts, denials and resets. <span class="mono">ENQ-AUDIT-001</span></p>
        <router-link class="btn btn-primary" to="/simulator/operations/ENQ-AUDIT-001">Open</router-link>
      </div>
      <div class="card">
        <h3>Parameter Management</h3>
        <p class="small muted">Bank, branch and product parameters. <span class="mono">ADMIN-PARAMS-001</span> · Phase 8</p>
        <router-link class="btn" to="/simulator/operations/ADMIN-PARAMS-001">View</router-link>
      </div>
    </div>

    <div class="card">
      <div class="card-title">Environment</div>
      <div class="detail-grid">
        <div><div class="label">Bank</div><div class="value">{{ environment.bankName }}</div></div>
        <div><div class="label">Business date</div><div class="value">{{ environment.businessDate }}</div></div>
        <div><div class="label">Business date status</div><div class="value">{{ environment.businessDateStatus }}</div></div>
        <div><div class="label">Seed version</div><div class="value mono">{{ seedVersion }}</div></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useEnvironmentStore } from '../../../stores/environmentStore.js';
import { localStorageAdapter } from '../../../repositories/index.js';

const environment = useEnvironmentStore();
const seedVersion = ref('-');

onMounted(() => {
  seedVersion.value = localStorageAdapter.get('meta')?.seedVersion ?? '-';
});
</script>
