<template>
  <div>
    <OperationScreenHeader :operation="operation" />

    <div class="card">
      <div class="card-title">Find customer</div>
      <div class="flex">
        <div class="form-field" style="min-width: 320px">
          <label for="mod-search">CIF or name</label>
          <input id="mod-search" v-model="query" placeholder="e.g. CIF000001 or Amit" @keyup.enter="search" />
        </div>
        <button class="btn mt-16" @click="search">Search</button>
      </div>
      <table v-if="matches.length" class="data-table mt-8">
        <thead>
          <tr><th>CIF</th><th>Name</th><th>Status</th><th>KYC</th><th></th></tr>
        </thead>
        <tbody>
          <tr v-for="c in matches" :key="c.cif">
            <td class="mono">{{ c.cif }}</td>
            <td>{{ c.name }}</td>
            <td><span class="badge" :class="c.status === 'ACTIVE' ? 'badge-green' : 'badge-amber'">{{ c.status }}</span></td>
            <td class="mono">{{ c.kycStatus }}</td>
            <td><button class="btn btn-link" @click="select(c)">Select</button></td>
          </tr>
        </tbody>
      </table>
      <p v-else-if="searched" class="muted small mt-8">No customers match that search.</p>
    </div>

    <template v-if="customer">
      <ValidationErrorPanel :error="error" />
      <OperationResultPanel :result="result" />

      <div class="card">
        <div class="card-title">Modifiable fields - {{ customer.name }} ({{ customer.cif }})</div>
        <p class="small muted">
          Only phone, email, address and segment can be changed here. Name, type and risk
          classification require their own servicing operations (later phases).
        </p>
        <div class="form-row">
          <div class="form-field">
            <label for="mod-phone">Phone</label>
            <input id="mod-phone" v-model="changes.phone" />
          </div>
          <div class="form-field">
            <label for="mod-email">Email</label>
            <input id="mod-email" v-model="changes.email" />
          </div>
          <div class="form-field">
            <label for="mod-segment">Segment</label>
            <select id="mod-segment" v-model="changes.segment">
              <option v-for="s in segments" :key="s" :value="s">{{ s }}</option>
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-field" style="flex: 1">
            <label for="mod-address">Address</label>
            <input id="mod-address" v-model="changes.address" placeholder="Current: none on record" />
          </div>
        </div>
      </div>

      <div class="flex">
        <button class="btn btn-primary" :disabled="submitting" @click="submit">
          {{ submitting ? 'Submitting...' : 'Submit modification for authorisation' }}
        </button>
        <button class="btn" :disabled="submitting" @click="clearSelection">Back to search</button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { useAuthStore } from '../../../stores/authStore.js';
import { searchCustomers, modifyCif } from '../../../services/customerService.js';
import OperationScreenHeader from '../../../components/operation/OperationScreenHeader.vue';
import ValidationErrorPanel from '../../../components/operation/ValidationErrorPanel.vue';
import OperationResultPanel from '../../../components/operation/OperationResultPanel.vue';

defineProps({
  operation: { type: Object, required: true },
});

const auth = useAuthStore();
const segments = ['REGULAR', 'SALARY', 'PREMIUM', 'SME', 'CORPORATE'];

const query = ref('');
const matches = ref([]);
const searched = ref(false);
const customer = ref(null);
const changes = reactive({ phone: '', email: '', address: '', segment: '' });
const error = ref(null);
const result = ref(null);
const submitting = ref(false);

async function search() {
  matches.value = await searchCustomers(query.value);
  searched.value = true;
  clearSelection();
}

function select(c) {
  customer.value = c;
  changes.phone = c.phone ?? '';
  changes.email = c.email ?? '';
  changes.address = c.address ?? '';
  changes.segment = c.segment ?? '';
  error.value = null;
  result.value = null;
}

function clearSelection() {
  customer.value = null;
  error.value = null;
  result.value = null;
}

async function submit() {
  error.value = null;
  result.value = null;
  submitting.value = true;
  try {
    const { request, touched } = await modifyCif(customer.value.cif, { ...changes }, auth.session);
    result.value = {
      title: 'Modification submitted for authorisation.',
      facts: {
        'Request ID': request.id,
        Customer: customer.value.cif,
        'Fields changed': touched.join(', '),
        Status: request.status,
      },
    };
    customer.value = null;
  } catch (err) {
    error.value = err;
  } finally {
    submitting.value = false;
  }
}
</script>
