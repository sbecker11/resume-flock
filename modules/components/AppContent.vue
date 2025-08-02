<template>
  <div id="app-container" :class="appContainerClass">
    <!-- Scene Container -->
    <SceneContainer 
      :sceneContainerStyle="sceneContainerStyle"
      :firstContainer="firstContainer"
      :secondContainer="secondContainer" 
      :scenePercentage="scenePercentage"
      :timelineAlignment="timelineAlignment"
      ref="sceneContainerRef"
    />
    
    <!-- ResizeHandle - positioned between containers -->
    <ResizeHandle />
    
    <!-- Resume Container -->
    <div 
      id="resume-container"
      :class="{ 'container-first': firstContainer === 'resume-container', 'container-second': secondContainer === 'resume-container' }"
    >
      <div class="resume-content">
        <div class="resume-wrapper">
          <ResumeContainer />
        </div>
      </div>
      <!-- Resume Viewer Label - positioned inside resume container like Scene Viewer -->
      <div id="resume-view-label">
        <span class="viewer-label">Resume Viewer ({{ roundedResumePercentage }}%)</span>
      </div>
    </div>

    <div id="bulls-eye" ref="bullsEyeRef">+</div>
    <div 
      id="focal-point" 
      ref="focalPointRef"
      :style="focalPointIsDragging ? {} : focalPointStyle" 
      :class="{ locked: focalPointIsLocked, dragging: focalPointIsDragging }"
    >⦻</div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'

// Vue components
import SceneContainer from './SceneContainer.vue'
import ResizeHandle from './ResizeHandle.vue'
import ResumeContainer from './ResumeContainer.vue'

// Vue 3 architecture - pure Vue patterns with critical systems preserved
import { useAppContext } from '../composables/useAppContext.mjs'
import { useAppStore } from '../stores/appStore.mjs'
import { useFocalPoint } from '../composables/useFocalPointVue3.mjs'
import { useBullsEye } from '../composables/useBullsEyeVue3.mjs'
import { useParallax } from '../composables/useParallaxVue3.mjs'
import { useColorPalette } from '../composables/useColorPalette.mjs'
import { useLayoutToggle } from '../composables/useLayoutToggle.mjs'
import { useResizeHandle } from '../composables/useResizeHandle.mjs'
import { useAppState } from '../composables/useAppState.ts'

// Resume system initialization (to be migrated)
import { initializeResumeSystem, testResumeSystem, checkResumeDivs, testScrolling } from '../resume/resumeSystemInitializer.mjs'

// Core functionality imports (minimal during migration)
import { handleKeyDown } from '../core/keyDownModule.mjs'

// =============================================================================
// VUE 3 ARCHITECTURE - Dependency injection and stores
// =============================================================================

// Use app-wide context provided by App.vue
const { registerDependency, getDependency } = useAppContext()

// Use centralized app store
const { store, computed: storeComputed, actions: storeActions } = useAppStore()

// Layout management from store
const orientation = computed({
  get: () => store.orientation,
  set: (value) => storeActions.setOrientation(value)
})
const scenePercentage = computed({
  get: () => store.scenePercentage,
  set: (value) => storeActions.setScenePercentage(value)
})
const resumePercentage = storeComputed.resumePercentage
const appContainerClass = computed(() => store.orientation)
const firstContainer = computed(() => store.orientation === 'scene-left' ? 'scene-container' : 'resume-container')
const secondContainer = computed(() => store.orientation === 'scene-left' ? 'resume-container' : 'scene-container')

// Resize handle functionality
const { sceneContainerStyle } = useResizeHandle()

// Color palette management
const { loadPalettes } = useColorPalette()

// Vue 3 critical systems - all preserved
const { 
  position: focalPointPosition,
  mode: focalPointMode,
  isLocked: focalPointIsLocked,
  isDragging: focalPointIsDragging,
  setFocalPointElement
} = useFocalPoint()

// Vue 3 bulls-eye system
const {
  setBullsEyeElement,
  setSceneContainerElement
} = useBullsEye()

// Vue 3 parallax system
const {
  renderAllCDivs
} = useParallax()

// Computed properties from store
const focalPointX = computed(() => store.focalPoint.x)
const focalPointY = computed(() => store.focalPoint.y)

// App-level focal point and aim point (positioned relative to entire app)

// =============================================================================
// COMPUTED PROPERTIES
// =============================================================================

// Create dynamic focal point style from position
const focalPointStyle = computed(() => ({
  left: `${focalPointX.value}px`,
  top: `${focalPointY.value}px`,
  transform: 'translate(-50%, -50%)',
  position: 'fixed',
  visibility: (focalPointX.value > 0 && focalPointY.value > 0) ? 'visible' : 'hidden'
}))

