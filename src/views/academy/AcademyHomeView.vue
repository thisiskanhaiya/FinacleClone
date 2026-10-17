<template>
  <div>
    <div class="page-header">
      <h1>Operations Academy</h1>
      <div class="subtitle">
        Core banking concepts explained the way a branch experiences them — then practised
        in the Core Banking Simulator, which opens as a separate window.
      </div>
    </div>

    <div class="alert alert-info">
      The Academy contains no screen instructions. Learn the concept here, note the
      <strong>Simulator Practice</strong> box at the end of each operation (login, test account,
      amount, expected result, verification), then perform it in the simulator.
      <a href="/login" target="_blank" rel="noopener"><strong>Open the simulator in a new window ↗</strong></a>
    </div>

    <div class="card-grid">
      <router-link
        v-for="m in modules"
        :key="m.key"
        class="card academy-card"
        :to="`/academy/modules/${m.key}`"
      >
        <div class="flex-between">
          <span class="academy-num" style="width:24px; height:24px; font-size:12px;">{{ m.number }}</span>
          <span class="badge badge-teal">{{ operationCount(m.key) }} operations</span>
        </div>
        <h3 class="mt-8">{{ m.title }}</h3>
        <p class="small muted">{{ m.summary }}</p>
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { ACADEMY_MODULES } from '../../data/academyContent/modules.js';
import { OPERATION_CONCEPTS } from '../../data/academyContent/operationConcepts.js';

const modules = ACADEMY_MODULES;

function operationCount(moduleKey) {
  return Object.values(OPERATION_CONCEPTS).filter((c) => c.academyModule === moduleKey).length;
}
</script>

<style scoped>
.academy-card { text-decoration: none; transition: box-shadow 0.15s ease; }
.academy-card:hover { box-shadow: 0 4px 16px rgba(11, 31, 51, 0.12); text-decoration: none; }
.academy-num {
  display: inline-flex; align-items: center; justify-content: center;
  border-radius: 50%; background: var(--teal-100); color: var(--teal-600); font-weight: 700;
}
</style>
