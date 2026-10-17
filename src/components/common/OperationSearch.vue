<template>
  <div class="operation-search">
    <span class="search-icon" aria-hidden="true">⌕</span>
    <input
      ref="inputRef"
      v-model="query"
      type="text"
      placeholder="Search operations: code, name, module…"
      aria-label="Global operation search"
      @input="onInput"
      @keydown.down.prevent="move(1)"
      @keydown.up.prevent="move(-1)"
      @keydown.enter.prevent="selectCurrent"
      @keydown.esc="close"
      @focus="onInput"
    />
    <span class="kbd-hint" title="Press / to focus, Ctrl+K for command palette">/</span>

    <div v-if="open" class="search-results" role="listbox">
      <template v-if="results.length">
        <div
          v-for="(item, index) in results"
          :key="item.code"
          class="search-result-item"
          :class="{ selected: index === selectedIndex, denied: !item.authorised }"
          role="option"
          :aria-selected="index === selectedIndex"
          @mousedown.prevent="choose(item)"
          @mousemove="selectedIndex = index"
        >
          <span class="op-code">{{ item.code }}</span>
          <span class="op-name">{{ item.name }}</span>
          <span v-if="!item.authorised" class="badge badge-red">Not authorised for your current role</span>
          <span v-else class="op-module">{{ item.moduleLabel }}</span>
        </div>
      </template>
      <div v-else class="search-result-empty">No operations match “{{ query }}”.</div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/authStore.js';
import { useOperationStore } from '../../stores/operationStore.js';

const router = useRouter();
const auth = useAuthStore();
const operationStore = useOperationStore();

const inputRef = ref(null);
const query = ref('');
const results = ref([]);
const open = ref(false);
const selectedIndex = ref(0);

function onInput() {
  results.value = query.value.trim()
    ? operationStore.search(query.value, auth.role, { includeUnauthorised: true })
    : [];
  open.value = Boolean(query.value.trim());
  selectedIndex.value = 0;
}

function move(delta) {
  if (!results.value.length) return;
  selectedIndex.value = (selectedIndex.value + delta + results.value.length) % results.value.length;
}

function selectCurrent() {
  const item = results.value[selectedIndex.value];
  if (item) choose(item);
}

function choose(item) {
  if (!item.authorised) return; // hard block: no navigation for unauthorised roles
  close();
  query.value = '';
  router.push(`/simulator/operations/${item.code}`);
}

function close() {
  open.value = false;
}

function focus() {
  inputRef.value?.focus();
  inputRef.value?.select();
}

defineExpose({ focus });
</script>
