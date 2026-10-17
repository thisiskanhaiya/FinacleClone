<template>
  <div v-if="hasErrors" class="alert alert-error">
    <strong>{{ message }}</strong>
    <ul v-if="entries.length" class="error-list">
      <li v-for="[field, error] in entries" :key="field">
        <span class="mono">{{ field === '_form' ? 'Form' : field }}</span> - {{ error }}
      </li>
    </ul>
  </div>
</template>

<script setup>
import { computed } from 'vue';

/**
 * Renders a ValidationError (or a plain message) as the standard
 * red validation panel used by every executable operation screen.
 */
const props = defineProps({
  error: { type: [Object, String, null], default: null },
});

const message = computed(() => {
  if (!props.error) return '';
  return typeof props.error === 'string' ? props.error : props.error.message;
});

const entries = computed(() => {
  if (!props.error || typeof props.error === 'string') return [];
  return Object.entries(props.error.fieldErrors ?? {});
});

const hasErrors = computed(() => Boolean(message.value));
</script>

<style scoped>
.error-list { margin: 6px 0 0; padding-left: 18px; }
</style>
