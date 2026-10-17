<template>
  <div>
    <div class="page-header flex-between wrap">
      <div>
        <h1>Operation Catalogue</h1>
        <div class="subtitle">
          Learn each operation here, then perform it in the Branch Operations Simulator.
          {{ filtered.length }} of {{ operations.length }} operations shown.
        </div>
      </div>
      <button class="btn" :disabled="!hasProgress" @click="confirmReset = true">Reset my progress</button>
    </div>

    <div class="card">
      <div class="form-row">
        <div class="form-field" style="flex:1; min-width:260px;">
          <label for="cat-q">Search</label>
          <input id="cat-q" v-model="query" type="text" placeholder="Code, name, keyword or module…" />
        </div>
        <div class="form-field">
          <label for="cat-module">Module</label>
          <select id="cat-module" v-model="moduleFilter">
            <option value="">All modules</option>
            <option v-for="(label, key) in moduleLabels" :key="key" :value="key">{{ label }}</option>
          </select>
        </div>
        <div class="form-field">
          <label for="cat-role">Maker/checker role</label>
          <select id="cat-role" v-model="roleFilter">
            <option value="">All roles</option>
            <option v-for="(label, key) in roleLabels" :key="key" :value="key">{{ label }}</option>
          </select>
        </div>
        <div class="form-field">
          <label for="cat-difficulty">Difficulty</label>
          <select id="cat-difficulty" v-model="difficultyFilter">
            <option value="">All levels</option>
            <option value="BEGINNER">Beginner</option>
            <option value="INTERMEDIATE">Intermediate</option>
            <option value="ADVANCED">Advanced</option>
          </select>
        </div>
      </div>
    </div>

    <EmptyState
      v-if="!filtered.length"
      title="No operations match"
      message="Adjust the search text or filters above."
    />

    <div v-else class="card-grid">
      <OperationCard
        v-for="op in filtered"
        :key="op.code"
        :operation="op"
        :authorised="canAccess(auth.role, op)"
        :progress="progressFor(op.code)"
      />
    </div>

    <ConfirmDialog
      :open="confirmReset"
      title="Reset training progress?"
      message="Your completion markers will be cleared. Simulator data is not affected. The reset is audited."
      confirm-label="Reset progress"
      @confirm="resetProgress"
      @cancel="confirmReset = false"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useAuthStore } from '../../../stores/authStore.js';
import { useOperationStore } from '../../../stores/operationStore.js';
import { MODULE_LABELS } from '../../../domain/enums/modules.js';
import { ROLE_LABELS } from '../../../domain/enums/roles.js';
import { canAccessOperation } from '../../../domain/rules/permissionRules.js';
import { trainingProgressRepository } from '../../../repositories/index.js';
import { recordAudit } from '../../../services/auditService.js';
import { AUDIT_ACTIONS } from '../../../domain/enums/auditActions.js';
import OperationCard from '../../../components/training/OperationCard.vue';
import EmptyState from '../../../components/common/EmptyState.vue';
import ConfirmDialog from '../../../components/dialogs/ConfirmDialog.vue';

const auth = useAuthStore();
const operationStore = useOperationStore();

const query = ref('');
const moduleFilter = ref('');
const roleFilter = ref('');
const difficultyFilter = ref('');
const confirmReset = ref(false);
const progressRows = ref([]);

const operations = computed(() => operationStore.registry);
const moduleLabels = MODULE_LABELS;
const roleLabels = ROLE_LABELS;

const filtered = computed(() => {
  let list = operations.value;
  if (moduleFilter.value) list = list.filter((o) => o.module === moduleFilter.value);
  if (roleFilter.value) list = list.filter((o) => o.allowedRoles.includes(roleFilter.value));
  if (difficultyFilter.value) list = list.filter((o) => o.difficulty === difficultyFilter.value);
  if (query.value.trim()) {
    const codes = new Set(operationStore.search(query.value, auth.role).map((o) => o.code));
    list = list.filter((o) => codes.has(o.code));
  }
  return list;
});

const hasProgress = computed(() => progressRows.value.length > 0);

function canAccess(role, op) {
  return canAccessOperation(role, op);
}

function progressFor(code) {
  return progressRows.value.find((p) => p.operationCode === code)?.status ?? 'NOT_STARTED';
}

async function loadProgress() {
  progressRows.value = await trainingProgressRepository.findAll();
}

async function resetProgress() {
  confirmReset.value = false;
  await trainingProgressRepository.clear();
  await recordAudit({
    action: AUDIT_ACTIONS.TRAINING_PROGRESS_RESET,
    entityType: 'TRAINING_PROGRESS',
    performedBy: auth.username,
    performedByRole: auth.role,
    branch: auth.branch,
  });
  await loadProgress();
}

onMounted(loadProgress);
</script>
