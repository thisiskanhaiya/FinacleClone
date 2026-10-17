<template>
  <div>
    <div class="page-header">
      <h1>Demo User Management</h1>
      <div class="subtitle"><span class="mono">{{ operation.code }}</span> · Fictional demo employees of this training environment</div>
    </div>

    <DemoCredentialsPanel />
  </div>
</template>

<script setup>
import DemoCredentialsPanel from '../../../components/common/DemoCredentialsPanel.vue';

defineProps({
  operation: { type: Object, required: true },
});
</script>
