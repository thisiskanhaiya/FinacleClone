<template>
  <div v-if="open" class="palette-overlay" @mousedown.self="close">
    <div class="palette" role="dialog" aria-label="Command palette">
      <input
        ref="inputRef"
        v-model="query"
        type="text"
        placeholder="Type an operation code, name or module…  (Esc to close)"
        aria-label="Command palette search"
        @keydown.down.prevent="move(1)"
        @keydown.up.prevent="move(-1)"
        @keydown.enter.prevent="selectCurrent"
        @keydown.esc="close"
      />
      <div class="palette-body">
        <template v-if="!query.trim() && flatItems.length">
          <div class="palette-section">Recent and favourite operations</div>
        </template>
        <template v-if="query.trim()">
          <div class="palette-section">Matching operations</div>
        </template>
        <template v-if="flatItems.length">
          <div
            v-for="(item, index) in flatItems"
            :key="item.code"
            class="search-result-item"
            :class="{ selected: index === selectedIndex, denied: !item.authorised }"
            @mousedown.prevent="choose(item)"
            @mousemove="selectedIndex = index"
          >
            <button
              class="fav-toggle"
              :class="{ active: isFavourite(item.code) }"
              :title="isFavourite(item.code) ? 'Remove from favourites' : 'Add to favourites'"
              @mousedown.prevent.stop="toggleFavourite(item.code)"
            >★</button>
            <span class="op-code">{{ item.code }}</span>
            <span class="op-name">{{ item.name }}</span>
            <span v-if="!item.authorised" class="badge badge-red">Not authorised</span>
            <span v-else class="op-module">{{ item.moduleLabel }}</span>
          </div>
        </template>
        <div v-else class="search-result-empty">No operations match “{{ query }}”.</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/authStore.js';
import { useOperationStore } from '../../stores/operationStore.js';
import { MODULE_LABELS } from '../../domain/enums/modules.js';
import { canAccessOperation } from '../../domain/rules/permissionRules.js';

const router = useRouter();
const auth = useAuthStore();
const operationStore = useOperationStore();

const open = ref(false);
const query = ref('');
const selectedIndex = ref(0);
const inputRef = ref(null);

const flatItems = computed(() => {
  if (query.value.trim()) {
    return operationStore.search(query.value, auth.role, { includeUnauthorised: true });
  }
  const seen = new Set();
  const items = [];
  for (const op of [...operationStore.recentOperations, ...operationStore.favouriteOperations]) {
    if (seen.has(op.code)) continue;
    seen.add(op.code);
    items.push({
      ...op,
      moduleLabel: MODULE_LABELS[op.module] ?? op.module,
      authorised: canAccessOperation(auth.role, op),
    });
  }
  return items;
});

function move(delta) {
  if (!flatItems.value.length) return;
  selectedIndex.value = (selectedIndex.value + delta + flatItems.value.length) % flatItems.value.length;
}

function selectCurrent() {
  const item = flatItems.value[selectedIndex.value];
  if (item) choose(item);
}

function choose(item) {
  if (!item.authorised) return;
  close();
  router.push(`/simulator/operations/${item.code}`);
}

function isFavourite(code) {
  return operationStore.favouriteCodes.includes(code);
}

function toggleFavourite(code) {
  operationStore.toggleFavourite(code);
}

function show() {
  open.value = true;
  query.value = '';
  selectedIndex.value = 0;
  nextTick(() => inputRef.value?.focus());
}

function close() {
  open.value = false;
}

watch(query, () => { selectedIndex.value = 0; });

defineExpose({ show, close });
</script>