// =============================================================================
// TEMPLATE REFS - App-level elements
// =============================================================================

// Template refs with reactive watchers
const sceneContainerRef = ref(null)  // Reference to SceneContainer component
const bullsEyeRef = ref(null)
const focalPointRef = ref(null)

// Make template refs reactive - watch for changes and update systems
watch(focalPointRef, (newRef) => {
  if (newRef) {
    setFocalPointElement(newRef)
  }
}, { immediate: true })

watch(bullsEyeRef, (newRef) => {
  if (newRef) {
    setBullsEyeElement(newRef)
  }
}, { immediate: true })

watch(sceneContainerRef, (newRef) => {
  if (newRef) {
    const sceneContainerElement = newRef?.$refs?.sceneContainerRef
    if (sceneContainerElement) {
      setSceneContainerElement(sceneContainerElement)
    }
  }
}, { immediate: true })

// =============================================================================
// COMPUTED PROPERTIES
// =============================================================================

const timelineAlignment = computed(() => {
  return orientation.value === 'scene-left' ? 'right' : 'left'
})

// Use the reactive store values and map them to display 0-100% range
const roundedScenePercentage = computed(() => {
  const rawPercentage = scenePercentage.value;
  
  // Debug logging for percentage mapping
  if (rawPercentage <= 10 || rawPercentage >= 90) {
    console.log(`[Scene %] Raw: ${rawPercentage}% -> Mapped: ${rawPercentage <= 10 ? 0 : 100}%`);
  }
  
  if (rawPercentage <= 10) return 0;
  if (rawPercentage >= 90) return 100;
  
  const mapped = ((rawPercentage - 5) / 90) * 100;
  const result = Math.round(Math.max(0, Math.min(100, mapped)));
  
  console.log(`[Scene %] Raw: ${rawPercentage}% -> Mapped: ${result}%`);
  return result;
});

const roundedResumePercentage = computed(() => {
  return 100 - roundedScenePercentage.value;
});

// =============================================================================
// EVENT HANDLERS
// =============================================================================

const handleSceneContainerClick = (event) => {
  // Handle scene container clicks
  console.log('Scene container clicked:', event)
}

// =============================================================================
// LIFECYCLE - Vue's standard pattern
// =============================================================================

onMounted(async () => {
  console.log('🚀 [AppContent] Vue 3 App Initialization Started')
  
  try {
    // PHASE 1: Load AppState from server FIRST
    console.log('[AppContent] 📊 Loading AppState from server...')
    const { loadAppState } = useAppState()
    await loadAppState()
    console.log('[AppContent] ✅ AppState loaded successfully')
    
    // PHASE 2: Initialize app store
    console.log('[AppContent] 📊 Initializing app store...')
    storeActions.initialize()
    
    // Wait for DOM to be ready
    await nextTick()
    
    // PHASE 3: Initialize color palette system (now AppState is available)
    console.log('[AppContent] 🎨 Loading color palettes...')
    try {
      await loadPalettes()
      console.log('[AppContent] ✅ Color palettes loaded successfully')
    } catch (error) {
      console.error('[AppContent] ❌ Color palette loading failed:', error)
    }
    
    // PHASE 4: Critical positioning systems now handled by reactive watchers
    console.log('[AppContent] 🎯 Critical positioning systems handled by reactive watchers')
    
    // PHASE 5: Resume system (legacy during migration)
    console.log('[AppContent] 📋 Initializing resume system...')
    await initializeResumeSystem()
    
    // Make debugging functions available
    window.testResumeSystem = testResumeSystem
    window.checkResumeDivs = checkResumeDivs
    window.testScrolling = testScrolling
    
    // PHASE 6: Global event handlers
    document.addEventListener('keydown', handleKeyDown)
    
    console.log('[AppContent] ✅ Vue 3 app initialization complete!')
    
  } catch (error) {
    console.error('[AppContent] ❌ App initialization failed:', error)
  }
})

onUnmounted(() => {
  console.log('[AppContent] 🧹 Cleaning up...')
  
  // Remove event listeners
  document.removeEventListener('keydown', handleKeyDown)
  
  // Cleanup systems - TODO: replace with Vue composable cleanup
  // parallaxModule.destroy?.()
  // sceneContainer.destroy?.()
  
  console.log('[AppContent] ✅ Cleanup complete')
})

// =============================================================================
// REACTIVE UPDATES - Vue's native reactivity
// =============================================================================

// Watch for layout changes via store
watch(orientation, (newOrientation) => {
  // Layout change handling without excessive logging
}, { immediate: true })

</script>

<style scoped>
/* =============================================================================
   LAYOUT STYLES - Scoped to this component
   ============================================================================= */

