import { ref, computed, getCurrentInstance } from 'vue';

// Constants
export const FOCALPOINT_MODES = {
  LOCKED: 'locked',
  FOLLOWING: 'following',
  DRAGGING: 'dragging'
};

// Simple aim point composable without IM framework
let _instance = null;

export function useAimPoint() {
  if (_instance) {
    return _instance;
  }

  // Reactive state
  const x = ref(window.innerWidth / 2);
  const y = ref(window.innerHeight / 2);
  const position = computed(() => ({ x: x.value, y: y.value }));
  
  // Focal point mode state
  const focalPointMode = ref(FOCALPOINT_MODES.LOCKED);
  const isLocked = computed(() => focalPointMode.value === FOCALPOINT_MODES.LOCKED);
  const isFollowing = computed(() => focalPointMode.value === FOCALPOINT_MODES.FOLLOWING);
  const isDragging = computed(() => focalPointMode.value === FOCALPOINT_MODES.DRAGGING);

  // Aim point element reference
  let aimPointElement = null;

  function setAimPointElement(element) {
    aimPointElement = element;
    console.log('[useAimPoint] AimPoint element set via template ref');
    updatePosition();
  }

  function updatePosition() {
    if (!aimPointElement) return;

    aimPointElement.style.position = 'fixed';
    aimPointElement.style.left = `${x.value}px`;
    aimPointElement.style.top = `${y.value}px`;
    aimPointElement.style.transform = 'translate(-50%, -50%)';
    aimPointElement.style.zIndex = '101';
    aimPointElement.style.pointerEvents = 'none';
    aimPointElement.style.visibility = 'visible';
  }

  function setAimPoint(newX, newY, source = 'composable') {
    x.value = newX;
    y.value = newY;
    updatePosition();
  }

  function setFocalPointMode(newMode) {
    focalPointMode.value = newMode;
    window.dispatchEvent(new CustomEvent('focal-point-mode-changed', {
      detail: { focalPointMode: newMode }
    }));
  }

  function cycleFocalPointMode() {
    const modes = [FOCALPOINT_MODES.LOCKED, FOCALPOINT_MODES.FOLLOWING, FOCALPOINT_MODES.DRAGGING];
    const currentIndex = modes.indexOf(focalPointMode.value);
    const nextIndex = (currentIndex + 1) % modes.length;
    setFocalPointMode(modes[nextIndex]);
  }

  function cleanup() {
    window.CONSOLE_LOG_IGNORE('AimPoint: Composable cleanup called');
    _instance = null;
  }

  // Create the instance
  const aimPointInstance = {
    // Reactive state
    x,
    y,
    position,
    focalPointMode,
    isLocked,
    isFollowing,
    isDragging,
    
    // Methods
    setAimPoint,
    setFocalPointMode,
    cycleFocalPointMode,
    setAimPointElement,
    updatePosition,
    cleanup
  };

  _instance = aimPointInstance;
  return aimPointInstance;
}