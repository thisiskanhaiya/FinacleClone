<template>
  <div v-if="result" class="alert alert-success">
    <strong>{{ title }}</strong>
    <div class="detail-grid mt-8">
      <div v-for="item in items" :key="item.label">
        <div class="label">{{ item.label }}</div>
        <div class="value" :class="{ mono: item.mono }">{{ item.value }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

/**
 * Success response panel shown after a maker submits (or a checker decides).
 * `result` is { title, facts: { label: value } }.
 */
const props = defineProps({
  result: { type: Object, default: null },
});

const title = computed(() => props.result?.title ?? '');
const items = computed(() =>
  Object.entries(props.result?.facts ?? {}).map(([label, value]) => ({
    label,
    value,
    mono: typeof value === 'string' && /^(CIF|SB|CA|REQ|TXN|JRN|TRN)-/.test(value),
  })),
);
</script>
