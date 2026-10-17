<template>
  <div>
    <OperationScreenHeader :operation="operation" />

    <div class="card">
      <div class="card-title">Find account</div>
      <div class="flex">
        <div class="form-field" style="min-width: 320px">
          <label for="ai-search">Account, CIF or customer name</label>
          <input id="ai-search" v-model="query" placeholder="e.g. SB000001" @keyup.enter="search" />
        </div>
        <button class="btn mt-16" @click="search">Search</button>
      </div>
      <table v-if="matches.length" class="data-table mt-8">
        <thead>
          <tr><th>Account</th><th>Customer</th><th>Product</th><th>Status</th><th>Ledger</th><th></th></tr>
        </thead>
        <tbody>
          <tr v-for="a in matches" :key="a.accountNumber">
            <td class="mono">{{ a.accountNumber }}</td>
            <td>{{ a.customerName ?? a.cif }}</td>
            <td class="mono">{{ a.productCode }}</td>
            <td><span class="badge" :class="a.status === 'ACTIVE' ? 'badge-green' : 'badge-amber'">{{ a.status }}</span></td>
            <td class="mono">{{ formatINR(a.ledgerBalance) }}</td>
            <td><button class="btn btn-link" @click="select(a)">Open</button></td>
          </tr>
        </tbody>
      </table>
      <p v-else-if="searched" class="muted small mt-8">No accounts match that search.</p>
    </div>

    <template v-if="account">
      <div class="card">
        <div class="card-title">Account details</div>
        <div class="detail-grid">
          <div><div class="label">Account number</div><div class="value mono">{{ account.accountNumber }}</div></div>
          <div><div class="label">Customer</div><div class="value">{{ account.customerName ?? account.cif }}</div></div>
          <div><div class="label">CIF</div><div class="value mono">{{ account.cif }}</div></div>
          <div><div class="label">Product</div><div class="value mono">{{ account.productCode }}</div></div>
          <div><div class="label">Status</div><div class="value"><span class="badge" :class="account.status === 'ACTIVE' ? 'badge-green' : 'badge-amber'">{{ account.status }}</span></div></div>
          <div><div class="label">Branch</div><div class="value mono">{{ account.branch }}</div></div>
          <div><div class="label">Ledger balance</div><div class="value mono">{{ formatINR(account.ledgerBalance) }}</div></div>
          <div><div class="label">Available balance</div><div class="value mono">{{ formatINR(account.availableBalance) }}</div></div>
          <div><div class="label">Lien amount</div><div class="value mono">{{ formatINR(account.lienAmount) }}</div></div>
          <div><div class="label">Opened on</div><div class="value mono">{{ account.openedOn ?? '-' }}</div></div>
        </div>
      </div>

      <div class="card">
        <div class="card-title">Transactions ({{ legs.length }})</div>
        <EmptyState
          v-if="!legs.length"
          title="No transactions"
          message="No posted transaction legs exist for this account yet."
        />
        <table v-else class="data-table">
          <thead>
            <tr><th>Transaction</th><th>Type</th><th>Side</th><th>Amount</th><th>Balance after</th><th>Posted</th></tr>
          </thead>
          <tbody>
            <tr v-for="row in legs" :key="row.id">
              <td class="mono">{{ row.transactionId }}</td>
              <td class="mono">{{ row.txn.type }}</td>
              <td><span class="badge" :class="row.side === 'CREDIT' ? 'badge-green' : 'badge-red'">{{ row.side }}</span></td>
              <td class="mono">{{ formatINR(row.amount) }}</td>
              <td class="mono">{{ formatINR(row.balanceAfter) }}</td>
              <td class="mono">{{ row.txn.businessDate }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { searchAccounts, getAccountTransactions } from '../../../services/accountService.js';
import { formatINR } from '../../../utils/money.js';
import OperationScreenHeader from '../../../components/operation/OperationScreenHeader.vue';
import EmptyState from '../../../components/common/EmptyState.vue';

defineProps({
  operation: { type: Object, required: true },
});

const query = ref('');
const matches = ref([]);
const searched = ref(false);
const account = ref(null);
const legs = ref([]);

async function search() {
  matches.value = await searchAccounts(query.value);
  searched.value = true;
  account.value = null;
  legs.value = [];
}

async function select(a) {
  account.value = a;
  legs.value = await getAccountTransactions(a.accountNumber);
}
</script>
