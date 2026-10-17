<template>
  <div>
    <OperationScreenHeader :operation="operation" />

    <div class="tabs">
      <button v-if="mode === 'create'" class="tab active">Create</button>
      <button v-if="mode === 'execute'" class="tab active">Execute due</button>
      <button v-if="mode === 'cancel'" class="tab active">Cancel</button>
    </div>

    <ValidationErrorPanel :error="error" />
    <OperationResultPanel :result="result" />

    <!-- CREATE -->
    <template v-if="mode === 'create'">
      <div class="card">
        <div class="card-title">New standing instruction (recurring internal transfer)</div>
        <div class="form-row">
          <div class="form-field">
            <label for="si-source">From account *</label>
            <input id="si-source" v-model="form.sourceAccountNumber" placeholder="e.g. SB000001" list="si-accounts" />
          </div>
          <div class="form-field">
            <label for="si-dest">To account *</label>
            <input id="si-dest" v-model="form.destinationAccountNumber" placeholder="e.g. SB000002" list="si-accounts" />
          </div>
          <datalist id="si-accounts">
            <option v-for="a in accounts" :key="a.accountNumber" :value="a.accountNumber">{{ a.customerName ?? a.cif }}</option>
          </datalist>
          <div class="form-field">
            <label for="si-amount">Amount (INR) *</label>
            <input id="si-amount" v-model="form.amount" placeholder="e.g. 2000.00" inputmode="decimal" />
          </div>
          <div class="form-field">
            <label for="si-frequency">Frequency *</label>
            <select id="si-frequency" v-model="form.frequency">
              <option value="MONTHLY">Monthly</option>
              <option value="QUARTERLY">Quarterly</option>
            </select>
          </div>
          <div class="form-field">
            <label for="si-start">Start date *</label>
            <input id="si-start" v-model="form.startDate" type="date" />
          </div>
        </div>
        <p class="small muted">
          Approval activates the instruction; each due execution still goes through its own
          maker-checker cycle (PAY-SI-EXECUTE-001).
        </p>
      </div>
      <div class="flex">
        <button class="btn btn-primary" :disabled="submitting" @click="create">
          {{ submitting ? 'Submitting...' : 'Submit for authorisation' }}
        </button>
      </div>
    </template>

    <!-- EXECUTE -->
    <template v-if="mode === 'execute'">
      <div class="card">
        <div class="card-title">Due standing instructions (business date {{ businessDate }})</div>
        <EmptyState v-if="loaded && !due.length" title="Nothing due" message="No ACTIVE standing instruction is due today." />
        <table v-else class="data-table">
          <thead>
            <tr><th>SI</th><th>From</th><th>To</th><th>Amount</th><th>Frequency</th><th>Due date</th><th></th></tr>
          </thead>
          <tbody>
            <tr v-for="si in due" :key="si.id">
              <td class="mono">{{ si.id }}</td>
              <td class="mono">{{ si.sourceAccountNumber }}</td>
              <td class="mono">{{ si.destinationAccountNumber }}</td>
              <td class="mono">{{ formatINR(si.amount) }}</td>
              <td>{{ si.frequency }}</td>
              <td class="mono">{{ si.nextDueDate }}</td>
              <td><button class="btn btn-link" :disabled="submitting" @click="execute(si)">Execute</button></td>
            </tr>
          </tbody>
        </table>
        <p class="small muted mt-8">
          Execution is maker-checker: approval posts the transfer and advances the next due date
          by the frequency.
        </p>
      </div>
      <div class="card">
        <div class="card-title">All active instructions ({{ active.length }})</div>
        <table v-if="active.length" class="data-table">
          <thead>
            <tr><th>SI</th><th>From</th><th>To</th><th>Amount</th><th>Next due</th><th>Last executed</th></tr>
          </thead>
          <tbody>
            <tr v-for="si in active" :key="si.id">
              <td class="mono">{{ si.id }}</td>
              <td class="mono">{{ si.sourceAccountNumber }}</td>
              <td class="mono">{{ si.destinationAccountNumber }}</td>
              <td class="mono">{{ formatINR(si.amount) }}</td>
              <td class="mono">{{ si.nextDueDate }}</td>
              <td class="mono">{{ si.lastExecutedOn ?? '-' }}</td>
            </tr>
          </tbody>
        </table>
        <p v-else class="muted small">No active standing instructions.</p>
      </div>
    </template>

    <!-- CANCEL -->
    <template v-if="mode === 'cancel'">
      <div class="card">
        <div class="card-title">Active standing instructions</div>
        <EmptyState v-if="loaded && !active.length" title="Nothing to cancel" message="No ACTIVE standing instructions exist." />
        <table v-else class="data-table">
          <thead>
            <tr><th>SI</th><th>From</th><th>To</th><th>Amount</th><th>Next due</th><th></th></tr>
          </thead>
          <tbody>
            <tr v-for="si in active" :key="si.id">
              <td class="mono">{{ si.id }}</td>
              <td class="mono">{{ si.sourceAccountNumber }}</td>
              <td class="mono">{{ si.destinationAccountNumber }}</td>
              <td class="mono">{{ formatINR(si.amount) }}</td>
              <td class="mono">{{ si.nextDueDate }}</td>
              <td><button class="btn btn-link" :disabled="submitting" @click="cancel(si)">Cancel</button></td>
            </tr>
          </tbody>
        </table>
        <p class="small muted mt-8">Cancellation needs authorisation; the instruction then stops executing.</p>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { useAuthStore } from '../../../stores/authStore.js';
