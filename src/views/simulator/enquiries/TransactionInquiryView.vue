<template>
  <div>
    <OperationScreenHeader :operation="operation" />

    <div class="card">
      <div class="card-title">Find transactions</div>
      <div class="flex">
        <div class="form-field" style="min-width: 320px">
          <label for="ti-search">ID, type, operation, maker or status</label>
          <input id="ti-search" v-model="query" placeholder="e.g. CASH_DEPOSIT or TXN-" @keyup.enter="search" />
        </div>
        <button class="btn mt-16" @click="search">Search</button>
      </div>
      <EmptyState v-if="loaded && !matches.length" title="No transactions" message="No transactions match that search." />
      <table v-else class="data-table mt-8">
        <thead>
          <tr><th>Transaction</th><th>Type</th><th>Operation</th><th>Amount</th><th>Status</th><th>Maker / Checker</th><th></th></tr>
        </thead>
        <tbody>
          <tr v-for="t in matches" :key="t.id">
            <td class="mono">{{ t.id }}</td>
            <td class="mono">{{ t.type }}</td>
            <td class="mono">{{ t.operationCode }}</td>
            <td class="mono">{{ formatINR(t.amount) }}</td>
            <td>
              <span class="badge" :class="{
                'badge-green': t.status === 'POSTED',
                'badge-amber': t.status === 'PENDING_AUTHORISATION',
                'badge-red': t.status === 'REVERSED' || t.status === 'FAILED',
                'badge-grey': true,
              }">{{ t.status }}</span>
            </td>
            <td class="mono">{{ t.maker }}{{ t.checker ? ` / ${t.checker}` : '' }}</td>
            <td><button class="btn btn-link" @click="select(t)">Detail</button></td>
          </tr>
        </tbody>
      </table>
    </div>

    <template v-if="detail">
      <div class="card">
        <div class="card-title">Transaction {{ detail.transaction.id }}</div>
        <div class="detail-grid">
          <div><div class="label">Type</div><div class="value mono">{{ detail.transaction.type }}</div></div>
          <div><div class="label">Status</div><div class="value">{{ detail.transaction.status }}</div></div>
          <div><div class="label">Amount</div><div class="value mono">{{ formatINR(detail.transaction.amount) }}</div></div>
          <div><div class="label">Business date</div><div class="value mono">{{ detail.transaction.businessDate }}</div></div>
          <div><div class="label">Maker</div><div class="value mono">{{ detail.transaction.maker }}</div></div>
          <div><div class="label">Checker</div><div class="value mono">{{ detail.transaction.checker ?? '-' }}</div></div>
          <div v-if="detail.transaction.reversedBy"><div class="label">Reversed by</div><div class="value mono">{{ detail.transaction.reversedBy }}</div></div>
          <div v-if="detail.transaction.relatedRequestId"><div class="label">Originating request</div><div class="value mono">{{ detail.transaction.relatedRequestId }}</div></div>
        </div>
        <p v-if="detail.transaction.remarks" class="small muted mt-8">{{ detail.transaction.remarks }}</p>
      </div>

      <div class="card">
        <div class="card-title">Journal {{ detail.transaction.journalId }} (balanced)</div>
        <table class="data-table">
          <thead><tr><th>GL</th><th>Name</th><th>Side</th><th>Amount</th><th>Narrative</th></tr></thead>
          <tbody>
            <tr v-for="l in detail.journalLines" :key="l.id">
              <td class="mono">{{ l.glCode }}</td>
              <td>{{ l.glName }}</td>
              <td><span class="badge" :class="l.side === 'DEBIT' ? 'badge-gold' : 'badge-teal'">{{ l.side }}</span></td>
              <td class="mono">{{ formatINR(l.amount) }}</td>
              <td class="small">{{ l.narrative }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="card">
        <div class="card-title">Account legs</div>
        <EmptyState v-if="!detail.legs.length" title="No account legs" message="This transaction did not touch customer accounts (pure GL movement)." />
        <table v-else class="data-table">
          <thead><tr><th>Account</th><th>Side</th><th>Amount</th><th>Balance after</th></tr></thead>
          <tbody>
            <tr v-for="l in detail.legs" :key="l.id">
              <td class="mono">{{ l.accountNumber }}</td>
              <td><span class="badge" :class="l.side === 'CREDIT' ? 'badge-green' : 'badge-red'">{{ l.side }}</span></td>
              <td class="mono">{{ formatINR(l.amount) }}</td>
              <td class="mono">{{ formatINR(l.balanceAfter) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { searchTransactions, getTransactionDetail } from '../../../services/transferService.js';
import { formatINR } from '../../../utils/money.js';
import OperationScreenHeader from '../../../components/operation/OperationScreenHeader.vue';
import EmptyState from '../../../components/common/EmptyState.vue';

defineProps({
  operation: { type: Object, required: true },
});

const query = ref('');
const matches = ref([]);
const loaded = ref(false);
const detail = ref(null);

async function search() {
  matches.value = await searchTransactions(query.value);
  loaded.value = true;
  detail.value = null;
}

async function select(t) {
  detail.value = await getTransactionDetail(t.id);
}

onMounted(search);
</script>
