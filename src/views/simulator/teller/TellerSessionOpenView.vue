<template>
  <div>
    <OperationScreenHeader :operation="operation" />

    <ValidationErrorPanel :error="error" />
    <OperationResultPanel :result="result" />

    <div v-if="openSession" class="card">
      <div class="card-title">Your open session</div>
      <div class="detail-grid">
        <div><div class="label">Session</div><div class="value mono">{{ openSession.id }}</div></div>
        <div><div class="label">Business date</div><div class="value mono">{{ openSession.businessDate }}</div></div>
        <div><div class="label">Opening cash</div><div class="value mono">{{ formatINR(openSession.openingCash) }}</div></div>
        <div><div class="label">System cash now</div><div class="value mono">{{ formatINR(openSession.systemCash) }}</div></div>
      </div>
      <p class="small muted mt-8">
        One open session per teller per business date. Close it with TEL-SESSION-CLOSE-001 when done.
      </p>
    </div>

    <template v-else>
      <div class="card">
        <div class="card-title">Open a teller session</div>
        <p class="small muted">
          You cannot take or pay cash until a session is open. Enter the opening cash float
          you physically received; you are accountable for it until the session is closed
          and authorised.
        </p>
        <div class="form-row">
          <div class="form-field">
            <label for="opening-cash">Opening cash float (INR) *</label>
            <input id="opening-cash" v-model="openingCash" placeholder="e.g. 50000.00" inputmode="decimal" />
          </div>
        </div>
      </div>
      <div class="flex">
        <button class="btn btn-primary" :disabled="submitting" @click="open">
          {{ submitting ? 'Opening...' : 'Open session' }}
        </button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useAuthStore } from '../../../stores/authStore.js';
import { openTellerSession, getOpenTellerSession } from '../../../services/tellerService.js';
import { formatINR } from '../../../utils/money.js';
import OperationScreenHeader from '../../../components/operation/OperationScreenHeader.vue';
import ValidationErrorPanel from '../../../components/operation/ValidationErrorPanel.vue';
import OperationResultPanel from '../../../components/operation/OperationResultPanel.vue';

defineProps({
  operation: { type: Object, required: true },
});

const auth = useAuthStore();
const openSession = ref(null);
const openingCash = ref('');
const error = ref(null);
const result = ref(null);
const submitting = ref(false);

async function refresh() {
  openSession.value = await getOpenTellerSession(auth.username);
}

async function open() {
  error.value = null;
  result.value = null;
  submitting.value = true;
  try {
    const record = await openTellerSession({ openingCash: openingCash.value }, auth.session);
    result.value = {
      title: 'Teller session opened.',
      facts: {
        Session: record.id,
        'Business date': record.businessDate,
        'Opening cash': formatINR(record.openingCash),
      },
    };
    await refresh();
  } catch (err) {
    error.value = err;
  } finally {
    submitting.value = false;
  }
}

onMounted(refresh);
</script>
