<template>
  <div>
    <OperationScreenHeader :operation="operation" />

    <EmptyState
      v-if="loaded && !position.session"
      title="No open teller session"
      message="Open a session with TEL-SESSION-OPEN-001 to start a cash position."
    />

    <template v-if="position.session">
      <div class="card-grid">
        <div class="card stat-card">
          <div class="stat-value mono">{{ formatINR(position.session.openingCash) }}</div>
          <div class="stat-label">Opening cash float</div>
        </div>
        <div class="card stat-card">
          <div class="stat-value mono">{{ formatINR(position.deposits) }}</div>
          <div class="stat-label">Cash deposits (posted today)</div>
        </div>
        <div class="card stat-card">
          <div class="stat-value mono">{{ formatINR(position.withdrawals) }}</div>
          <div class="stat-label">Cash withdrawals (posted today)</div>
        </div>
        <div class="card stat-card">
          <div class="stat-value mono">{{ formatINR(position.expectedCash) }}</div>
          <div class="stat-label">Expected cash in drawer</div>
        </div>
      </div>

      <div class="card">
        <div class="card-title">Session {{ position.session.id }}</div>
        <div class="detail-grid">
          <div><div class="label">Teller</div><div class="value mono">{{ position.session.tellerId }}</div></div>
          <div><div class="label">Business date</div><div class="value mono">{{ position.session.businessDate }}</div></div>
          <div><div class="label">Posted cash operations</div><div class="value">{{ position.transactionCount }}</div></div>
          <div><div class="label">Status</div><div class="value"><span class="badge badge-green">OPEN</span></div></div>
        </div>
        <p class="small muted mt-8">
          Expected cash = opening float + deposits − withdrawals (posted entries only).
          The physical drawer must match this at closing.
        </p>
      </div>
    </template>

    <div v-if="history.length" class="card">
      <div class="card-title">Your recent sessions</div>
      <table class="data-table">
        <thead>
          <tr><th>Session</th><th>Date</th><th>Opening</th><th>Declared</th><th>Variance</th><th>Status</th></tr>
        </thead>
        <tbody>
          <tr v-for="s in history" :key="s.id">
            <td class="mono">{{ s.id }}</td>
            <td class="mono">{{ s.businessDate }}</td>
            <td class="mono">{{ formatINR(s.openingCash) }}</td>
            <td class="mono">{{ s.declaredCash != null ? formatINR(s.declaredCash) : '-' }}</td>
            <td class="mono" :class="{ 'variance-bad': s.variance && s.variance !== 0 }">
              {{ s.variance != null ? formatINR(s.variance) : '-' }}
            </td>
            <td><span class="badge" :class="s.status === 'OPEN' ? 'badge-green' : 'badge-grey'">{{ s.status }}</span></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useAuthStore } from '../../../stores/authStore.js';
import { getTellerPosition, listTellerSessions } from '../../../services/tellerService.js';
import { formatINR } from '../../../utils/money.js';
import OperationScreenHeader from '../../../components/operation/OperationScreenHeader.vue';
import EmptyState from '../../../components/common/EmptyState.vue';

defineProps({
  operation: { type: Object, required: true },
});

const auth = useAuthStore();
const position = ref({ session: null });
const history = ref([]);
const loaded = ref(false);

onMounted(async () => {
  position.value = await getTellerPosition(auth.username);
  history.value = (await listTellerSessions(auth.username)).slice(0, 8);
  loaded.value = true;
});
</script>

<style scoped>
.variance-bad { color: var(--red-600); font-weight: 700; }
</style>
