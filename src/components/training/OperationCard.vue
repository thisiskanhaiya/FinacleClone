<template>
  <div class="card">
    <div class="flex-between">
      <span class="mono small" style="color: var(--teal-600);">{{ operation.code }}</span>
      <span class="badge" :class="difficultyClass">{{ operation.difficulty }}</span>
    </div>
    <h3 class="mt-8">{{ operation.name }}</h3>
    <p class="small muted">
      {{ moduleLabel }} · {{ operation.makerChecker ? 'Maker-checker' : 'Single-user' }} ·
      {{ operation.financial ? 'Financial' : 'Non-financial' }}
    </p>
    <p class="small">
      Progress: <span class="badge" :class="progressBadgeClass">{{ progressLabel }}</span>
    </p>
    <div class="flex mt-8">
      <router-link class="btn btn-accent" :to="`/training/operations/${operation.code}`">Open Guide</router-link>
      <router-link
        v-if="authorised"
        class="btn"
        :to="operation.route"
      >Launch</router-link>
      <span v-else class="badge badge-red" title="Your current role cannot launch this operation">Locked</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { MODULE_LABELS } from '../../domain/enums/modules.js';

const props = defineProps({
  operation: { type: Object, required: true },
  authorised: { type: Boolean, default: false },
  /** NOT_STARTED | IN_PROGRESS | COMPLETED */
  progress: { type: String, default: 'NOT_STARTED' },
});

const moduleLabel = computed(() => MODULE_LABELS[props.operation.module] ?? props.operation.module);

const difficultyClass = computed(() => ({
  BEGINNER: 'badge-teal',
  INTERMEDIATE: 'badge-gold',
  ADVANCED: 'badge-red',
}[props.operation.difficulty] ?? 'badge-grey'));

const progressLabel = computed(() => ({
  NOT_STARTED: 'Not started',
  IN_PROGRESS: 'In progress',
  COMPLETED: 'Completed',
}[props.progress] ?? 'Not started'));

const progressBadgeClass = computed(() => ({
  NOT_STARTED: 'badge-grey',
  IN_PROGRESS: 'badge-amber',
  COMPLETED: 'badge-green',
}[props.progress] ?? 'badge-grey'));
</script>