#app-container {
  display: flex !important;
  height: 100vh;
  width: 100vw;
  overflow: visible;
  position: relative;
}

/* =============================================================================
   APP CONTAINER LAYOUT VARIATIONS
   ============================================================================= */

/* Common app-container styling regardless of orientation */
#app-container {
  flex-direction: row !important;
  /* Both scene-left and scene-right use same flex direction */
}

/* Orientation-specific container ordering is handled by individual components */

/* Debug borders removed per user request */

/* Debug background gradients also removed */

/* Scene-specific styles moved to SceneContainer.vue */

/* =============================================================================
   RESUME CONTAINER STYLES
   ============================================================================= */

#resume-container {
  display: flex;
  flex: 1;
  background: #f8f9fa;
  position: relative;
}

#resume-container {
  flex: 1;
}

#resume-container.container-first {
  order: 1 !important;
}

#resume-container.container-second {
  order: 3 !important;
}

/* ResizeHandle always stays in the middle */
.resize-handle {
  order: 2 !important;
}

.resume-content {
  flex: 1;
  overflow: hidden;
}

.resume-wrapper {
  height: 100%;
  position: relative;
}

/* =============================================================================
   CONTROL ELEMENTS STYLES
   ============================================================================= */


#bulls-eye {
  position: absolute;
  font-size: 20px;
  color: rgba(0, 255, 255, 0.8);
  pointer-events: none;
  z-index: var(--z-bulls-eye, 98);
  transform: translate(-50%, -50%);
  user-select: none;
}


#focal-point {
  position: absolute;
  font-size: 24px;
  color: #fff;
  cursor: pointer;
  z-index: var(--z-focal-point, 100);
  transform: translate(-50%, -50%);
  user-select: none;
  transition: all 0.2s ease;
}

#focal-point.locked {
  color: #00ff00;
}

#focal-point.dragging {
  color: #ff6600;
  transform: translate(-50%, -50%) scale(1.2);
}

/* =============================================================================
   VIEWER LABELS
   ============================================================================= */


.viewer-label-div {
  top: 461px;
  position: absolute;
  bottom: 9px;
  background: transparent;
  padding: 6px 10px;
  font-family: sans-serif;
  font-size: 14px;
  font-weight: 600;
  pointer-events: none;
  z-index: 1000;
}

/* =============================================================================
   VIEWER LABEL CONSOLIDATED STYLING
   ============================================================================= */

/* Common base styling for all viewer labels */
.viewer-label,
.resume-viewer-label,
.scene-viewer-label {
  font-family: sans-serif;
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
  pointer-events: none;
  user-select: none;
}

/* Resume viewer label (dark text with white drop shadow for light backgrounds) */
.resume-viewer-label,
.viewer-label.resume-viewer-label {
  color: black !important;
  text-shadow: 2px 2px 4px rgba(255, 255, 255, 0.9);
}

/* Scene viewer label (light text with dark shadow for dark backgrounds) */
.scene-viewer-label,
.viewer-label.scene-viewer-label {
  color: white !important;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.7);
}

/* Resume viewer label positioning - matches Scene viewer exactly */
#resume-view-label {
  position: absolute;
  bottom: 5px;
  background: transparent;
  padding: 6px 10px;
  border-radius: 6px;
  font-family: sans-serif;
  font-size: 14px;
  font-weight: 600;
  pointer-events: none;
  z-index: 1000;
  color: black;
  text-shadow: 2px 2px 4px rgba(255, 255, 255, 0.9);
}

/* Position mirrored based on layout - opposite sides */
.container-first #resume-view-label {
  right: 10px; /* Resume on left, label on right side */
}

.container-second #resume-view-label {
  left: 10px; /* Resume on right, label on left side */
}

/* =============================================================================
   RESPONSIVE DESIGN
   ============================================================================= */

@media (max-width: 768px) {
  #app-container {
    flex-direction: column;
  }
  
  #scene-container,
  #resume-container {
    min-height: 50vh;
  }
  
  #scene-view-label,
  #resume-view-label {
    font-size: 10px;
    padding: 2px 6px;
  }
}

/* =============================================================================
   ACCESSIBILITY
   ============================================================================= */

@media (prefers-reduced-motion: reduce) {
  #focal-point,
  #scene-plane-top-gradient,
  #scene-plane-btm-gradient {
    transition: none;
  }
}

/* =============================================================================
   HIGH CONTRAST MODE
   ============================================================================= */

@media (prefers-contrast: high) {
  #scene-container {
    border-right-color: #fff;
  }
  
  #scene-container.container-second {
    border-left-color: #fff;
  }
  
  
  #bulls-eye {
    color: #00ffff;
  }
}
</style>