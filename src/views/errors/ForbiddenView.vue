<template>
  <div class="card" style="max-width: 560px; margin: 40px auto;">
    <h2>Not authorised</h2>
    <p>
      Not authorised for your current role. The requested screen or operation requires a
      different role. This denial has been recorded in the audit trail.
    </p>
    <p v-if="from" class="small muted">Requested: <span class="mono">{{ from }}</span></p>
    <div class="flex">
      <router-link class="btn btn-primary" to="/simulator">Back to dashboard</router-link>
      <router-link class="btn" to="/training">Open Training Workbook</router-link>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const from = computed(() => (typeof route.query.from === 'string' ? route.query.from : null));
</script>
