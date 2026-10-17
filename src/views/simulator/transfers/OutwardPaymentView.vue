<template>
  <div>
    <OperationScreenHeader :operation="operation" />

    <div class="alert alert-info">
      <template v-if="isRtgs">
        RTGS is the high-value rail: minimum <strong>₹2,00,000.00</strong>, settled immediately.
      </template>
      <template v-else>
        NEFT is the batch-settled retail rail: any amount up to ₹50,00,000.00; settlement happens in batches.
      </template>
      On approval the customer is debited into the <strong>Suspense GL (TRN-GL-9001)</strong> and a simulated
      gateway message is recorded - the money has left the account but not yet reached the other bank.
    </div>

    <ValidationErrorPanel :error="error" />
    <OperationResultPanel :result="result" />

    <div class="card">
      <div class="card-title">Step 1 - Source account</div>
      <div class="form-row">
        <div class="form-field">
          <label :for="`${rail}-source`">Debit account *</label>
          <input :id="`${rail}-source`" v-model="sourceNumber" placeholder="e.g. CA000001" list="op-account-list" />
        </div>
        <datalist id="op-account-list">
          <option v-for="a in accounts" :key="a.accountNumber" :value="a.accountNumber">
            {{ a.customerName ?? a.cif }} · {{ a.status }} · avail {{ formatINR(a.availableBalance) }}
          </option>
        </datalist>
        <div v-if="source" class="form-field">
          <label>Selected</label>
          <div class="value mono small">{{ source.customerName ?? source.cif }} · {{ source.status }} · {{ formatINR(source.availableBalance) }}</div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-title">Step 2 - Beneficiary (other bank)</div>
      <div class="form-row">
        <div class="form-field">
          <label :for="`${rail}-bname`">Beneficiary name *</label>
          <input :id="`${rail}-bname`" v-model="beneficiaryName" placeholder="e.g. Supplier One" />
        </div>
        <div class="form-field">
          <label :for="`${rail}-bacct`">Beneficiary account *</label>
          <input :id="`${rail}-bacct`" v-model="beneficiaryAccount" placeholder="e.g. 502000123456" />
        </div>
        <div class="form-field">
          <label :for="`${rail}-ifsc`">IFSC *</label>
          <input :id="`${rail}-ifsc`" v-model="ifsc" placeholder="e.g. HDFC0001234" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-field">
          <label :for="`${rail}-amount`">Amount (INR) *</label>
          <input :id="`${rail}-amount`" v-model="amount" :placeholder="isRtgs ? 'min 200000.00' : 'e.g. 15000.00'" inputmode="decimal" />
        </div>
        <div class="form-field" style="flex: 1">
          <label :for="`${rail}-remarks`">Remarks</label>
          <input :id="`${rail}-remarks`" v-model="remarks" placeholder="e.g. Invoice 4412" />
        </div>
      </div>
    </div>

    <div class="flex">
      <button class="btn btn-primary" :disabled="submitting" @click="submit">
        {{ submitting ? 'Submitting...' : `Submit ${isRtgs ? 'RTGS' : 'NEFT'} for authorisation` }}
      </button>
      <button class="btn" :disabled="submitting" @click="clearAll">Clear</button>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useAuthStore } from '../../../stores/authStore.js';
import { neftTransfer, rtgsTransfer } from '../../../services/transferService.js';
import { getRepository, COLLECTIONS } from '../../../repositories/index.js';
import { formatINR } from '../../../utils/money.js';
import OperationScreenHeader from '../../../components/operation/OperationScreenHeader.vue';
import ValidationErrorPanel from '../../../components/operation/ValidationErrorPanel.vue';
import OperationResultPanel from '../../../components/operation/OperationResultPanel.vue';

const props = defineProps({
  operation: { type: Object, required: true },
});

const auth = useAuthStore();
const isRtgs = computed(() => props.operation.code === 'PAY-RTGS-001');
const rail = computed(() => (isRtgs.value ? 'rtgs' : 'neft'));

const accounts = ref([]);
const sourceNumber = ref('');
const beneficiaryName = ref('');
const beneficiaryAccount = ref('');
const ifsc = ref('');
const amount = ref('');
const remarks = ref('');
const error = ref(null);
const result = ref(null);
const submitting = ref(false);

const source = computed(() => accounts.value.find((a) => a.accountNumber === sourceNumber.value.trim()) ?? null);

onMounted(async () => {
  accounts.value = await getRepository(COLLECTIONS.ACCOUNTS).findAll();
});

function clearAll() {
  sourceNumber.value = '';
  beneficiaryName.value = '';
  beneficiaryAccount.value = '';
  ifsc.value = '';
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
    const fn = isRtgs.value ? rtgsTransfer : neftTransfer;
    const { request } = await fn(
      {
        sourceAccountNumber: sourceNumber.value,
        amount: amount.value,
        beneficiaryName: beneficiaryName.value,
        beneficiaryAccount: beneficiaryAccount.value,
        ifsc: ifsc.value,
        remarks: remarks.value,
      },
      auth.session,
    );
    result.value = {
      title: `${isRtgs.value ? 'RTGS' : 'NEFT'} submitted for authorisation.`,
      facts: {
        'Request ID': request.id,
        From: request.payload.sourceAccountNumber,
        Beneficiary: `${request.payload.beneficiaryName} (${request.payload.ifsc})`,
        Amount: formatINR(request.amount),
        'Next step': 'Approval debits the account into Suspense and sends the gateway message',
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
