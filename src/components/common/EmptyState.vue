<template>
  <div class="card" style="text-align:center; padding: 32px 16px;">
    <h3>{{ title }}</h3>
    <p class="muted">{{ message }}</p>
    <slot />
  </div>
</template>

<script setup>
defineProps({
  title: { type: String, default: 'Nothing here yet' },
  message: { type: String, default: 'No records match the current criteria.' },
});
</script>
