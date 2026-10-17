<template>
  <div>
    <div class="page-header flex-between wrap">
      <div>
        <h1>Authorisation Queue</h1>
        <div class="subtitle">
          <span class="mono">{{ operation.code }}</span> · Requests waiting for a checker decision
        </div>
      </div>
      <button class="btn" @click="load">Refresh</button>
    </div>

    <div class="alert alert-info">
      Phase 1 shows the live queue read from local training data. Decision actions
      (Authorise / Reject / Return for Correction) are delivered with each operation's
      phase, enforced by the Authorisation Engine.
    </div>

    <EmptyState
      v-if="!pendingItems.length"
      title="Queue is empty"
      message="No requests are currently waiting for authorisation."
    />

    <table v-else class="data-table">
      <thead>
        <tr>
          <th>Reference</th>
          <th>Operation</th>
          <th>Summary</th>
          <th>Amount</th>
          <th>Maker</th>
          <th>Status</th>
          <th>Business date</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in pendingItems" :key="item.id">
          <td class="mono">{{ item.id }}</td>
          <td class="mono">{{ item.operationCode }}</td>
          <td>{{ item.summary }}</td>
          <td class="mono">{{ item.amount != null ? formatINR(item.amount) : '-' }}</td>
          <td class="mono">{{ item.maker }}</td>
          <td><span class="badge badge-amber">{{ item.status }}</span></td>
          <td class="mono">{{ item.businessDate }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { getRepository, COLLECTIONS } from '../../../repositories/index.js';
import { WORKFLOW_STATUS } from '../../../domain/enums/workflowStatus.js';
import { formatINR } from '../../../utils/money.js';
import EmptyState from '../../../components/common/EmptyState.vue';

defineProps({
  operation: { type: Object, required: true },
});

const pendingItems = ref([]);

async function load() {
  const requests = await getRepository(COLLECTIONS.AUTHORISATION_REQUESTS).findWhere(
    (r) => r.status === WORKFLOW_STATUS.PENDING_AUTHORISATION,
  );
  const transactions = await getRepository(COLLECTIONS.TRANSACTIONS).findWhere(
    (t) => t.status === WORKFLOW_STATUS.PENDING_AUTHORISATION,
  );
  pendingItems.value = [
    ...requests.map((r) => ({
      id: r.id,
      operationCode: r.operationCode,
      summary: r.summary ?? r.remarks ?? '-',
      amount: r.amount ?? null,
      maker: r.makerId,
      status: r.status,
      businessDate: r.businessDate,
    })),
    ...transactions.map((t) => ({
      id: t.id,
      operationCode: t.operationCode,
      summary: t.remarks ?? `${t.type}`,
      amount: t.amount ?? null,
      maker: t.maker,
      status: t.status,
      businessDate: t.businessDate,
    })),
  ];
}

onMounted(load);
</script>
