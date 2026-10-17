<template>
  <footer class="status-bar" aria-label="System status">
    <span class="env-flag">LOCAL TRAINING ENVIRONMENT</span>
    <span class="separator">|</span>
    <span>Branch: <strong>{{ branch }}</strong></span>
    <span class="separator">|</span>
    <span>Business date: <strong>{{ businessDate }}</strong></span>
    <span class="separator">|</span>
    <span>Session: <strong>{{ sessionUser }}</strong></span>
    <span class="separator">|</span>
    <span>Operation: <strong>{{ currentOperation }}</strong></span>
    <span class="separator">|</span>
    <span class="muted" style="color: var(--grey-500)">v{{ version }}</span>
  </footer>
</template>

<script setup>
import { computed } from 'vue';
import { useAuthStore } from '../../stores/authStore.js';
import { useEnvironmentStore } from '../../stores/environmentStore.js';
import { version } from '../../../package.json';

const auth = useAuthStore();
const environment = useEnvironmentStore();

const branch = computed(() => auth.branch ?? '-');
const businessDate = computed(() => environment.businessDate);
const sessionUser = computed(() => (auth.username ? `${auth.username} (${auth.role})` : '-'));
const currentOperation = computed(() => environment.currentOperationCode ?? '-');
</script>
