import { ref, computed, onMounted, onUnmounted, watchEffect, getCurrentInstance } from 'vue';
import { useLayoutToggle } from './useLayoutToggle.mjs';
import { BaseComponent } from '@/modules/core/abstracts/BaseComponent.mjs';

// --- Viewport Manager Component (IM-managed) ---
// Vue reactive wrapper around ViewportCore
export class ViewportManager extends BaseComponent {
  constructor() {
    super('ViewportManager');
    this.viewportCore = null;
    
    // Reactive state - wraps ViewportCore data
    this.viewportState = ref({
      padding: 100,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      centerX: 0,
      centerY: 0,
      width: 0,
      height: 0
    });
  }

  getDependencies() {
    return ['ViewportCore']; // Depends on ViewportCore for DOM operations
  }

  initialize(dependencies) {
    this.viewportCore = dependencies.ViewportCore;
    
    // Initial sync from core data
    this.syncFromCore();
    
    // Listen for viewport updates from core
    window.addEventListener('viewport-resize', (event) => {
      this.syncFromCore();
    });
    
    console.log('[ViewportManager] Initialized with ViewportCore dependency - reactive wrapper ready');
  }

  /**
   * Sync reactive state from ViewportCore data
   * Called when ViewportCore updates its calculations
   */
  syncFromCore() {
    if (!this.viewportCore) return;
    
    const coreProperties = this.viewportCore.getViewportProperties();
    
    // Update reactive state with core data
    this.viewportState.value = {
      padding: coreProperties.padding,
      top: coreProperties.top - coreProperties.padding,
      left: coreProperties.left - coreProperties.padding,
      right: coreProperties.width + 2 * coreProperties.padding,
      bottom: coreProperties.height + 2 * coreProperties.padding,
      centerX: coreProperties.centerX,
      centerY: coreProperties.centerY,
      width: coreProperties.width,
      height: coreProperties.height
    };

    // Dispatch backward compatibility event
    const event = new CustomEvent('viewport-changed', {
      detail: {
        centerX: this.viewportState.value.centerX,
        centerY: this.viewportState.value.centerY,
        width: this.viewportState.value.width,
        height: this.viewportState.value.height
      }
    });
    window.dispatchEvent(event);
  }

  /**
   * Backward compatibility method - delegates to ViewportCore
   * @deprecated Use ViewportCore.updateViewportProperties() directly for DOM operations
   */
  updateViewportProperties() {
    if (this.viewportCore) {
      this.viewportCore.updateViewportProperties();
    }
  }

  setViewPortWidth(newWidth) {
    if (typeof newWidth !== 'number') {
      throw new Error(`Viewport.setViewPortWidth: ${newWidth} is not a Number`);
    }

    window.CONSOLE_LOG_IGNORE(`RESIZE: setViewPortWidth: ${newWidth}`);
    
    // Update the entire reactive state object to trigger reactivity
    this.viewportState.value = {
      ...this.viewportState.value,
      width: newWidth,
      right: newWidth + 2 * this.viewportState.value.padding
    };

    // Dispatch viewport-changed event
    window.dispatchEvent(new CustomEvent('viewport-changed', {
      detail: {
        centerX: this.viewportState.value.centerX,
        centerY: this.viewportState.value.centerY,
        width: newWidth,
        height: this.viewportState.value.height
      }
    }));
  }

  getVisualRect() {
    // Delegate to ViewportCore for DOM operations
    if (!this.viewportCore) {
      return { top: 0, left: 0, bottom: 0, right: 0, width: 0, height: 0 };
    }
    
    const props = this.viewportCore.getViewportProperties();
    return {
      top: props.top,
      left: props.left,
      bottom: props.bottom, 
      right: props.right,
      width: props.width,
      height: props.height
    };
  }

  getViewPortOrigin() {
    // API compatibility method for ParallaxModule
    return {
      x: this.viewportState.value.centerX,
      y: this.viewportState.value.centerY
    };
  }

