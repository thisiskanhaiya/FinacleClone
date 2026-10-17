<template>
  <div>
    <OperationScreenHeader :operation="operation" />

    <ValidationErrorPanel :error="error" />
    <OperationResultPanel :result="result" />

    <EmptyState
      v-if="loaded && !position.session"
      title="No open teller session"
      message="There is nothing to close. Open a session first with TEL-SESSION-OPEN-001."
    />

    <template v-if="position.session">
      <div class="card">
        <div class="card-title">Close session {{ position.session.id }} - count your drawer</div>
        <div class="detail-grid mb-8">
          <div><div class="label">Opening float</div><div class="value mono">{{ formatINR(position.session.openingCash) }}</div></div>
          <div><div class="label">Deposits (posted)</div><div class="value mono">{{ formatINR(position.deposits) }}</div></div>
          <div><div class="label">Withdrawals (posted)</div><div class="value mono">{{ formatINR(position.withdrawals) }}</div></div>
          <div><div class="label">System expects</div><div class="value mono">{{ formatINR(position.expectedCash) }}</div></div>
        </div>
        <p class="small muted">
          Count the physical cash and declare it below. An authoriser verifies the closing;
          any difference between your declaration and the system expectation is recorded as a
          variance and raises an exception for investigation.
        </p>
        <div class="form-row">
          <div class="form-field">
            <label for="declared-cash">Declared physical cash (INR) *</label>
            <input id="declared-cash" v-model="declaredCash" placeholder="e.g. 45000.00" inputmode="decimal" />
          </div>
        </div>
      </div>

      <div class="flex">
        <button class="btn btn-primary" :disabled="submitting" @click="submit">
          {{ submitting ? 'Submitting...' : 'Submit closing for authorisation' }}
        </button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useAuthStore } from '../../../stores/authStore.js';
import { getTellerPosition, requestSessionClose } from '../../../services/tellerService.js';
import { formatINR } from '../../../utils/money.js';
import OperationScreenHeader from '../../../components/operation/OperationScreenHeader.vue';
import ValidationErrorPanel from '../../../components/operation/ValidationErrorPanel.vue';
import OperationResultPanel from '../../../components/operation/OperationResultPanel.vue';
import EmptyState from '../../../components/common/EmptyState.vue';

defineProps({
  operation: { type: Object, required: true },
});

const auth = useAuthStore();
const position = ref({ session: null });
const declaredCash = ref('');
const loaded = ref(false);
const error = ref(null);
const result = ref(null);
const submitting = ref(false);

async function refresh() {
  position.value = await getTellerPosition(auth.username);
  loaded.value = true;
}

async function submit() {
  error.value = null;
  result.value = null;
  submitting.value = true;
  try {
    const request = await requestSessionClose({ declaredCash: declaredCash.value }, auth.session);
    result.value = {
      title: 'Session closing submitted for authorisation.',
      facts: {
        'Request ID': request.id,
        Session: position.value.session.id,
        'Declared cash': formatINR(request.payload.declaredCash),
        'System expected': formatINR(request.payload.systemCash),
        'Next step': 'A teller authoriser approves the closing',
      },
    };
    declaredCash.value = '';
  } catch (err) {
    error.value = err;
  } finally {
    submitting.value = false;
  }
}

onMounted(refresh);
</script>
