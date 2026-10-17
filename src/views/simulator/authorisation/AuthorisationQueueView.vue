<template>
  <div>
    <div class="page-header flex-between wrap">
      <div>
        <h1>Authorisation Queue</h1>
        <div class="subtitle">
          <span class="mono">{{ operation.code }}</span> · Maker-checker decisions, enforced by the Authorisation Engine
        </div>
      </div>
      <button class="btn" @click="load">Refresh</button>
    </div>

    <ValidationErrorPanel :error="error" />
    <div v-if="notice" class="alert alert-success">{{ notice }}</div>

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
          <th>Business date</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in pendingItems" :key="item.id">
          <td class="mono">{{ item.id }}</td>
          <td class="mono">{{ item.operationCode }}</td>
          <td>{{ item.summary }}</td>
          <td class="mono">{{ item.amount != null ? formatINR(item.amount) : '-' }}</td>
          <td class="mono">{{ item.makerId }}</td>
          <td class="mono">{{ item.businessDate }}</td>
          <td>
            <button v-if="item.makerId === auth.username" class="btn btn-link" disabled title="You cannot authorise your own request">
              Own request
            </button>
            <button v-else class="btn btn-link" @click="openDecision(item)">Review</button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Decision dialog -->
    <div v-if="selected" class="modal-overlay" @click.self="closeDecision">
      <div class="modal" style="width: 640px">
        <h3>Review request {{ selected.id }}</h3>

        <RequestDetailCard :request="selected" />

        <ValidationErrorPanel :error="decisionError" />

        <div class="form-row">
          <div class="form-field" style="flex: 1">
            <label for="dec-remarks">Remarks (mandatory for Reject / Return)</label>
            <textarea id="dec-remarks" v-model="remarks" rows="2" placeholder="Checker remarks"></textarea>
          </div>
        </div>

        <div class="modal-actions">
          <button class="btn" :disabled="deciding" @click="closeDecision">Cancel</button>
          <button class="btn btn-danger" :disabled="deciding" @click="decide('RETURN')">Return for correction</button>
          <button class="btn btn-danger" :disabled="deciding" @click="decide('REJECT')">Reject</button>
          <button class="btn btn-accent" :disabled="deciding" @click="decide('APPROVE')">Authorise</button>
        </div>
      </div>
    </div>

    <div v-if="history.length" class="card mt-16">
      <div class="card-title">Recently decided (your requests or decisions)</div>
      <table class="data-table">
        <thead>
          <tr><th>Reference</th><th>Operation</th><th>Summary</th><th>Maker</th><th>Checker</th><th>Status</th></tr>
        </thead>
        <tbody>
          <tr v-for="item in history" :key="item.id">
            <td class="mono">{{ item.id }}</td>
            <td class="mono">{{ item.operationCode }}</td>
            <td>{{ item.summary }}</td>
            <td class="mono">{{ item.makerId }}</td>
            <td class="mono">{{ item.checkerId ?? '-' }}</td>
            <td>
              <span class="badge" :class="{
                'badge-green': item.status === 'APPROVED',
                'badge-red': item.status === 'REJECTED',
                'badge-amber': item.status === 'RETURNED_FOR_CORRECTION',
              }">{{ item.status }}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useAuthStore } from '../../../stores/authStore.js';
import { listQueue, listRequestHistory, getRequest, decideRequest } from '../../../services/authorisationService.js';
import { formatINR } from '../../../utils/money.js';
import EmptyState from '../../../components/common/EmptyState.vue';
import RequestDetailCard from '../../../components/operation/RequestDetailCard.vue';
import ValidationErrorPanel from '../../../components/operation/ValidationErrorPanel.vue';

defineProps({
  operation: { type: Object, required: true },
});

const auth = useAuthStore();
const pendingItems = ref([]);
const history = ref([]);
const selected = ref(null);
const remarks = ref('');
const error = ref(null);
const decisionError = ref(null);
const notice = ref('');
const deciding = ref(false);

async function load() {
  pendingItems.value = await listQueue({}, auth.session);
  history.value = (await listRequestHistory(auth.session)).slice(0, 10);
}

function openDecision(item) {
  selected.value = item;
  remarks.value = '';
  decisionError.value = null;
}

function closeDecision() {
  selected.value = null;
  decisionError.value = null;
}

async function decide(decision) {
  decisionError.value = null;
  notice.value = '';
  deciding.value = true;
  try {
    const { request, effect } = await decideRequest(selected.value.id, decision, remarks.value, auth.session);
    const effectNote = effect?.transactionId ? ` Transaction ${effect.transactionId} posted.` : '';
    notice.value = `${request.id} decided: ${request.status}.${effectNote}`;
    closeDecision();
    await load();
  } catch (err) {
    decisionError.value = err;
  } finally {
    deciding.value = false;
  }
}

onMounted(async () => {
  try {
    await load();
  } catch (err) {
    error.value = err;
  }
  // Deep-link support: /simulator/operations/AUT-QUEUE-001?request=REQ-...
  const wanted = new URLSearchParams(window.location.search).get('request');
  if (wanted) {
    const req = await getRequest(wanted);
    if (req && req.status === 'PENDING_AUTHORISATION') openDecision(req);
  }
});
</script>
