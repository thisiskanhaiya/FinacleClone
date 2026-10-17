<template>
  <div class="layout-shell academy-shell">
    <header class="app-header academy-header">
      <router-link to="/academy" class="brand" style="color: inherit;">
        <span class="brand-mark" style="border-color: var(--gold-500); color: var(--gold-500);">OA</span>
        <span>Operations Academy</span>
      </router-link>
      <span class="header-badge" style="background: var(--gold-500); color: var(--navy-900); font-weight:700;">
        Learn the banking. Practise in the simulator.
      </span>

      <div class="header-meta">
        <router-link class="header-button" style="text-decoration:none;" to="/academy/operations">Operations Index</router-link>
        <a class="header-button" href="/login" target="_blank" rel="noopener">Open Simulator ↗</a>
      </div>
    </header>

    <div class="layout-body" style="grid-template-columns: 232px 1fr;">
      <nav class="app-nav" aria-label="Academy modules">
        <div class="nav-section">Concept curriculum</div>
        <router-link
          v-for="m in modules"
          :key="m.key"
          class="nav-item"
          :class="{ active: route.params.module === m.key }"
          :to="`/academy/modules/${m.key}`"
        >
          <span class="academy-num">{{ m.number }}</span> {{ m.title }}
        </router-link>
        <div class="nav-section">Reference</div>
        <router-link class="nav-item" :class="{ active: route.name === 'academy-operations' }" to="/academy/operations">
          All Operations Index
        </router-link>
      </nav>

      <main class="layout-main academy-main">
        <router-view />
      </main>
    </div>

    <footer class="status-bar academy-footer">
      <span class="env-flag">OPERATIONS ACADEMY</span>
      <span class="separator">|</span>
      <span>Concept learning with fictional data — execution happens in the Core Banking Simulator (separate window).</span>
      <span class="separator">|</span>
      <span class="muted" style="color: var(--grey-500)">Not affiliated with or endorsed by any bank, Infosys or Finacle.</span>
    </footer>
  </div>
</template>

<script setup>
import { useRoute } from 'vue-router';
import { ACADEMY_MODULES } from '../data/academyContent/modules.js';

const route = useRoute();
const modules = ACADEMY_MODULES;
</script>

<style scoped>
.academy-shell { --nav-width: 232px; }
.academy-header { background: #123a3a; }
.academy-main { background: #fafbfc; }
.academy-num {
  display: inline-flex; align-items: center; justify-content: center;
  width: 18px; height: 18px; border-radius: 50%;
  background: var(--teal-100); color: var(--teal-600);
  font-size: 10px; font-weight: 700;
}
.academy-footer { background: #0d2b2b; }
</style>
