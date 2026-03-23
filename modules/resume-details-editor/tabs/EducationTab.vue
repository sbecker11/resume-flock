<template>
  <div class="rde-tab-content">
    <section class="rde-section">
      <h3 class="rde-section-title">Education</h3>
      <p class="rde-hint">Degree, institution, optional dates, and details.</p>

      <div
        v-for="(item, i) in localItems"
        :key="i"
        class="rde-edu-item"
      >
        <div class="rde-row">
          <label class="rde-label">Degree</label>
          <input v-model="item.degree" type="text" class="rde-input" placeholder="BA in Economics" />
        </div>
        <div class="rde-row">
          <label class="rde-label">Institution</label>
          <input v-model="item.institution" type="text" class="rde-input" placeholder="Stanford University" />
        </div>
        <div class="rde-grid">
          <div class="rde-row">
            <label class="rde-label">Start</label>
            <input v-model="item.start" type="text" class="rde-input" placeholder="9/XX" />
          </div>
          <div class="rde-row">
            <label class="rde-label">End</label>
            <input v-model="item.end" type="text" class="rde-input" placeholder="12/XX" />
          </div>
        </div>
        <div class="rde-row">
          <label class="rde-label">Description</label>
          <textarea v-model="item.description" class="rde-textarea" rows="5" placeholder="Relevant coursework, honors, additional notes..." />
        </div>

        <button type="button" class="rde-btn-remove" @click="removeItem(i)">Remove</button>
      </div>

      <button type="button" class="rde-btn-add" @click="addItem">+ Add education item</button>
    </section>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  data: { type: Object, default: () => ({}) }
});

const emit = defineEmits(['update:data']);

function normalizeItem(entry, fallbackIndex = 0) {
  return {
    index: typeof entry?.index === 'number' ? entry.index : fallbackIndex,
    degree: entry?.degree ?? '',
    institution: entry?.institution ?? '',
    start: entry?.start ?? '',
    end: entry?.end ?? '',
    description: entry?.description ?? ''
  };
}

function normalizeToArray(data) {
  if (!data || typeof data !== 'object') return [];
  const entries = Object.entries(data);
  entries.sort(([a], [b]) => {
    const na = Number(a);
    const nb = Number(b);
    if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
    return String(a).localeCompare(String(b));
  });
  return entries.map(([key, value], idx) => normalizeItem(value, Number.isNaN(Number(key)) ? idx : Number(key)));
}

function toIndexedObject(items) {
  const out = {};
  items.forEach((item, i) => {
    out[String(i)] = {
      index: i,
      degree: item.degree ?? '',
      institution: item.institution ?? '',
      start: item.start ?? '',
      end: item.end ?? '',
      description: item.description ?? ''
    };
  });
  return out;
}

const localItems = ref(normalizeToArray(props.data));
let isSyncingFromParent = false;

watch(
  () => props.data,
  (nextData) => {
    isSyncingFromParent = true;
    localItems.value = normalizeToArray(nextData);
    isSyncingFromParent = false;
  },
  { immediate: true }
);

watch(
  localItems,
  (items) => {
    if (isSyncingFromParent) return;
    emit('update:data', toIndexedObject(items));
  },
  { deep: true }
);

function addItem() {
  localItems.value.push(normalizeItem({}, localItems.value.length));
}

function removeItem(index) {
  localItems.value.splice(index, 1);
}
</script>

<style scoped>
.rde-tab-content { padding: 12px 16px; max-height: 60vh; overflow-y: auto; }
.rde-section { margin-bottom: 20px; }
.rde-section-title { font-size: 0.8rem; font-weight: 600; color: #fff; margin: 0 0 8px; }
.rde-hint { font-size: 0.7rem; color: rgba(255,255,255,0.4); margin: -4px 0 8px; }
.rde-edu-item { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.12); border-radius: 6px; padding: 10px; margin-bottom: 10px; }
.rde-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.rde-row { margin-bottom: 8px; }
.rde-label { display: block; font-size: 0.72rem; color: rgba(255,255,255,0.65); margin-bottom: 4px; }
.rde-input { width: 100%; background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.2); border-radius: 4px; padding: 6px 10px; color: #e0e0e0; font-size: 0.9rem; box-sizing: border-box; }
.rde-input:focus { outline: none; border-color: rgba(74,158,255,0.6); }
.rde-textarea { width: 100%; background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.2); border-radius: 4px; padding: 6px 10px; color: #e0e0e0; font-size: 0.9rem; resize: vertical; box-sizing: border-box; font-family: inherit; }
.rde-btn-add { margin-top: 4px; padding: 6px 12px; background: transparent; border: 1px dashed rgba(255,255,255,0.3); color: rgba(255,255,255,0.6); border-radius: 4px; cursor: pointer; font-size: 0.8rem; }
.rde-btn-add:hover { border-color: rgba(74,158,255,0.6); color: #7ac; }
.rde-btn-remove { margin-top: 4px; padding: 5px 10px; background: transparent; border: 1px solid rgba(255,255,255,0.2); color: rgba(255,255,255,0.7); border-radius: 4px; cursor: pointer; font-size: 0.75rem; }
.rde-btn-remove:hover { border-color: rgba(255,255,255,0.4); color: #fff; }
</style>