  getViewPortRect() {
    // API compatibility method - returns the viewport rect
    return {
      top: this.viewportState.value.top,
      left: this.viewportState.value.left,
      right: this.viewportState.value.right,
      bottom: this.viewportState.value.bottom,
      width: this.viewportState.value.width,
      height: this.viewportState.value.height,
      centerX: this.viewportState.value.centerX,
      centerY: this.viewportState.value.centerY
    };
  }

  destroy() {
    // Remove viewport update listener
    window.removeEventListener('viewport-resize', (event) => {
      this.syncFromCore();
    });
    this.viewportCore = null;
  }
}

// Create singleton instance
export const viewportManager = new ViewportManager();

// --- Composable Wrapper (for Vue components) ---
let _instance = null;
let _instanceCount = 0;
let _instanceLabels = new Map();

export function useViewport(label = 'unnamed') {
  // Singleton check - if instance exists, return it immediately
  if (_instance) {
    return _instance;
  }

  // Check if we're inside a Vue component instance
  const instance = getCurrentInstance();
  
  // Register cleanup on component unmount (only if inside a Vue component)
  // TEMPORARILY DISABLED - causing Vue subTree error
  // if (instance) {
  //   onUnmounted(() => {
  //     cleanup();
  //   });
  // }

  // Watch for layout changes and update viewport reactively
  const layoutToggle = useLayoutToggle();
  watchEffect(() => {
    // Re-run when layout orientation changes
    const orientation = layoutToggle.orientation.value;
    window.CONSOLE_LOG_IGNORE(`[${label}] Layout orientation changed to:`, orientation);
    
    // Trigger viewport recalculation after layout change
    if (viewportManager.viewportCore) {
      setTimeout(() => {
        // Wait for CSS transitions to complete before updating viewport properties
        viewportManager.viewportCore.updateViewportProperties();
      }, 350); // Increased delay to match CSS transition duration
    }
  });

  // Create computed properties that reference the IM-managed viewport state
  const padding = computed(() => viewportManager.viewportState.value.padding);
  const top = computed(() => viewportManager.viewportState.value.top);
  const left = computed(() => viewportManager.viewportState.value.left);
  const right = computed(() => viewportManager.viewportState.value.right);
  const bottom = computed(() => viewportManager.viewportState.value.bottom);
  const centerX = computed(() => viewportManager.viewportState.value.centerX);
  const centerY = computed(() => viewportManager.viewportState.value.centerY);
  const width = computed(() => viewportManager.viewportState.value.width);
  const height = computed(() => viewportManager.viewportState.value.height);

  const visualRect = computed(() => {
    return viewportManager.getVisualRect();
  });

  // Wrapper functions that delegate to the IM-managed instance
  function initialize() {
    // This is now handled by IM - kept for backward compatibility
    window.CONSOLE_LOG_IGNORE('useViewport.initialize() called - now handled by ViewportManager via IM');
  }

  function isInitialized() {
    return viewportManager.viewportCore !== null;
  }

  function setViewPortWidth(newWidth) {
    return viewportManager.setViewPortWidth(newWidth);
  }

  function updateViewPort() {
    // Delegate to ViewportCore for actual DOM update
    if (viewportManager.viewportCore) {
      viewportManager.viewportCore.updateViewportProperties();
    }
  }

  function getViewPortRect() {
    return viewportManager.getViewPortRect();
  }

  function cleanup() {
    // Cleanup handled by IM lifecycle
    window.CONSOLE_LOG_IGNORE(`[${label}] Viewport cleanup called`);
    _instanceCount--;
    _instanceLabels.delete(label);
    
    if (_instanceCount === 0) {
      _instance = null;
    }
  }

  // Create the instance
  _instanceCount++;
  _instanceLabels.set(label, true);
  
  const viewportInstance = {
    // Reactive state
    padding,
    top,
    left,
    right,
    bottom,
    centerX,
    centerY,
    width,
    height,
    visualRect,
    
    // Methods
    initialize,
    isInitialized,
    setViewPortWidth,
    updateViewPort,
    getViewPortRect,
    cleanup
  };

  _instance = viewportInstance;
  return viewportInstance;
}