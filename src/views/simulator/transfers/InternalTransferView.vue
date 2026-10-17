<template>
  <div>
    <OperationScreenHeader :operation="operation" />

    <ValidationErrorPanel :error="error" />
    <OperationResultPanel :result="result" />

    <div class="card">
      <div class="card-title">Step 1 - Source and destination accounts (same bank)</div>
      <div class="form-row">
        <div class="form-field">
          <label for="it-source">From account *</label>
          <input id="it-source" v-model="sourceNumber" placeholder="e.g. SB000001" list="account-list" />
        </div>
        <div class="form-field">
          <label for="it-dest">To account *</label>
          <input id="it-dest" v-model="destinationNumber" placeholder="e.g. SB000002" list="account-list" />
        </div>
        <datalist id="account-list">
          <option v-for="a in accounts" :key="a.accountNumber" :value="a.accountNumber">
            {{ a.customerName ?? a.cif }} · {{ a.status }}
          </option>
        </datalist>
      </div>
      <div v-if="source || destination" class="detail-grid">
        <div v-if="source"><div class="label">From: {{ source.customerName ?? source.cif }}</div><div class="value mono">{{ source.accountNumber }} · {{ source.status }} · avail {{ formatINR(source.availableBalance) }}</div></div>
        <div v-if="destination"><div class="label">To: {{ destination.customerName ?? destination.cif }}</div><div class="value mono">{{ destination.accountNumber }} · {{ destination.status }}</div></div>
      </div>
    </div>

    <div class="card">
      <div class="card-title">Step 2 - Amount</div>
      <div class="form-row">
        <div class="form-field">
          <label for="it-amount">Amount (INR) *</label>
          <input id="it-amount" v-model="amount" placeholder="e.g. 5000.00" inputmode="decimal" />
        </div>
        <div class="form-field" style="flex: 1">
          <label for="it-remarks">Remarks</label>
          <input id="it-remarks" v-model="remarks" placeholder="e.g. Family support" />
        </div>
      </div>
      <p class="small muted">
        On approval: <span class="mono">Dr source deposit liability / Cr destination deposit liability</span>.
        The bank's total deposits do not change - liability shifts between customers.
      </p>
    </div>

    <div class="flex">
      <button class="btn btn-primary" :disabled="submitting" @click="submit">
        {{ submitting ? 'Submitting...' : 'Submit transfer for authorisation' }}
      </button>
      <button class="btn" :disabled="submitting" @click="clearAll">Clear</button>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useAuthStore } from '../../../stores/authStore.js';
import { internalTransfer } from '../../../services/transferService.js';
import { getRepository, COLLECTIONS } from '../../../repositories/index.js';
import { formatINR } from '../../../utils/money.js';
import OperationScreenHeader from '../../../components/operation/OperationScreenHeader.vue';
import ValidationErrorPanel from '../../../components/operation/ValidationErrorPanel.vue';
import OperationResultPanel from '../../../components/operation/OperationResultPanel.vue';

defineProps({
  operation: { type: Object, required: true },
});

const auth = useAuthStore();
const accounts = ref([]);
const sourceNumber = ref('');
const destinationNumber = ref('');
const amount = ref('');
const remarks = ref('');
const error = ref(null);
const result = ref(null);
const submitting = ref(false);

const source = computed(() => accounts.value.find((a) => a.accountNumber === sourceNumber.value.trim()) ?? null);
const destination = computed(() => accounts.value.find((a) => a.accountNumber === destinationNumber.value.trim()) ?? null);

onMounted(async () => {
  accounts.value = await getRepository(COLLECTIONS.ACCOUNTS).findAll();
});

function clearAll() {
  sourceNumber.value = '';
  destinationNumber.value = '';
  amount.value = '';
  remarks.value = '';
  error.value = null;
  result.value = null;
}

async function submit() {
  error.value = null;
  result.value = null;
  submitting.value = true;
  try {
    const { request } = await internalTransfer(
      {
        sourceAccountNumber: sourceNumber.value,
        destinationAccountNumber: destinationNumber.value,
        amount: amount.value,
        remarks: remarks.value,
      },
      auth.session,
    );
    result.value = {
      title: 'Transfer submitted for authorisation.',
      facts: {
        'Request ID': request.id,
        From: request.payload.sourceAccountNumber,
        To: request.payload.destinationAccountNumber,
        Amount: formatINR(request.amount),
        'Next step': 'A teller authoriser approves it; balances move only then',
      },
    };
    clearAll();
  } catch (err) {
    error.value = err;
  } finally {
    submitting.value = false;
  }
}
</script>
