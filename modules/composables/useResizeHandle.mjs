import { ref, computed, nextTick, getCurrentInstance } from 'vue';
import { BaseComponent } from '@/modules/core/abstracts/BaseComponent.mjs';
import { useLayoutToggle } from './useLayoutToggle.mjs';
import { AppState, saveState } from '@/modules/core/stateManager.mjs';
import { performanceMonitor } from '@/modules/utils/performanceMonitor.mjs';
import { errorBoundary } from '@/modules/core/errorBoundary.mjs';

const HANDLE_WIDTH = 20;
const DEFAULT_WIDTH_PERCENT = 50;

// --- ResizeHandle Manager Component (IM-managed) ---
export class ResizeHandleManager extends BaseComponent {
  constructor() {
    super('ResizeHandleManager');
    this._resizeTimeoutId = null;
    
    // Reactive state
    this.uiPercentage = ref(DEFAULT_WIDTH_PERCENT);
    this.sceneWidthInPixels = ref(0);
    this.isDragging = ref(false);
    this.stepCount = ref(1);
  }

  getDependencies() {
    return []; // ResizeHandle is a foundation component - ViewportManager depends on it
  }

  initialize(dependencies = {}) {
    // ResizeHandle doesn't depend on ViewportManager - ViewportManager depends on ResizeHandle
    
    // Initialize state from AppState
    this.initializeState();
    
    // Listen for app state loaded event to update from saved state
    window.addEventListener('app-state-loaded', () => {
      console.log('[ResizeHandleManager] App state loaded, re-initializing from saved state');
      this.initializeState();
    });
    
    // Add debounced window resize listener
    window.addEventListener('resize', this.debouncedResizeHandler.bind(this));
    
    // Add drag event listeners
    this.setupDragHandlers();
  }
  
  setupDragHandlers() {
    // Get layout orientation
    const { orientation } = useLayoutToggle();
    
    // Mouse move handler for dragging
    const handleMouseMove = (event) => {
      if (this.isDragging.value) {
        const windowWidth = window.innerWidth;
        
        // For scene-right layout, mirror the mouse position horizontally
        let effectiveClientX = event.clientX;
        if (orientation.value === 'scene-right') {
          effectiveClientX = windowWidth - event.clientX;
        }
        
        const newSceneWidth = Math.max(0, Math.min(windowWidth, effectiveClientX)); // Allow full 0% to 100% range
        const newPercentage = (newSceneWidth / windowWidth) * 100;
        
        this.uiPercentage.value = newPercentage;
        this.updateLayout(newPercentage);
        
        console.log(`[ResizeHandleManager] Dragging (${orientation.value}) - mouse X: ${event.clientX}, effective X: ${effectiveClientX}, scene width: ${newSceneWidth}px, percentage: ${newPercentage.toFixed(1)}%`);
      }
    };
    
    // Mouse up handler to end dragging
    const handleMouseUp = (event) => {
      if (this.isDragging.value) {
        this.isDragging.value = false;
        console.log('[ResizeHandleManager] Drag ended');
        
        // Save state when drag ends
        this.updateLayout(this.uiPercentage.value, true); // shouldSave = true
      }
    };
    
    // Add global event listeners
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    // Store for cleanup
    this.handleMouseMove = handleMouseMove;
    this.handleMouseUp = handleMouseUp;
  }

  initializeState() {
    // Convert stored true scene percentage back to internal percentage
    const storedScenePercentage = AppState?.layout?.scenePercentage;
    let initialPercentage = DEFAULT_WIDTH_PERCENT;
    
    if (storedScenePercentage) {
      const windowWidth = window.innerWidth;
      const resumeContainerWidth = 20;
      const maxSceneWidth = windowWidth - resumeContainerWidth;
      const storedSceneWidth = (storedScenePercentage / 100) * windowWidth;
      initialPercentage = (storedSceneWidth / maxSceneWidth) * 100;
    }
    this.stepCount.value = AppState?.resizeHandle?.stepCount || 1;
    console.log('[ResizeHandleManager] DEBUG: AppState.resizeHandle:', AppState?.resizeHandle);
    console.log('[ResizeHandleManager] DEBUG: stepCount loaded:', this.stepCount.value);
    
    // Don't snap initial percentage - keep the actual stored value
    console.log('[ResizeHandleManager] Initialization - keeping actual percentage:', initialPercentage);
    
    this.uiPercentage.value = initialPercentage;
  }

