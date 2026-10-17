<template>
  <div class="auth-card">
    <div class="auth-brand">
      <span class="brand-mark">CB</span>
      <div>
        <h2 style="margin:0;">Core Banking Training Environment</h2>
        <div class="small muted">Branch Operations Simulator · sign in</div>
      </div>
    </div>

    <div class="mt-16 mb-8"><EnvironmentBadge /></div>

    <div v-if="errorMessage" class="alert alert-error" role="alert">{{ errorMessage }}</div>

    <form @submit.prevent="submit">
      <div class="form-field mb-8">
        <label for="username">Username</label>
        <input id="username" v-model="username" type="text" autocomplete="username" autofocus />
        <span v-if="fieldErrors.username" class="field-error">{{ fieldErrors.username }}</span>
      </div>
      <div class="form-field mb-16">
        <label for="password">Password</label>
        <input id="password" v-model="password" type="password" autocomplete="current-password" />
        <span v-if="fieldErrors.password" class="field-error">{{ fieldErrors.password }}</span>
      </div>
      <button class="btn btn-primary" type="submit" :disabled="busy" style="width:100%; justify-content:center;">
        {{ busy ? 'Signing in…' : 'Sign In' }}
      </button>
    </form>

    <div class="mt-16">
      <button class="btn btn-link small" @click="showCredentials = !showCredentials">
        {{ showCredentials ? '▾ Hide' : '▸ Show' }} demo employee credentials
      </button>
      <div v-if="showCredentials" class="mt-8">
        <DemoCredentialsPanel />
      </div>
    </div>

    <div class="mt-16" style="border-top: 1px solid var(--grey-200); padding-top: 14px;">
      <a class="btn btn-accent" style="width:100%; justify-content:center;" href="/academy" target="_blank" rel="noopener">
        Open Operations Academy ↗
      </a>
      <p class="small muted mt-8" style="text-align:center;">
        New here? Learn the banking concepts in the Academy (opens in a new window),
        then come back and perform the operations.
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/authStore.js';
import { useEnvironmentStore } from '../../stores/environmentStore.js';
import DemoCredentialsPanel from '../../components/common/DemoCredentialsPanel.vue';
import EnvironmentBadge from '../../components/common/EnvironmentBadge.vue';

const auth = useAuthStore();
const environment = useEnvironmentStore();
const route = useRoute();
const router = useRouter();

const username = ref('');
const password = ref('');
const errorMessage = ref('');
const fieldErrors = ref({});
const busy = ref(false);
const showCredentials = ref(false);

async function submit() {
  errorMessage.value = '';
  fieldErrors.value = {};
  busy.value = true;
  try {
    await auth.login(username.value, password.value);
    await environment.load();
    router.push(typeof route.query.redirect === 'string' ? route.query.redirect : '/simulator');
  } catch (err) {
    if (err.name === 'ValidationError') {
      errorMessage.value = err.message;
      fieldErrors.value = err.fieldErrors ?? {};
    } else {
      errorMessage.value = 'Sign-in failed. Please try again.';
    }
  } finally {
    busy.value = false;
  }
}
</script>
