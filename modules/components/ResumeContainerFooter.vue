<template>
  <div id="resume-content-footer">
    <div>
      <span class="viewer-label">Resume Viewer ({{ resumePercentage }}%)</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useResizeHandle } from '@/modules/composables/useResizeHandle.mjs';

const { percentage: scenePercentage } = useResizeHandle();

const resumePercentage = computed(() => {
  return 100 - Math.round(scenePercentage.value);
});
</script>

<style scoped>
#resume-content-footer {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: transparent !important;
  padding: 10px;
  flex-shrink: 0; /* Fits children */
  z-index: 10; /* Ensure it's above resume content */
  pointer-events: none; /* Allow clicking through to resume content */
}

/* Make all divs and spans in the footer transparent */
#resume-content-footer div,
#resume-content-footer span {
  background-color: transparent !important;
}

/* .viewer-label styling consolidated in AppContent.vue */
</style> 