<template>
  <div v-if="checked">
    <div v-if="session" class="alert alert-info">
      Teller session <strong class="mono">{{ session.id }}</strong> open · business date
      <span class="mono">{{ session.businessDate }}</span> · system cash
      <strong class="mono">{{ formatINR(session.systemCash) }}</strong>
    </div>
    <div v-else class="alert alert-warning">
      <strong>No open teller session.</strong> Cash operations require one — open it first via
      <router-link to="/simulator/operations/TEL-SESSION-OPEN-001">TEL-SESSION-OPEN-001</router-link>.
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useAuthStore } from '../../stores/authStore.js';
import { getOpenTellerSession } from '../../services/tellerService.js';
import { formatINR } from '../../utils/money.js';

const auth = useAuthStore();
const session = ref(null);
const checked = ref(false);

onMounted(async () => {
  session.value = await getOpenTellerSession(auth.username);
  checked.value = true;
});
</script>
