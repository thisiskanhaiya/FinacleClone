<template>
  <div>
    <div class="page-header">
      <h1>{{ moduleLabel }}</h1>
      <div class="subtitle">Operations available in this module. Locked operations are outside your current role.</div>
    </div>

    <EmptyState
      v-if="!operations.length"
      title="No operations registered"
      message="This module has no registered operations in the current build phase."
    />

    <div v-else class="card-grid">
      <div v-for="op in operations" :key="op.code" class="card">
        <div class="flex-between">
          <span class="mono small" style="color: var(--teal-600);">{{ op.code }}</span>
          <span v-if="op.phase > 1" class="badge badge-gold">Phase {{ op.phase }}</span>
          <span v-else class="badge badge-teal">Available</span>
        </div>
        <h3 class="mt-8">{{ op.name }}</h3>
        <p class="small muted">
          {{ op.makerChecker ? 'Maker-checker' : 'Single-user' }} ·
          {{ op.financial ? 'Financial' : 'Non-financial' }} ·
          {{ op.difficulty }}
        </p>
        <div class="flex mt-8">
          <template v-if="isAuthorised(op)">
            <router-link class="btn btn-primary" :to="op.route">Launch</router-link>
          </template>
          <span v-else class="badge badge-red">Not authorised for your current role</span>
          <router-link class="btn" :to="`/training/operations/${op.code}`">Guide</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { operationsForModule } from '../../data/operationSpecifications/operations.js';
import { MODULE_LABELS } from '../../domain/enums/modules.js';
import { canAccessOperation } from '../../domain/rules/permissionRules.js';
import { useAuthStore } from '../../stores/authStore.js';
import EmptyState from '../../components/common/EmptyState.vue';

const route = useRoute();
const auth = useAuthStore();

const moduleKey = computed(() => String(route.params.module ?? '').toUpperCase());
const moduleLabel = computed(() => MODULE_LABELS[moduleKey.value] ?? moduleKey.value);
const operations = computed(() => operationsForModule(moduleKey.value));

function isAuthorised(op) {
  return canAccessOperation(auth.role, op);
}
</script>
