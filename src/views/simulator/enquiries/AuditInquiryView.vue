<template>
  <div>
    <div class="page-header">
      <h1>Audit Inquiry</h1>
      <div class="subtitle"><span class="mono">{{ operation.code }}</span> · Immutable audit events, newest first</div>
    </div>

    <div class="card">
      <div class="form-row">
        <div class="form-field">
          <label for="f-action">Action</label>
          <select id="f-action" v-model="filters.action">
            <option value="">All actions</option>
            <option v-for="action in actionOptions" :key="action" :value="action">{{ action }}</option>
          </select>
        </div>
        <div class="form-field">
          <label for="f-user">Performed by</label>
          <input id="f-user" v-model="filters.performedBy" type="text" placeholder="e.g. teller01" />
        </div>
        <div class="form-field" style="justify-content:flex-end;">
          <button class="btn btn-primary" @click="load">Search</button>
        </div>
      </div>
    </div>

    <EmptyState v-if="!events.length" title="No audit events" message="No events match the current filters." />

    <table v-else class="data-table">
      <thead>
        <tr>
          <th>Timestamp</th>
          <th>Action</th>
          <th>User</th>
          <th>Role</th>
          <th>Entity</th>
          <th>Result</th>
          <th>Details</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="event in events" :key="event.id">
          <td class="mono">{{ formatDateTime(event.timestamp) }}</td>
          <td><span class="badge" :class="badgeClass(event)">{{ event.action }}</span></td>
          <td class="mono">{{ event.performedBy }}</td>
          <td class="small">{{ event.performedByRole ?? '-' }}</td>
          <td class="mono small">{{ event.entityType ?? '-' }} {{ event.entityId ?? '' }}</td>
          <td>{{ event.result }}</td>
          <td class="mono small">{{ summarise(event.details) }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import { auditEngine } from '../../../services/auditService.js';
import { AUDIT_ACTIONS } from '../../../domain/enums/auditActions.js';
import { formatDateTime } from '../../../utils/datetime.js';
import EmptyState from '../../../components/common/EmptyState.vue';

defineProps({
  operation: { type: Object, required: true },
});

const events = ref([]);
const filters = reactive({ action: '', performedBy: '' });
const actionOptions = Object.values(AUDIT_ACTIONS);

async function load() {
  events.value = await auditEngine.list({
    action: filters.action || null,
    performedBy: filters.performedBy || null,
  });
}

function badgeClass(event) {
  if (event.result === 'FAILURE') return 'badge-red';
  if (event.action.includes('RESET') || event.action.includes('SEED')) return 'badge-gold';
  if (event.action.includes('LOGIN') || event.action.includes('LOGOUT')) return 'badge-teal';
  return 'badge-grey';
}

function summarise(details) {
  const text = JSON.stringify(details ?? {});
  return text.length > 80 ? `${text.slice(0, 80)}…` : text;
}

onMounted(load);
</script>
