<template>
  <div v-if="operation">
    <div class="page-header flex-between wrap">
      <div>
        <h1>{{ operation.name }}</h1>
        <div class="subtitle">
          <span class="mono">{{ operation.code }}</span> · {{ moduleLabel }} ·
          {{ operation.makerChecker ? 'Maker-checker' : 'Single-user' }} ·
          {{ operation.financial ? 'Financial' : 'Non-financial' }} · {{ operation.difficulty }}
        </div>
      </div>
      <div class="flex">
        <span class="badge badge-gold">Executable screen: Phase {{ operation.phase }}</span>
        <button
          v-if="authorised"
          class="btn btn-accent"
          @click="launch"
        >Launch Operation</button>
        <span v-else class="badge badge-red">Not authorised for your current role</span>
      </div>
    </div>

    <div class="tabs" role="tablist" aria-label="Operation guide sections">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="tab"
        :class="{ active: activeTab === tab.key }"
        role="tab"
        :aria-selected="activeTab === tab.key"
        @click="activeTab = tab.key"
      >{{ tab.label }}</button>
    </div>

    <!-- 1. Operation Overview -->
    <section v-if="activeTab === 'overview'">
      <div class="card">
        <div class="card-title">Operation identity</div>
        <div class="detail-grid">
          <div><div class="label">Operation code</div><div class="value mono">{{ operation.code }}</div></div>
          <div><div class="label">Name</div><div class="value">{{ operation.name }}</div></div>
          <div><div class="label">Module</div><div class="value">{{ moduleLabel }}</div></div>
          <div><div class="label">Category</div><div class="value">{{ operation.financial ? 'Financial' : 'Non-financial' }}</div></div>
          <div><div class="label">Maker-checker</div><div class="value">{{ operation.makerChecker ? 'Required' : 'Not required' }}</div></div>
          <div><div class="label">Difficulty</div><div class="value">{{ operation.difficulty }}</div></div>
          <div><div class="label">Screen modes</div><div class="value">{{ operation.modes.join(', ') }}</div></div>
          <div><div class="label">Navigation</div><div class="value">{{ moduleLabel }} → {{ operation.name }}</div></div>
        </div>
      </div>
      <div class="card">
        <div class="card-title">Employees involved (fictional demo users)</div>
        <DemoCredentialsPanel :roles="operation.allowedRoles" />
      </div>
    </section>

    <!-- 2-8. Remaining tabs arrive with each operation's executable phase -->
    <section v-else>
      <div class="alert alert-info">
        <strong>{{ activeTabLabel }}</strong> content for {{ operation.code }} is delivered together
        with the executable screen in Phase {{ operation.phase }}. The guide framework (identity,
        roles, demo credentials, launch handoff) is already live.
      </div>
      <div class="card">
        <div class="card-title">What this tab will contain</div>
        <p class="small">{{ tabPreview }}</p>
      </div>
    </section>
  </div>

  <EmptyState
    v-else
    title="Unknown operation"
    message="No operation with this code exists in the training catalogue."
  >
    <router-link class="btn btn-primary" to="/training">Back to catalogue</router-link>
  </EmptyState>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getOperation } from '../../../data/operationSpecifications/operations.js';
import { MODULE_LABELS } from '../../../domain/enums/modules.js';
import { canAccessOperation } from '../../../domain/rules/permissionRules.js';
import { useAuthStore } from '../../../stores/authStore.js';
import DemoCredentialsPanel from '../../../components/common/DemoCredentialsPanel.vue';
import EmptyState from '../../../components/common/EmptyState.vue';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

const operation = computed(() => getOperation(String(route.params.code ?? '').toUpperCase()));
const moduleLabel = computed(() =>
  operation.value ? MODULE_LABELS[operation.value.module] ?? operation.value.module : '',
);
const authorised = computed(() =>
  operation.value ? canAccessOperation(auth.role, operation.value) : false,
);

const tabs = [
  { key: 'overview', label: '1. Operation Overview' },
  { key: 'setup', label: '2. Required Setup' },
  { key: 'walkthrough', label: '3. Guided Walkthrough' },
  { key: 'authorisation', label: '4. Authorisation' },
  { key: 'verification', label: '5. Verification' },
  { key: 'exceptions', label: '6. Exceptions and Recovery' },
  { key: 'practice', label: '7. Practice Exercise' },
  { key: 'history', label: '8. Activity History' },
];
const activeTab = ref('overview');

const activeTabLabel = computed(() => tabs.find((t) => t.key === activeTab.value)?.label ?? '');

const TAB_PREVIEWS = {
  setup: 'Exact training data (customers, accounts, amounts), preconditions with a live “Check Preconditions” result, and a “Prepare Scenario” action that restores the required local data.',
  walkthrough: 'Numbered execution steps: login, screen, field, exact value, button, expected response and status after each step.',
  authorisation: 'Maker-checker handoff: request reference, next role and credentials, authoriser comparison checklist, and a “Switch to Required User” action.',
  verification: 'Live verification checklist (balances, statuses, journals, audit events) with links into the simulator inquiry screens.',
  exceptions: 'Common errors, why they occur, how to correct them, and recovery paths (return, reject, reverse, reset).',
  practice: 'A scenario variation for independent practice. Completion is verified against real simulator data, never by clicking through.',
  history: 'Your attempts and completions for this operation, read from the local training progress store.',
};
const tabPreview = computed(() => TAB_PREVIEWS[activeTab.value] ?? '');

function launch() {
  if (!operation.value) return;
  router.push(`/simulator/operations/${operation.value.code}`);
}
</script>
