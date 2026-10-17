<template>
  <div>
    <OperationScreenHeader :operation="operation" />
    <TellerSessionBanner />

    <ValidationErrorPanel :error="error" />
    <OperationResultPanel :result="result" />

    <div class="card">
      <div class="card-title">Step 1 - Select account</div>
      <div class="flex">
        <div class="form-field" style="min-width: 320px">
          <label :for="`${kind}-search`">Account, CIF or customer name</label>
          <input :id="`${kind}-search`" v-model="query" placeholder="e.g. SB000001" @keyup.enter="search" />
        </div>
        <button class="btn mt-16" @click="search">Search</button>
      </div>
      <table v-if="matches.length" class="data-table mt-8">
        <thead>
          <tr><th>Account</th><th>Customer</th><th>Product</th><th>Status</th><th>Available</th><th></th></tr>
        </thead>
        <tbody>
          <tr v-for="a in matches" :key="a.accountNumber">
            <td class="mono">{{ a.accountNumber }}</td>
            <td>{{ a.customerName ?? a.cif }}</td>
            <td class="mono">{{ a.productCode }}</td>
            <td><span class="badge" :class="a.status === 'ACTIVE' ? 'badge-green' : 'badge-amber'">{{ a.status }}</span></td>
            <td class="mono">{{ formatINR(a.availableBalance) }}</td>
            <td><button class="btn btn-link" @click="select(a)">Select</button></td>
          </tr>
        </tbody>
      </table>
      <p v-else-if="searched" class="muted small mt-8">No accounts match that search.</p>
    </div>

    <template v-if="account">
      <div class="card">
        <div class="card-title">
          Step 2 - Amount ({{ isDeposit ? 'cash in' : 'cash out' }} · {{ account.accountNumber }} · {{ account.customerName ?? account.cif }})
        </div>
        <div class="form-row">
          <div class="form-field">
            <label :for="`${kind}-amount`">Amount (INR) *</label>
            <input :id="`${kind}-amount`" v-model="amount" placeholder="e.g. 5000.00" inputmode="decimal" />
          </div>
          <div class="form-field" style="flex: 1">
            <label :for="`${kind}-remarks`">Remarks</label>
            <input :id="`${kind}-remarks`" v-model="remarks" placeholder="Optional note for the authoriser" />
          </div>
        </div>
        <p class="small muted">
          <template v-if="isDeposit">
            Journal on approval: <span class="mono">Dr Teller Cash (TRN-GL-1001) / Cr Deposit Liability</span>; the account is credited.
          </template>
          <template v-else>
            Journal on approval: <span class="mono">Dr Deposit Liability / Cr Teller Cash (TRN-GL-1001)</span>; the account is debited.
            Available balance, freeze status and product limits are checked at submission <em>and again at approval</em>.
          </template>
        </p>
      </div>

      <DenominationGrid v-model="denominations" :amount="amount" />

      <div class="flex">
        <button class="btn btn-primary" :disabled="submitting" @click="submit">
          {{ submitting ? 'Submitting...' : `Submit ${isDeposit ? 'deposit' : 'withdrawal'} for authorisation` }}
        </button>
        <button class="btn" :disabled="submitting" @click="clearAll">Start over</button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useAuthStore } from '../../../stores/authStore.js';
import { searchAccounts } from '../../../services/accountService.js';
import { cashDeposit, cashWithdrawal } from '../../../services/tellerService.js';
import { formatINR } from '../../../utils/money.js';
import OperationScreenHeader from '../../../components/operation/OperationScreenHeader.vue';
import ValidationErrorPanel from '../../../components/operation/ValidationErrorPanel.vue';
import OperationResultPanel from '../../../components/operation/OperationResultPanel.vue';
import TellerSessionBanner from '../../../components/operation/TellerSessionBanner.vue';
import DenominationGrid from '../../../components/operation/DenominationGrid.vue';

const props = defineProps({
  operation: { type: Object, required: true },
});

const auth = useAuthStore();
const isDeposit = computed(() => props.operation.code === 'TEL-CASH-DEPOSIT-001');
const kind = computed(() => (isDeposit.value ? 'dep' : 'wdr'));

const query = ref('');
const matches = ref([]);
const searched = ref(false);
const account = ref(null);
const amount = ref('');
const remarks = ref('');
const denominations = ref({});
const error = ref(null);
const result = ref(null);
const submitting = ref(false);

async function search() {
  matches.value = await searchAccounts(query.value);
  searched.value = true;
}

function select(a) {
  account.value = a;
  error.value = null;
  result.value = null;
}

function clearAll() {
  account.value = null;
  amount.value = '';
  remarks.value = '';
  denominations.value = {};
  error.value = null;
  result.value = null;
}

async function submit() {
  error.value = null;
  result.value = null;
  submitting.value = true;
  try {
    const fn = isDeposit.value ? cashDeposit : cashWithdrawal;
    const { request } = await fn(
      { accountNumber: account.value.accountNumber, amount: amount.value, denominations: denominations.value, remarks: remarks.value },
      auth.session,
    );
    result.value = {
      title: `${isDeposit.value ? 'Deposit' : 'Withdrawal'} submitted for authorisation.`,
      facts: {
        'Request ID': request.id,
        Account: account.value.accountNumber,
        Amount: formatINR(request.amount),
        Status: request.status,
        'Next step': 'A teller authoriser approves it in the Authorisation Queue',
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
