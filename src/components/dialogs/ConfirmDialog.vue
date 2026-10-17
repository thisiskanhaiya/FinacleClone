<template>
  <div v-if="open" class="modal-overlay" role="dialog" aria-modal="true" :aria-label="title" @keydown.esc="$emit('cancel')">
    <div class="modal">
      <h3>{{ title }}</h3>
      <p>{{ message }}</p>
      <div class="modal-actions">
        <button class="btn" @click="$emit('cancel')">Cancel</button>
        <button :class="['btn', danger ? 'btn-danger' : 'btn-primary']" @click="$emit('confirm')">
          {{ confirmLabel }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, default: 'Please confirm' },
  message: { type: String, default: '' },
  confirmLabel: { type: String, default: 'Confirm' },
  danger: { type: Boolean, default: false },
});
defineEmits(['confirm', 'cancel']);
</script>
