<script setup>
import { ref, computed } from 'vue';
import { badgeManager } from '@/modules/core/badgeManager.mjs';
import { selectionManager } from '@/modules/core/selectionManager.mjs';

// --- Reactive refs for current mode ---
const badgeMode = ref(badgeManager.getMode());
const selectedJobNumber = ref(selectionManager.getSelectedJobNumber());

// Listen for mode changes from BadgeManager
badgeManager.addEventListener('badgeModeChanged', (event) => {
  badgeMode.value = event.detail.mode;
});

// Listen for selection changes
selectionManager.addEventListener('selectionChanged', (event) => {
  selectedJobNumber.value = event.detail.selectedJobNumber;
});

selectionManager.addEventListener('selectionCleared', () => {
  selectedJobNumber.value = null;
});

const isHovering = ref(false);
const hasJustClicked = ref(false);

// Mode progression: none -> show -> stats -> none
const nextMode = computed(() => {
  return badgeManager.getNextMode();
});

// The mode whose icon we're currently displaying (for CSS class styling)
const displayedIconMode = computed(() => {
  return isHovering.value ? nextMode.value : badgeMode.value;
});

// The actual icon to show with superscripts
const displayIcon = computed(() => {
  return badgeManager.getDisplayIcon(isHovering.value);
});

// CSS classes for the button
const buttonClasses = computed(() => {
  return [
    displayedIconMode.value, // for mode-specific styling
    { hovering: isHovering.value } // for hover styling (colors)
  ];
});

// Disabled state - disable when no cDiv is selected
const isDisabled = computed(() => {
  return selectedJobNumber.value === null;
});

// Tooltip text
const tooltipText = computed(() => {
  if (isDisabled.value) {
    return 'Select a job card to enable badge controls';
  }
  return badgeManager.getTooltipText(isHovering.value);
});

// --- Component Methods ---
function toggleBadges(event) {
  event.stopPropagation();
  
  // Don't toggle if disabled
  if (isDisabled.value) {
    return;
  }
  
  badgeManager.toggleMode('BadgeToggle');
  // Mark that we just clicked (don't reset hover state yet)
  hasJustClicked.value = true;
  
  // Force a small delay to ensure the mode change has been processed
  setTimeout(() => {
    // This setTimeout ensures the DOM and computeds have updated
    // The isHovering state remains true, so we'll show the next mode of the NEW current mode
  }, 0);
}
</script>

<template>
  <button 
    id="badge-toggle" 
    class="toggle-circle"
    :class="buttonClasses"
    :disabled="isDisabled"
    @click.stop="toggleBadges" 
    @mouseenter="isHovering = true; hasJustClicked = false"
    @mouseleave="isHovering = false; hasJustClicked = false"
    :title="tooltipText">{{ displayIcon }}</button>
</template>

<style scoped>
#badge-toggle {
  font-size: 10px;
  font-weight: 100;
}

/* Hover state: next mode with black icon on white background */
#badge-toggle.hovering {
  background-color: white;
  color: black;
  border-color: black;
}

/* Additional visual feedback for active modes */
#badge-toggle.badges-only {
  background-color: rgba(0, 120, 0, 0.8); /* Green tint when badges showing */
}

#badge-toggle.badges-with-stats {
  background-color: rgba(0, 100, 200, 0.8); /* Blue tint when stats showing */
}

/* Maintain hover effect precedence */
#badge-toggle.hovering {
  background-color: white !important;
}

/* Disabled state styling */
#badge-toggle:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background-color: #666 !important;
  color: #999 !important;
}
</style>