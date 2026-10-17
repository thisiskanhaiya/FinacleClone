<template>
  <div>
    <p class="small muted mb-8">
      Fictional demo users for the local training environment only. These credentials
      do not belong to any real bank or system.
    </p>
    <table class="data-table">
      <thead>
        <tr>
          <th>Username</th>
          <th>Password</th>
          <th>Role</th>
          <th>Branch</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="employee in employees" :key="employee.username">
          <td class="mono">{{ employee.username }}</td>
          <td class="mono">{{ employee.password }}</td>
          <td>{{ roleLabel(employee.role) }}</td>
          <td class="mono">{{ employee.branch }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { employeeRepository } from '../../repositories/index.js';
import { ROLE_LABELS } from '../../domain/enums/roles.js';

const props = defineProps({
  /** Optional role filter, e.g. ['TELLER', 'TELLER_AUTHORISER']. */
  roles: { type: Array, default: null },
});

const employees = ref([]);

function roleLabel(role) {
  return ROLE_LABELS[role] ?? role;
}

onMounted(async () => {
  const all = await employeeRepository.findAll();
  employees.value = props.roles ? all.filter((e) => props.roles.includes(e.role)) : all;
});
</script>
