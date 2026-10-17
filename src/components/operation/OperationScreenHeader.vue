<template>
  <div class="page-header flex-between wrap">
    <div>
      <h1>{{ operation.name }}</h1>
      <div class="subtitle">
        <span class="mono">{{ operation.code }}</span> · {{ moduleLabel }} ·
        Modes: {{ operation.modes.join(', ') }}
      </div>
    </div>
    <div class="flex">
      <span v-if="operation.makerChecker" class="badge badge-gold">Maker-Checker</span>
      <span v-if="operation.financial" class="badge badge-teal">Financial</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { MODULE_LABELS } from '../../domain/enums/modules.js';

const props = defineProps({
  operation: { type: Object, required: true },
});

const moduleLabel = computed(() => MODULE_LABELS[props.operation.module] ?? props.operation.module);
</script>