  clampToRange(val, min, max) {
    return Math.max(min, Math.min(max, val));
  }

  handleViewportResize() {
    // With the new IM dependency chain, components should handle their own updates:
    // - BullsEye listens for 'viewport-resize' events and recenters itself
    // - AimPoint automatically syncs with BullsEye via bulls-eye-moved events  
    // - FocalPoint automatically syncs with AimPoint via interval polling
    // ResizeHandleManager should NOT directly manipulate these components
    
    console.log('[ResizeHandleManager] Viewport resize handled - letting IM dependency chain handle updates');
  }

  updateLayout(newUiPercentage, shouldSave = true, isStepOperation = false) {
    console.log('[ResizeHandleManager] updateLayout() called with:', newUiPercentage);
    
    // Performance monitoring
    const perfId = performanceMonitor.startTiming('resize_layout');
    
    try {
        const windowWidth = window.innerWidth;
        const resumeContainerWidth = 20;
        const maxSceneWidth = windowWidth - resumeContainerWidth;
        
        console.log('[ResizeHandleManager] Window width:', windowWidth, 'Max scene width:', maxSceneWidth);
        
        let actualPercentage = this.clampToRange(newUiPercentage, 0, 100);
        let finalSceneWidth = Math.floor((actualPercentage / 100) * maxSceneWidth);
        
        console.log('[ResizeHandleManager] Actual percentage:', actualPercentage, 'Final scene width:', finalSceneWidth);
        
        // Capture old width BEFORE updating
        const oldSceneWidth = this.sceneWidthInPixels.value;
        console.log('[ResizeHandleManager] OLD sceneWidthInPixels:', oldSceneWidth);
        
        // Store the values
        this.sceneWidthInPixels.value = finalSceneWidth;
        
        // Only snap during drag operations, not during step operations or initialization
        if (this.stepCount.value > 1 && shouldSave && !isStepOperation) {
            // Only snap when shouldSave=true AND not a step operation (during drag)
            const increment = 100 / this.stepCount.value;
            const nearestStep = Math.round(actualPercentage / increment);
            this.uiPercentage.value = nearestStep * increment;
            console.log('[ResizeHandleManager] Snapped uiPercentage to step:', this.uiPercentage.value, '(was', actualPercentage, ')');
        } else if (!isStepOperation) {
            this.uiPercentage.value = actualPercentage;
        }
        // For step operations, uiPercentage is already set correctly, don't modify it
        
        // Only dispatch event and save if scene width actually changed
        if (finalSceneWidth !== oldSceneWidth) {
            console.log('[ResizeHandleManager] Scene width changed:', oldSceneWidth, '->', finalSceneWidth);
            
            // Dispatch event so other components can react to resize handle changes
            window.dispatchEvent(new CustomEvent('resize-handle-changed', {
                detail: { sceneWidth: finalSceneWidth }
            }));
            
            // Also dispatch scene-width-changed for AppContent CSS reactivity
            window.dispatchEvent(new CustomEvent('scene-width-changed', {
                detail: { width: finalSceneWidth }
            }));
        }
        // Skip logging when no change detected
        
        if (AppState?.layout && (finalSceneWidth !== oldSceneWidth || shouldSave)) {
            if (isStepOperation) {
                // For step operations, save the clean percentage values directly
                console.log('[ResizeHandleManager] Step operation - saving clean percentages:', this.uiPercentage.value);
                AppState.layout.scenePercentage = this.uiPercentage.value;
                AppState.layout.resumePercentage = 100 - this.uiPercentage.value;
            } else {
                // Calculate true percentages of total window width for drag operations
                const trueScenePercentage = (finalSceneWidth / windowWidth) * 100;
                const trueResumePercentage = ((windowWidth - finalSceneWidth) / windowWidth) * 100;
                
                console.log('[ResizeHandleManager] Drag operation - calculating from pixels:', trueScenePercentage, 'resume:', trueResumePercentage);
                
                AppState.layout.scenePercentage = trueScenePercentage;
                AppState.layout.resumePercentage = trueResumePercentage;
            }
            
            if (shouldSave && finalSceneWidth !== oldSceneWidth) {
                console.log('[ResizeHandleManager] Saving state for scene width change');
                saveState(AppState);
            }
            // Skip logging when no save needed
        }
        
        // Log completion - no logAndReset method exists
    } catch (error) {
        console.error('ResizeHandle updateLayout error:', error);
    } finally {
        performanceMonitor.endTiming(perfId);
    }
  }

