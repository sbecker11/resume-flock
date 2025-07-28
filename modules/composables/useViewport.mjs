import { ref, computed, watchEffect } from 'vue';
import { useLayoutToggle } from './useLayoutToggle.mjs';

// Simple viewport composable without IM framework
let _instance = null;

export function useViewport() {
  if (_instance) {
    return _instance;
  }

  const { orientation } = useLayoutToggle();

  // Simple viewport state
  const viewportState = ref({
    padding: 100,
    top: 0,
    left: 0,
    width: window.innerWidth,
    height: window.innerHeight
  });

  let sceneContainer = null;

  function initializeViewport(sceneContainerElement) {
    sceneContainer = sceneContainerElement;
    console.log('[useViewport] Viewport initialized with scene container');
    updateViewportProperties();
  }

  function updateViewportProperties() {
    if (!sceneContainer) return;

    const rect = sceneContainer.getBoundingClientRect();
    viewportState.value = {
      padding: 100,
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height
    };

    // Dispatch event for other components
    window.dispatchEvent(new CustomEvent('viewport-changed', {
      detail: { viewport: viewportState.value }
    }));
  }

  // Listen for window resize
  function handleResize() {
    updateViewportProperties();
  }

  window.addEventListener('resize', handleResize);

  function cleanup() {
    window.removeEventListener('resize', handleResize);
    _instance = null;
  }

  const viewportInstance = {
    viewportState,
    initializeViewport,
    updateViewportProperties,
    cleanup
  };

  _instance = viewportInstance;
  return viewportInstance;
}