import {
  createStandingInstruction,
  executeStandingInstruction,
  cancelStandingInstruction,
  listStandingInstructions,
  dueStandingInstructions,
} from '../../../services/transferService.js';
import { environmentService } from '../../../services/environmentService.js';
import { getRepository, COLLECTIONS } from '../../../repositories/index.js';
import { formatINR } from '../../../utils/money.js';
import OperationScreenHeader from '../../../components/operation/OperationScreenHeader.vue';
import ValidationErrorPanel from '../../../components/operation/ValidationErrorPanel.vue';
import OperationResultPanel from '../../../components/operation/OperationResultPanel.vue';
import EmptyState from '../../../components/common/EmptyState.vue';

const props = defineProps({
  operation: { type: Object, required: true },
});

const auth = useAuthStore();
const mode = computed(() => {
  if (props.operation.code === 'PAY-SI-EXECUTE-001') return 'execute';
  if (props.operation.code === 'PAY-SI-CANCEL-001') return 'cancel';
  return 'create';
});

const accounts = ref([]);
const active = ref([]);
const due = ref([]);
const businessDate = ref('');
const loaded = ref(false);
const form = reactive({ sourceAccountNumber: '', destinationAccountNumber: '', amount: '', frequency: 'MONTHLY', startDate: '' });
const error = ref(null);
const result = ref(null);
const submitting = ref(false);

async function refresh() {
  accounts.value = await getRepository(COLLECTIONS.ACCOUNTS).findAll();
  active.value = await listStandingInstructions('ACTIVE');
  due.value = await dueStandingInstructions();
  businessDate.value = await environmentService.getBusinessDate();
  loaded.value = true;
}

function ok(title, facts) {
  result.value = { title, facts };
  error.value = null;
}

async function create() {
  error.value = null;
  result.value = null;
  submitting.value = true;
  try {
    const { si, request } = await createStandingInstruction({ ...form }, auth.session);
    ok('Standing instruction submitted for authorisation.', {
      'Request ID': request.id,
      SI: si.id,
      Amount: formatINR(si.amount),
      'First due': si.nextDueDate,
      'Next step': 'Approval activates the instruction',
    });
    Object.assign(form, { sourceAccountNumber: '', destinationAccountNumber: '', amount: '', frequency: 'MONTHLY', startDate: '' });
    await refresh();
  } catch (err) {
    error.value = err;
  } finally {
    submitting.value = false;
  }
}

async function execute(si) {
  error.value = null;
  result.value = null;
  submitting.value = true;
  try {
    const { request } = await executeStandingInstruction(si.id, auth.session);
    ok('Execution submitted for authorisation.', {
      'Request ID': request.id,
      SI: si.id,
      Amount: formatINR(si.amount),
      'Due date': si.nextDueDate,
      'Next step': 'Approval posts the transfer and advances the due date',
    });
    await refresh();
  } catch (err) {
    error.value = err;
  } finally {
    submitting.value = false;
  }
}

async function cancel(si) {
  error.value = null;
  result.value = null;
  submitting.value = true;
  try {
    const { request } = await cancelStandingInstruction(si.id, auth.session);
    ok('Cancellation submitted for authorisation.', {
      'Request ID': request.id,
      SI: si.id,
      'Next step': 'Approval marks the instruction CANCELLED',
    });
    await refresh();
  } catch (err) {
    error.value = err;
  } finally {
    submitting.value = false;
  }
}

onMounted(refresh);
</script>
