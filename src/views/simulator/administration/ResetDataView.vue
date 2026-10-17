<template>
  <div>
    <div class="page-header">
      <h1>Reset Training Data</h1>
      <div class="subtitle"><span class="mono">{{ operation.code }}</span> · Restore the original fictional seed data</div>
    </div>

    <div class="card" style="max-width: 640px;">
      <p>
        This restores every training collection (customers, accounts, transactions, journals,
        audit trail, training progress) to its original seed state. Practice data created during
        training is discarded. The reset itself is recorded in the fresh audit trail.
      </p>
      <p class="small muted">Your current sign-in session is not affected.</p>

      <div v-if="done" class="alert alert-success">
        Environment reset complete. Seed data restored; the reset was audited.
      </div>
      <div v-if="error" class="alert alert-error">{{ error }}</div>

      <button class="btn btn-danger" :disabled="busy" @click="confirmOpen = true">
        {{ busy ? 'Resetting…' : 'Reset training environment' }}
      </button>
    </div>

    <ConfirmDialog
      :open="confirmOpen"
      title="Reset training environment?"
      message="All practice data will be discarded and the original fictional seed data restored. This cannot be undone."
      confirm-label="Yes, reset everything"
      danger
      @confirm="reset"
      @cancel="confirmOpen = false"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { seedService } from '../../../services/seedService.js';
import { useAuthStore } from '../../../stores/authStore.js';
import { useEnvironmentStore } from '../../../stores/environmentStore.js';
import ConfirmDialog from '../../../components/dialogs/ConfirmDialog.vue';

defineProps({
  operation: { type: Object, required: true },
});

const auth = useAuthStore();
const environment = useEnvironmentStore();

const confirmOpen = ref(false);
const busy = ref(false);
const done = ref(false);
const error = ref('');

async function reset() {
  confirmOpen.value = false;
  busy.value = true;
  done.value = false;
  error.value = '';
  try {
    await seedService.resetEnvironment({
      performedBy: auth.username,
      performedByRole: auth.role,
      branch: auth.branch,
    });
    await environment.load();
    done.value = true;
  } catch (err) {
    console.error(err);
    error.value = 'Reset failed. See console for details.';
  } finally {
    busy.value = false;
  }
}
</script>
