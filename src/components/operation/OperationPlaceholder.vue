<template>
  <div>
    <div class="page-header flex-between wrap">
      <div>
        <h1>{{ operation.name }}</h1>
        <div class="subtitle">
          <span class="mono">{{ operation.code }}</span> · {{ moduleLabel }} ·
          Modes: {{ operation.modes.join(', ') }}
        </div>
      </div>
      <span class="badge badge-gold">Scheduled for Phase {{ operation.phase }}</span>
    </div>

    <div class="alert alert-info">
      The operation framework (navigation, permission enforcement, search, audit) is live.
      The executable screen for <strong>{{ operation.code }}</strong> is delivered in
      Phase {{ operation.phase }} of the build plan.
    </div>

    <div class="card">
      <div class="card-title">Operation identity</div>
      <div class="detail-grid">
        <div><div class="label">Operation code</div><div class="value mono">{{ operation.code }}</div></div>
        <div><div class="label">Module</div><div class="value">{{ moduleLabel }}</div></div>
        <div><div class="label">Maker-checker</div><div class="value">{{ operation.makerChecker ? 'Required' : 'Not required' }}</div></div>
        <div><div class="label">Financial</div><div class="value">{{ operation.financial ? 'Yes - posts journals' : 'No' }}</div></div>
        <div><div class="label">Difficulty</div><div class="value">{{ operation.difficulty }}</div></div>
        <div>
          <div class="label">Roles with access</div>
          <div class="value">{{ roleLabels }}</div>
        </div>
      </div>
    </div>

    <div class="flex">
      <router-link class="btn" to="/simulator">Back to dashboard</router-link>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { MODULE_LABELS } from '../../domain/enums/modules.js';
import { ROLE_LABELS } from '../../domain/enums/roles.js';

const props = defineProps({
  operation: { type: Object, required: true },
});

const moduleLabel = computed(() => MODULE_LABELS[props.operation.module] ?? props.operation.module);
const roleLabels = computed(
  () => props.operation.allowedRoles.map((r) => ROLE_LABELS[r] ?? r).join(', '),
);
</script>
