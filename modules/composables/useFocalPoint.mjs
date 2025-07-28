import { ref, computed, getCurrentInstance } from 'vue';
import { useAimPoint, FOCALPOINT_MODES } from './useAimPoint.mjs';

// Simple focal point composable without IM framework
let _instance = null;

export function useFocalPoint() {
  // Singleton check - if instance exists, return it immediately
  if (_instance) {
    return _instance;
  }

  // Current position components
  const x = ref(0);
  const y = ref(0);

  // Computed position object
  const position = computed(() => ({ x: x.value, y: y.value }));
  
  // Get focal point mode from aim point
  const aimPoint = useAimPoint();
  const focalPointMode = computed(() => aimPoint.focalPointMode.value || FOCALPOINT_MODES.LOCKED);
  const isLocked = computed(() => focalPointMode.value === FOCALPOINT_MODES.LOCKED);
  const isDragging = computed(() => focalPointMode.value === FOCALPOINT_MODES.DRAGGING);

  // Simple focal point element reference
  let focalPointElement = null;

  // Method for Vue component to provide template ref
  function setFocalPointElement(element) {
    focalPointElement = element;
    console.log('[useFocalPoint] FocalPoint element set via template ref');
    updatePosition();
  }

  function updatePosition() {
    if (!focalPointElement) return;

    focalPointElement.style.position = 'fixed';
    focalPointElement.style.left = `${x.value}px`;
    focalPointElement.style.top = `${y.value}px`;
    focalPointElement.style.transform = 'translate(-50%, -50%)';
    focalPointElement.style.zIndex = '100';
    focalPointElement.style.pointerEvents = 'auto';
    focalPointElement.style.visibility = (x.value > 0 && y.value > 0) ? 'visible' : 'hidden';
  }

  function setFocalPoint(newX, newY, source = 'composable') {
    x.value = newX;
    y.value = newY;
    updatePosition();
  }

  function cleanup() {
    window.CONSOLE_LOG_IGNORE('FocalPoint: Composable cleanup called');
    _instance = null;
  }

  // Initialize with center position
  x.value = window.innerWidth / 2;
  y.value = window.innerHeight / 2;

  // Create the instance
  const focalPointInstance = {
    // Reactive state
    position,
    x,
    y,
    focalPointMode,
    isLocked,
    isDragging,
    
    // Methods
    setFocalPoint,
    setFocalPointElement,
    updatePosition,
    cleanup
  };

  _instance = focalPointInstance;
  return focalPointInstance;
}