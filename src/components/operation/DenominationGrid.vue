<template>
  <div class="card">
    <div class="card-title">Denomination capture (optional, must total the amount)</div>
    <div class="denom-grid">
      <div v-for="d in denominations" :key="d" class="form-field denom-field">
        <label :for="`denom-${d}`">₹{{ d }} x</label>
        <input
          :id="`denom-${d}`"
          type="number"
          min="0"
          step="1"
          :value="modelValue[d] ?? ''"
          @input="update(d, $event.target.value)"
        />
      </div>
    </div>
    <p class="small mt-8" :class="matches ? 'muted' : 'denom-mismatch'">
      Denomination total: <strong class="mono">{{ formatINR(total) }}</strong>
      <template v-if="captured && !matches"> — must equal the amount exactly</template>
    </p>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { DENOMINATIONS } from '../../domain/validators/tellerValidator.js';
import { formatINR, toCents } from '../../utils/money.js';

const props = defineProps({
  modelValue: { type: Object, default: () => ({}) },
  amount: { type: [String, Number], default: '' },
});
const emit = defineEmits(['update:modelValue']);

const denominations = DENOMINATIONS;

function update(d, raw) {
  const next = { ...props.modelValue };
  const n = Number(raw);
  if (!raw || n <= 0) delete next[d];
  else next[d] = Math.floor(n);
  emit('update:modelValue', next);
}

const total = computed(() =>
  Object.entries(props.modelValue).reduce((s, [d, n]) => s + Number(d) * Number(n || 0), 0),
);
const captured = computed(() => Object.keys(props.modelValue).length > 0);
const matches = computed(() => {
  if (!captured.value) return true;
  try {
    return toCents(total.value) === toCents(props.amount);
  } catch {
    return false;
  }
});
</script>

<style scoped>
.denom-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(90px, 1fr)); gap: 8px; }
.denom-field { min-width: 0; }
.denom-mismatch { color: var(--red-600); }
</style>
