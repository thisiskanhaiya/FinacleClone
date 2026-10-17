<template>
  <div>
    <OperationScreenHeader :operation="operation" />

    <div class="alert alert-info">
      Reversal never edits history. It posts a new, linked transaction with every debit and
      credit mirrored, restoring balances while the original stays visible as REVERSED.
      A reversal needs a reason and a second person's approval.
    </div>

    <ValidationErrorPanel :error="error" />
    <OperationResultPanel :result="result" />

    <div class="card">
      <div class="card-title">Reversible transactions (POSTED, not yet reversed)</div>
      <EmptyState
        v-if="loaded && !reversible.length"
        title="Nothing reversible"
        message="No posted transactions exist that can be reversed."
      />
      <table v-else class="data-table">
        <thead>
          <tr><th>Transaction</th><th>Type</th><th>Operation</th><th>Amount</th><th>Maker</th><th>Posted</th><th></th></tr>
        </thead>
        <tbody>
          <tr v-for="t in reversible" :key="t.id">
            <td class="mono">{{ t.id }}</td>
            <td class="mono">{{ t.type }}</td>
            <td class="mono">{{ t.operationCode }}</td>
            <td class="mono">{{ formatINR(t.amount) }}</td>
            <td class="mono">{{ t.maker }}</td>
            <td class="mono">{{ t.businessDate }}</td>
            <td><button class="btn btn-link" @click="select(t)">Reverse</button></td>
          </tr>
        </tbody>
      </table>
    </div>

    <template v-if="selected">
      <div class="card">
        <div class="card-title">Reverse {{ selected.id }} ({{ selected.type }}, {{ formatINR(selected.amount) }})</div>
        <div class="form-row">
          <div class="form-field" style="flex: 1">
            <label for="rev-reason">Reason (mandatory, permanent in the audit trail) *</label>
            <textarea id="rev-reason" v-model="reason" rows="2" placeholder="e.g. Wrong account - customer requested SB000002, entered SB000001"></textarea>
          </div>
        </div>
        <p class="small muted">
          On approval the mirrored journal posts immediately. If the original credit was already
          spent, the reversal is blocked (balance cannot go negative) and the request stays pending.
        </p>
      </div>
      <div class="flex">
        <button class="btn btn-danger" :disabled="submitting" @click="submit">
          {{ submitting ? 'Submitting...' : 'Submit reversal for authorisation' }}
        </button>
        <button class="btn" :disabled="submitting" @click="selected = null">Cancel</button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useAuthStore } from '../../../stores/authStore.js';
import { listReversibleTransactions, requestReversal } from '../../../services/reversalService.js';
import { formatINR } from '../../../utils/money.js';
import OperationScreenHeader from '../../../components/operation/OperationScreenHeader.vue';
import ValidationErrorPanel from '../../../components/operation/ValidationErrorPanel.vue';
import OperationResultPanel from '../../../components/operation/OperationResultPanel.vue';
import EmptyState from '../../../components/common/EmptyState.vue';

defineProps({
  operation: { type: Object, required: true },
});

const auth = useAuthStore();
const reversible = ref([]);
const loaded = ref(false);
const selected = ref(null);
const reason = ref('');
const error = ref(null);
const result = ref(null);
const submitting = ref(false);

async function load() {
  reversible.value = await listReversibleTransactions();
  loaded.value = true;
}

function select(t) {
  selected.value = t;
  reason.value = '';
  error.value = null;
  result.value = null;
}

async function submit() {
  error.value = null;
  result.value = null;
  submitting.value = true;
  try {
    const { request } = await requestReversal(
      { transactionId: selected.value.id, reason: reason.value },
      auth.session,
    );
    result.value = {
      title: 'Reversal submitted for authorisation.',
      facts: {
        'Request ID': request.id,
        'Reversing': selected.value.id,
        Amount: formatINR(request.amount),
        'Next step': 'A teller authoriser approves; the mirrored journal then posts',
      },
    };
    selected.value = null;
    await load();
  } catch (err) {
    error.value = err;
  } finally {
    submitting.value = false;
  }
}

onMounted(load);
</script>
