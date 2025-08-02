<template>
  <button 
    id="badge-toggle" 
    class="toggle-circle"
    :class="{ 'show-badges': isBadgesVisible, 'hide-badges': !isBadgesVisible, 'hovering': isHovering }"
    @click.stop="handleToggle"
    @mouseenter="isHovering = true"
    @mouseleave="isHovering = false">
    <span class="icon-sign">{{ displayIcon }}</span><span class="icon-letter">B</span>
  </button>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useBadgeToggle } from '@/modules/composables/useBadgeToggle.mjs'

const { isBadgesVisible, toggleBadges } = useBadgeToggle()
const isHovering = ref(false)

// Show next state on hover, current state normally
const displayIcon = computed(() => {
  if (isHovering.value) {
    // On hover: show what will happen if you click (opposite of current state)
    return isBadgesVisible.value ? '-' : '+'
  } else {
    // Normal: show current state
    return isBadgesVisible.value ? '+' : '-'
  }
})

const handleToggle = () => {
  const newState = toggleBadges()
  console.log(`[BadgeToggle] Button clicked - badges now ${newState ? 'visible' : 'hidden'}`)
}
</script>

<style scoped>
#badge-toggle {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid white;
  background-color: var(--button-bg-color, #555);
  color: var(--button-text-color, white);
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 10px;
  font-weight: bold;
  padding: 0;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

/* Hover state: inverted colors like other toggle buttons */
#badge-toggle.hovering {
  background-color: white;
  color: black;
  border-color: black;
}

.icon-sign {
  margin-right: 1px;
}

.icon-letter {
  margin-left: 0;
}
</style>