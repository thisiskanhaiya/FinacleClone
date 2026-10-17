<template>
  <div>
    <OperationScreenHeader :operation="operation" />

    <ValidationErrorPanel :error="error" />
    <OperationResultPanel :result="result" />

    <div class="card">
      <div class="card-title">Customer details ({{ isCorporate ? 'Corporate' : 'Retail' }})</div>
      <div class="form-row">
        <div class="form-field">
          <label for="cif-name">Customer name *</label>
          <input id="cif-name" v-model="form.name" placeholder="Full legal name" />
        </div>
        <div class="form-field">
          <label for="cif-segment">Segment *</label>
          <select id="cif-segment" v-model="form.segment">
            <option v-for="s in segments" :key="s" :value="s">{{ s }}</option>
          </select>
        </div>
        <div class="form-field">
          <label for="cif-risk">Risk category *</label>
          <select id="cif-risk" v-model="form.riskCategory">
            <option v-for="r in riskCategories" :key="r" :value="r">{{ r }}</option>
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-field">
          <label for="cif-phone">Phone *</label>
          <input id="cif-phone" v-model="form.phone" placeholder="+91-98XXXXXXXX" />
        </div>
        <div class="form-field">
          <label for="cif-email">Email</label>
          <input id="cif-email" v-model="form.email" placeholder="name@example.invalid" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-field" style="flex: 1">
          <label for="cif-address">Address *</label>
          <input id="cif-address" v-model="form.address" placeholder="Full address" />
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-title">Identity (KYC)</div>
      <div class="form-row">
        <div class="form-field">
          <label for="cif-idtype">ID proof type *</label>
          <select id="cif-idtype" v-model="form.idProofType">
            <option v-for="t in idProofTypes" :key="t" :value="t">{{ t }}</option>
          </select>
        </div>
        <div class="form-field">
          <label for="cif-idnumber">ID proof number *</label>
          <input id="cif-idnumber" v-model="form.idProofNumber" placeholder="Document number" />
        </div>
        <div v-if="isCorporate" class="form-field">
          <label for="cif-regref">Entity registration reference *</label>
          <input id="cif-regref" v-model="form.registrationRef" placeholder="CIN / registration no." />
        </div>
      </div>
    </div>

    <div class="flex">
      <button class="btn btn-primary" :disabled="submitting" @click="submit">
        {{ submitting ? 'Submitting...' : 'Submit for authorisation' }}
      </button>
      <button class="btn" :disabled="submitting" @click="reset">Clear</button>
    </div>
    <p class="small muted mt-8">
      Submission creates a PENDING_AUTHORISATION request. A checker must approve it
      in the Authorisation Queue before the CIF becomes ACTIVE.
    </p>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue';
import { useAuthStore } from '../../../stores/authStore.js';
import { createCif } from '../../../services/customerService.js';
import OperationScreenHeader from '../../../components/operation/OperationScreenHeader.vue';
import ValidationErrorPanel from '../../../components/operation/ValidationErrorPanel.vue';
import OperationResultPanel from '../../../components/operation/OperationResultPanel.vue';

const props = defineProps({
  operation: { type: Object, required: true },
});

const auth = useAuthStore();
const isCorporate = computed(() => props.operation.code === 'CIF-CORP-001');

const segments = ['REGULAR', 'SALARY', 'PREMIUM', 'SME', 'CORPORATE'];
const riskCategories = ['LOW', 'MEDIUM', 'HIGH'];
const idProofTypes = ['PASSPORT', 'PAN_CARD', 'AADHAAR', 'VOTER_ID', 'REGISTRATION_CERT'];

const blank = () => ({
  name: '',
  type: isCorporate.value ? 'CORPORATE' : 'RETAIL',
  segment: isCorporate.value ? 'SME' : 'REGULAR',
  riskCategory: 'LOW',
  phone: '',
  email: '',
  address: '',
  idProofType: 'PAN_CARD',
  idProofNumber: '',
  registrationRef: '',
});

const form = reactive(blank());
const error = ref(null);
const result = ref(null);
const submitting = ref(false);

async function submit() {
  error.value = null;
  result.value = null;
  submitting.value = true;
  try {
    const { customer, request } = await createCif({ ...form }, auth.session);
    result.value = {
      title: 'Request submitted for authorisation.',
      facts: {
        'Request ID': request.id,
        'CIF (pending)': customer.cif,
        Status: request.status,
        'Next step': 'Checker approves in the Authorisation Queue',
      },
    };
    Object.assign(form, blank());
  } catch (err) {
    error.value = err;
  } finally {
    submitting.value = false;
  }
}

function reset() {
  Object.assign(form, blank());
  error.value = null;
  result.value = null;
}
</script>
