<template>
  <div class="color-palette-selector" v-if="isVisible">
    <div class="palette-dropdown">
      <button class="palette-toggle" @click="toggleDropdown" :title="currentPaletteName">
        🎨
      </button>
      <div v-if="isDropdownOpen" class="palette-list">
        <div 
          v-for="paletteName in orderedPaletteNames" 
          :key="paletteName"
          class="palette-option"
          :class="{ active: paletteName === currentPaletteName }"
          @click="selectPalette(paletteName)"
        >
          <div class="palette-preview">
            <div 
              v-for="(color, index) in getPalettePreview(paletteName)" 
              :key="index"
              class="color-swatch"
              :style="{ backgroundColor: color }"
            ></div>
          </div>
          <span class="palette-name">{{ paletteName }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useColorPalette } from '../composables/useColorPalette.mjs'

// Use color palette composable
const { 
  colorPalettes, 
  orderedPaletteNames, 
  currentPaletteName,
  setCurrentPalette,
  loadPalettes 
} = useColorPalette()

// Local state
const isDropdownOpen = ref(false)
const isVisible = ref(false)

// Show selector after palettes are loaded
const showSelector = computed(() => {
  return orderedPaletteNames.value.length > 0
})

// Methods
const toggleDropdown = () => {
  isDropdownOpen.value = !isDropdownOpen.value
}

const selectPalette = (paletteName) => {
  setCurrentPalette(paletteName)
  isDropdownOpen.value = false
}

const getPalettePreview = (paletteName) => {
  const palette = colorPalettes.value[paletteName]
  if (!palette) return []
  
  // Return first 4 colors from palette for preview
  const colors = []
  if (palette.backgroundColor) colors.push(palette.backgroundColor)
  if (palette.foregroundColor) colors.push(palette.foregroundColor)
  if (palette.accentColor) colors.push(palette.accentColor)
  if (palette.borderColor) colors.push(palette.borderColor)
  
  return colors.slice(0, 4)
}

// Close dropdown when clicking outside
const handleClickOutside = (event) => {
  if (!event.target.closest('.color-palette-selector')) {
    isDropdownOpen.value = false
  }
}

// Lifecycle
onMounted(async () => {
  try {
    await loadPalettes()
    isVisible.value = true
    document.addEventListener('click', handleClickOutside)
  } catch (error) {
    console.error('[ColorPaletteSelector] Failed to load palettes:', error)
  }
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.color-palette-selector {
  position: relative;
  z-index: 1000;
}

.palette-dropdown {
  position: relative;
}

.palette-toggle {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid white;
  background-color: var(--button-bg-color, #555);
  color: white;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 14px;
  transition: all 0.2s ease;
}

.palette-toggle:hover {
  background-color: white;
  color: black;
  border-color: black;
}

.palette-list {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.9);
  border: 1px solid #555;
  border-radius: 8px;
  min-width: 200px;
  max-height: 300px;
  overflow-y: auto;
  margin-top: 4px;
  backdrop-filter: blur(10px);
}

.palette-option {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.palette-option:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.palette-option.active {
  background-color: rgba(255, 255, 255, 0.2);
}

.palette-preview {
  display: flex;
  margin-right: 8px;
  border-radius: 4px;
  overflow: hidden;
}

.color-swatch {
  width: 12px;
  height: 12px;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.palette-name {
  color: white;
  font-size: 12px;
  white-space: nowrap;
}
</style>