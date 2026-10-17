<template>
  <div class="layout-shell">
    <header class="app-header" style="background: var(--teal-600);">
      <router-link to="/training" class="brand" style="color: inherit;">
        <span class="brand-mark" style="border-color:#fff; color:#fff;">BW</span>
        <span>Bank Operations Workbook</span>
      </router-link>

      <div class="header-meta">
        <span class="hide-narrow">Signed in as <strong>{{ auth.displayName }}</strong> <span class="header-badge">{{ roleLabel }}</span></span>
        <button class="header-button" @click="goSimulator">Open Simulator</button>
        <button class="header-button" @click="logout">Logout</button>
      </div>
    </header>

    <div class="layout-body" style="grid-template-columns: 200px 1fr;">
      <nav class="app-nav" aria-label="Workbook sections">
        <div class="nav-section">Workbook</div>
        <router-link class="nav-item" :class="{ active: route.name === 'training-catalogue' }" to="/training">
          Operation Catalogue
        </router-link>
        <div class="nav-section">Cross-application</div>
        <router-link class="nav-item" to="/simulator">Branch Operations Simulator</router-link>
      </nav>

      <main class="layout-main">
        <router-view />
      </main>
    </div>

    <StatusBar />
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../stores/authStore.js';
import { ROLE_LABELS } from '../domain/enums/roles.js';
import StatusBar from '../components/common/StatusBar.vue';

const auth = useAuthStore();
const route = useRoute();
const router = useRouter();

const roleLabel = computed(() => ROLE_LABELS[auth.role] ?? auth.role);

function goSimulator() {
  router.push('/simulator');
}

async function logout() {
  await auth.logout();
  router.push({ name: 'login' });
}
</script>
