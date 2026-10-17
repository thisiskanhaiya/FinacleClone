<template>
  <div>
    <OperationScreenHeader :operation="operation" />

    <div class="card">
      <div class="card-title">Find customer</div>
      <div class="flex">
        <div class="form-field" style="min-width: 320px">
          <label for="c360-search">CIF or name</label>
          <input id="c360-search" v-model="query" placeholder="e.g. CIF000001 or Amit" @keyup.enter="search" />
        </div>
        <button class="btn mt-16" @click="search">Search</button>
      </div>
      <table v-if="matches.length" class="data-table mt-8">
        <thead>
          <tr><th>CIF</th><th>Name</th><th>Type</th><th>Status</th><th></th></tr>
        </thead>
        <tbody>
          <tr v-for="c in matches" :key="c.cif">
            <td class="mono">{{ c.cif }}</td>
            <td>{{ c.name }}</td>
            <td>{{ c.type }}</td>
            <td><span class="badge" :class="c.status === 'ACTIVE' ? 'badge-green' : 'badge-amber'">{{ c.status }}</span></td>
            <td><button class="btn btn-link" @click="select(c)">Open 360 view</button></td>
          </tr>
        </tbody>
      </table>
      <p v-else-if="searched" class="muted small mt-8">No customers match that search.</p>
    </div>

    <template v-if="customer">
      <div class="card">
        <div class="card-title">Customer profile</div>
        <div class="detail-grid">
          <div><div class="label">CIF</div><div class="value mono">{{ customer.cif }}</div></div>
          <div><div class="label">Name</div><div class="value">{{ customer.name }}</div></div>
          <div><div class="label">Type</div><div class="value">{{ customer.type }}</div></div>
          <div><div class="label">Segment</div><div class="value">{{ customer.segment }}</div></div>
          <div><div class="label">Risk category</div><div class="value">{{ customer.riskCategory }}</div></div>
          <div><div class="label">KYC status</div><div class="value">{{ customer.kycStatus }}</div></div>
          <div><div class="label">Status</div><div class="value"><span class="badge" :class="customer.status === 'ACTIVE' ? 'badge-green' : 'badge-amber'">{{ customer.status }}</span></div></div>
          <div><div class="label">Home branch</div><div class="value mono">{{ customer.branch }}</div></div>
          <div><div class="label">Phone</div><div class="value mono">{{ customer.phone }}</div></div>
          <div><div class="label">Email</div><div class="value">{{ customer.email || '-' }}</div></div>
          <div><div class="label">Address</div><div class="value">{{ customer.address || '-' }}</div></div>
          <div v-if="customer.kyc">
            <div class="label">ID proof</div>
            <div class="value mono">{{ customer.kyc.idProofType }} {{ customer.kyc.idProofNumber }}</div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-title">Accounts under this CIF ({{ accounts.length }})</div>
        <EmptyState
          v-if="!accounts.length"
          title="No accounts"
          message="This customer has no accounts yet. Use Open Savings Account / Open Current Account."
        />
        <table v-else class="data-table">
          <thead>
            <tr><th>Account</th><th>Product</th><th>Status</th><th>Ledger balance</th><th>Available</th><th>Opened</th></tr>
          </thead>
          <tbody>
            <tr v-for="a in accounts" :key="a.accountNumber">
              <td class="mono">{{ a.accountNumber }}</td>
              <td class="mono">{{ a.productCode }}</td>
              <td><span class="badge" :class="a.status === 'ACTIVE' ? 'badge-green' : 'badge-amber'">{{ a.status }}</span></td>
              <td class="mono">{{ formatINR(a.ledgerBalance) }}</td>
              <td class="mono">{{ formatINR(a.availableBalance) }}</td>
              <td class="mono">{{ a.openedOn ?? '-' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { searchCustomers } from '../../../services/customerService.js';
import { getRepository, COLLECTIONS } from '../../../repositories/index.js';
import { formatINR } from '../../../utils/money.js';
import OperationScreenHeader from '../../../components/operation/OperationScreenHeader.vue';
import EmptyState from '../../../components/common/EmptyState.vue';

defineProps({
  operation: { type: Object, required: true },
});

const query = ref('');
const matches = ref([]);
const searched = ref(false);
const customer = ref(null);
const accounts = ref([]);

async function search() {
  matches.value = await searchCustomers(query.value);
  searched.value = true;
  customer.value = null;
  accounts.value = [];
}

async function select(c) {
  customer.value = c;
  accounts.value = await getRepository(COLLECTIONS.ACCOUNTS).findWhere((a) => a.cif === c.cif);
}
</script>
