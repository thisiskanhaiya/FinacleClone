<template>
  <div class="layout-shell">
    <header class="app-header">
      <router-link to="/simulator" class="brand" style="color: inherit;">
        <span class="brand-mark">CB</span>
        <span>Branch Operations Simulator</span>
      </router-link>

      <OperationSearch ref="searchRef" />

      <div class="header-meta">
        <span class="hide-narrow">Branch <strong>{{ auth.branch }}</strong></span>
        <span class="hide-narrow">Business date <strong>{{ environment.businessDate }}</strong></span>
        <span class="header-clock">{{ clock }}</span>
        <span>{{ auth.displayName }} <span class="header-badge">{{ roleLabel }}</span></span>
        <button
          v-if="canSeeAuthorisationQueue"
          class="header-badge attention"
          style="border:none; cursor:pointer;"
          title="Pending authorisations (Alt+A)"
          @click="goAuthorisationQueue"
        >
          ⏳ {{ environment.pendingAuthorisationCount }}
        </button>
        <span
          v-else
          class="header-badge"
          title="Pending authorisations branch-wide; the queue itself is restricted to checker roles"
        >
          ⏳ {{ environment.pendingAuthorisationCount }}
        </span>
        <span class="header-badge" title="Notifications">🔔 0</span>
        <button class="header-button" @click="logout">Logout</button>
        <button
          class="header-button"
          style="background:#d9485f; color:#fff; border:none;"
          title="Clear saved browser data and start fresh"
          @click="resetAppData"
        >
          Reset data
        </button>
      </div>
    </header>

    <div class="layout-body">
      <nav class="app-nav" aria-label="Simulator modules">
        <div class="nav-section">Workspace</div>
        <router-link class="nav-item" :class="{ active: isActive('dashboard') }" to="/simulator">Dashboard</router-link>

        <div class="nav-section">Modules</div>
        <template v-for="item in navItems" :key="item.module">
          <router-link
            v-if="item.accessible"
            class="nav-item"
            :class="{ active: isModuleActive(item.module) }"
            :to="item.to"
          >{{ item.label }}</router-link>
          <span v-else class="nav-item locked" :title="`No ${item.label} operation is available to your role`">
            🔒 {{ item.label }}
          </span>
        </template>

      </nav>

      <main class="layout-main">
        <router-view />
      </main>
    </div>

    <StatusBar />
    <CommandPalette ref="paletteRef" />
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../stores/authStore.js';
import { useEnvironmentStore } from '../stores/environmentStore.js';
import { MODULES, MODULE_LABELS } from '../domain/enums/modules.js';
import { operationsForRole } from '../data/operationSpecifications/operations.js';
import { bindGlobalShortcuts } from '../utils/keyboard.js';
import { ROLE_LABELS } from '../domain/enums/roles.js';
import OperationSearch from '../components/common/OperationSearch.vue';
import CommandPalette from '../components/common/CommandPalette.vue';
import StatusBar from '../components/common/StatusBar.vue';

const auth = useAuthStore();
const environment = useEnvironmentStore();
const route = useRoute();
const router = useRouter();

const searchRef = ref(null);
const paletteRef = ref(null);
const clock = ref(new Date().toLocaleTimeString('en-IN'));
let clockTimer = null;
let unbindShortcuts = null;

const roleLabel = computed(() => ROLE_LABELS[auth.role] ?? auth.role);
const canSeeAuthorisationQueue = computed(() => auth.canAccessOperationCode('AUT-QUEUE-001'));

function goAuthorisationQueue() {
  if (!canSeeAuthorisationQueue.value) return;
  router.push('/simulator/operations/AUT-QUEUE-001');
}

const MODULE_NAV = [
  MODULES.CUSTOMER,
  MODULES.ACCOUNTS,
  MODULES.TELLER,
  MODULES.TRANSFERS,
  MODULES.TERM_DEPOSITS,
  MODULES.LOANS,
  MODULES.SERVICING,
  MODULES.AUTHORISATION,
  MODULES.ENQUIRIES,
  MODULES.GENERAL_LEDGER,
  MODULES.INTEGRATION,
  MODULES.EXCEPTIONS,
  MODULES.REPORTS,
  MODULES.DAY_END,
];

const navItems = computed(() => {
  const allowed = new Set(operationsForRole(auth.role).map((o) => o.module));
  const items = MODULE_NAV.map((module) => ({
    module,
    label: MODULE_LABELS[module],
    accessible: allowed.has(module),
    to: `/simulator/modules/${module}`,
  }));
  items.push({
    module: MODULES.ADMINISTRATION,
    label: MODULE_LABELS[MODULES.ADMINISTRATION],
    accessible: allowed.has(MODULES.ADMINISTRATION),
    to: '/simulator/admin',
  });
  return items;
});

function isActive(name) {
  return route.name === name;
}

function isModuleActive(module) {
  return route.params.module === module;
}

async function logout() {
  await auth.logout();
  router.push({ name: 'login' });
}

async function resetAppData() {
  const confirmed = window.confirm(
    'This will clear all saved training data in this browser and restart the app from a fresh state. Continue?',
  );
  if (!confirmed) return;

  try {
    await auth.logout('RESET_LOCAL_DATA');
  } finally {
    try {
      window.localStorage.clear();
    } catch (error) {
      console.warn('Unable to clear localStorage:', error);
    }

    try {
      window.sessionStorage.clear();
    } catch (error) {
      console.warn('Unable to clear sessionStorage:', error);
    }

    router.push({ name: 'login' });
    window.location.reload();
  }
}

onMounted(async () => {
  await environment.load();
  clockTimer = setInterval(() => {
    clock.value = new Date().toLocaleTimeString('en-IN');
  }, 1000);
  unbindShortcuts = bindGlobalShortcuts({
    onSearchFocus: () => searchRef.value?.focus(),
    onPalette: () => paletteRef.value?.show(),
    onAuthorisationQueue: goAuthorisationQueue,
    onInquiry: () => router.push('/simulator/operations/ACCT-INQUIRY-001'),
    onEscape: () => paletteRef.value?.close(),
  });
});

onUnmounted(() => {
  clearInterval(clockTimer);
  unbindShortcuts?.();
});
</script>