  debouncedResizeHandler() {
    if (this._resizeTimeoutId) {
        clearTimeout(this._resizeTimeoutId);
    }
    this._resizeTimeoutId = setTimeout(() => {
        this.handleViewportResize();
        this._resizeTimeoutId = null;
    }, 100);
  }

  // Stepping functionality
  async collapseLeft() {
    console.log('[ResizeHandleManager] collapseLeft() called');
    console.log('[ResizeHandleManager] Current uiPercentage:', this.uiPercentage.value);
    console.log('[ResizeHandleManager] Step count:', this.stepCount.value);
    
    let newPercentage;
    if (this.stepCount.value === 1) {
        newPercentage = 0;
    } else {
        // Clean integer math - force values to be exact multiples
        const increment = 100 / this.stepCount.value; // e.g., 20 for 5 steps
        const currentBlock = Math.ceil(this.uiPercentage.value / increment);
        newPercentage = Math.max(0, currentBlock - 1) * increment;
        
        // Ensure result is clean integer (no float contamination)
        newPercentage = Math.round(newPercentage);
        
        console.log('[ResizeHandleManager] collapseLeft - increment:', increment, 'currentBlock:', currentBlock);
        console.log('[ResizeHandleManager] collapseLeft - from', this.uiPercentage.value, '-> newPercentage:', newPercentage);
    }
    
    console.log('[ResizeHandleManager] Updating layout to:', newPercentage);
    // Force the exact percentage without any snapping or processing
    this.uiPercentage.value = newPercentage;
    this.updateLayout(newPercentage, true, true); // shouldSave=true, isStepOperation=true
    await nextTick();
    // Note: ViewportManager should listen for resize events, not called directly
  }

  async collapseRight() {
    console.log('[ResizeHandleManager] collapseRight() called');
    console.log('[ResizeHandleManager] Current uiPercentage:', this.uiPercentage.value);
    console.log('[ResizeHandleManager] Step count:', this.stepCount.value);
    
    let newPercentage;
    if (this.stepCount.value === 1) {
        newPercentage = 100;
    } else {
        // Clean integer math - force values to be exact multiples
        const increment = 100 / this.stepCount.value; // e.g., 20 for 5 steps
        const currentBlock = Math.floor(this.uiPercentage.value / increment);
        newPercentage = Math.min(100, currentBlock + 1) * increment;
        
        // Ensure result is clean integer (no float contamination)
        newPercentage = Math.round(newPercentage);
        
        console.log('[ResizeHandleManager] collapseRight - increment:', increment, 'currentBlock:', currentBlock);
        console.log('[ResizeHandleManager] collapseRight - from', this.uiPercentage.value, '-> newPercentage:', newPercentage);
    }
    
    console.log('[ResizeHandleManager] Updating layout to:', newPercentage);
    // Force the exact percentage without any snapping or processing
    this.uiPercentage.value = newPercentage;
    this.updateLayout(newPercentage, true, true); // shouldSave=true, isStepOperation=true
    await nextTick();
    // Note: ViewportManager should listen for resize events, not called directly
  }

  applyInitialLayout() {
    this.updateLayout(this.uiPercentage.value, false);
  }

