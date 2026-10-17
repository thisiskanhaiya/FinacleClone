<template>
  <div>
    <OperationScreenHeader :operation="operation" />

    <ValidationErrorPanel :error="error" />
    <OperationResultPanel :result="result" />

    <div class="card">
      <div class="card-title">Step 1 - Select customer (CIF must be ACTIVE with COMPLETE KYC)</div>
      <div class="flex">
        <div class="form-field" style="min-width: 320px">
          <label for="oa-search">CIF or name</label>
          <input id="oa-search" v-model="query" placeholder="e.g. CIF000001 or Amit" @keyup.enter="search" />
        </div>
        <button class="btn mt-16" @click="search">Search</button>
      </div>
      <table v-if="matches.length" class="data-table mt-8">
        <thead>
          <tr><th>CIF</th><th>Name</th><th>Type</th><th>Status</th><th>KYC</th><th></th></tr>
        </thead>
        <tbody>
          <tr v-for="c in matches" :key="c.cif">
            <td class="mono">{{ c.cif }}</td>
            <td>{{ c.name }}</td>
            <td>{{ c.type }}</td>
            <td><span class="badge" :class="c.status === 'ACTIVE' ? 'badge-green' : 'badge-amber'">{{ c.status }}</span></td>
            <td class="mono">{{ c.kycStatus }}</td>
            <td><button class="btn btn-link" @click="selectCustomer(c)">Select</button></td>
          </tr>
        </tbody>
      </table>
      <p v-else-if="searched" class="muted small mt-8">No customers match that search.</p>
    </div>

    <template v-if="customer">
      <div class="card">
        <div class="card-title">Step 2 - Product and opening amount ({{ customer.name }}, {{ customer.cif }})</div>
        <div class="form-row">
          <div class="form-field">
            <label for="oa-product">Product *</label>
            <select id="oa-product" v-model="productCode">
              <option value="">Select product</option>
              <option v-for="p in products" :key="p.productCode" :value="p.productCode">
                {{ p.productCode }} - {{ p.name }}
              </option>
            </select>
          </div>
          <div class="form-field">
            <label for="oa-amount">Opening amount (INR) *</label>
            <input id="oa-amount" v-model="openingAmount" placeholder="e.g. 5000.00" inputmode="decimal" />
          </div>
          <div class="form-field">
            <label for="oa-nominee">Nominee (optional)</label>
            <input id="oa-nominee" v-model="nomination" placeholder="Nominee name" />
          </div>
        </div>
        <p v-if="selectedProduct" class="small muted">
          Minimum opening amount for {{ selectedProduct.productCode }}:
          {{ formatINR(selectedProduct.minOpeningAmount) }}.
          The amount posts as Dr Teller Cash / Cr Deposit Liability on approval.
        </p>
      </div>

      <div class="flex">
        <button class="btn btn-primary" :disabled="submitting" @click="submit">
          {{ submitting ? 'Submitting...' : 'Submit for authorisation' }}
        </button>
        <button class="btn" :disabled="submitting" @click="clearAll">Start over</button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useAuthStore } from '../../../stores/authStore.js';
import { searchCustomers } from '../../../services/customerService.js';
import { openAccount } from '../../../services/accountService.js';
import { getRepository, COLLECTIONS } from '../../../repositories/index.js';
import { formatINR } from '../../../utils/money.js';
import OperationScreenHeader from '../../../components/operation/OperationScreenHeader.vue';
import ValidationErrorPanel from '../../../components/operation/ValidationErrorPanel.vue';
import OperationResultPanel from '../../../components/operation/OperationResultPanel.vue';

defineProps({
  operation: { type: Object, required: true },
});

const auth = useAuthStore();
const query = ref('');
const matches = ref([]);
const searched = ref(false);
const customer = ref(null);
const products = ref([]);
const productCode = ref('');
const openingAmount = ref('');
const nomination = ref('');
const error = ref(null);
const result = ref(null);
const submitting = ref(false);

const selectedProduct = computed(
  () => products.value.find((p) => p.productCode === productCode.value) ?? null,
);

onMounted(async () => {
  const all = await getRepository(COLLECTIONS.PRODUCTS).findAll();
  products.value = all.filter((p) => ['SAVINGS', 'CURRENT'].includes(p.accountCategory));
});

async function search() {
  matches.value = await searchCustomers(query.value);
  searched.value = true;
}

function selectCustomer(c) {
  customer.value = c;
  error.value = null;
  result.value = null;
}

function clearAll() {
  customer.value = null;
  productCode.value = '';
  openingAmount.value = '';
  nomination.value = '';
  error.value = null;
  result.value = null;
}

async function submit() {
  error.value = null;
  result.value = null;
  submitting.value = true;
  try {
    const { account, request } = await openAccount(
      { cif: customer.value.cif, productCode: productCode.value, openingAmount: openingAmount.value, nomination: nomination.value || null },
      auth.session,
    );
    result.value = {
      title: 'Account opening submitted for authorisation.',
      facts: {
        'Request ID': request.id,
        'Account (pending)': account.accountNumber,
        'Opening amount': formatINR(request.payload.openingAmount),
        Status: request.status,
        'Next step': 'Checker approves; initial deposit posts automatically',
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