  destroy() {
    if (this._resizeTimeoutId) {
        clearTimeout(this._resizeTimeoutId);
        this._resizeTimeoutId = null;
    }
    window.removeEventListener('resize', this.debouncedResizeHandler.bind(this));
    
    // Clean up drag event listeners
    if (this.handleMouseMove) {
      document.removeEventListener('mousemove', this.handleMouseMove);
    }
    if (this.handleMouseUp) {
      document.removeEventListener('mouseup', this.handleMouseUp);
    }
  }
}

// Create singleton instance
export const resizeHandleManager = new ResizeHandleManager();

// --- Composable Wrapper (for Vue components) ---
let _instance = null;

export function useResizeHandle() {
  // Singleton check
  if (_instance) {
    return _instance;
  }

  // Get layout orientation
  const { orientation } = useLayoutToggle();

  // Create computed properties that reference the IM-managed state
  const uiPercentage = computed(() => resizeHandleManager.uiPercentage?.value || DEFAULT_WIDTH_PERCENT);
  const sceneWidthInPixels = computed(() => resizeHandleManager.sceneWidthInPixels?.value || 0);
  const isDragging = computed(() => resizeHandleManager.isDragging?.value || false);
  const stepCount = computed(() => resizeHandleManager.stepCount?.value || 1);

  const scenePercentage = computed(() => {
    // Calculate percentage based on available space (windowWidth - 20px resize handle)
    const windowWidth = window.innerWidth;
    const availableWidth = windowWidth - 20; // Subtract resize handle width
    const sceneWidth = sceneWidthInPixels.value;
    return availableWidth > 0 ? (sceneWidth / availableWidth) * 100 : 50;
  });

  const resumePercentage = computed(() => {
    return 100 - scenePercentage.value;
  });

  const handleStyle = computed(() => ({
    left: `${sceneWidthInPixels.value}px`,
    width: `${HANDLE_WIDTH}px`,
    zIndex: 1000
  }));

  // Computed properties for collapse states
  const isLeftCollapsed = computed(() => {
    return uiPercentage.value <= 5; // Consider collapsed if less than 5%
  });

  const isRightCollapsed = computed(() => {
    return uiPercentage.value >= 95; // Consider collapsed if greater than 95%
  });

  // Legacy compatibility aliases
  const percentage = computed(() => scenePercentage.value);

  // Wrapper functions that delegate to the IM-managed instance
  function updateLayoutFromPercentage(newPercentage) {
    return resizeHandleManager.updateLayout(newPercentage);
  }

  function applyInitialLayout() {
    return resizeHandleManager.applyInitialLayout();
  }

  function collapseLeft() {
    return resizeHandleManager.collapseLeft();
  }

  function collapseRight() {
    return resizeHandleManager.collapseRight();
  }

  function startDrag(event) {
    if (resizeHandleManager) {
      resizeHandleManager.isDragging.value = true;
      console.log('[ResizeHandleManager] Drag started');
      event.preventDefault(); // Prevent text selection while dragging
    }
  }

  function toggleStepping() {
    // This function is no longer needed since stepping is controlled by stepCount
    console.warn('[ResizeHandle] toggleStepping() is deprecated - use stepCount cycling instead');
  }

  // Legacy compatibility method (will be removed after migration)
  function initializeResizeHandleState(viewport = null, bullsEyeInstance = null) {
    console.warn('[ResizeHandle] initializeResizeHandleState is deprecated - ResizeHandleManager handles initialization via IM');
    // No-op - IM handles initialization
  }

  // Create the instance
  const resizeHandleInstance = {
    // Reactive state
    uiPercentage,
    sceneWidthInPixels,
    isDragging,
    stepCount,
    scenePercentage,
    resumePercentage,
    handleStyle,
    orientation,
    isLeftCollapsed,
    isRightCollapsed,
    percentage, // Legacy alias for scenePercentage
    
    // Methods
    updateLayoutFromPercentage,
    applyInitialLayout,
    collapseLeft,
    collapseRight,
    startDrag,
    toggleStepping,
    initializeResizeHandleState // Legacy compatibility
  };

  _instance = resizeHandleInstance;
  return resizeHandleInstance;
}