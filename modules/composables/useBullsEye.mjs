import { ref, computed } from 'vue';

// Constants
export const FOCALPOINT_MODES = {
  LOCKED: 'locked',
  FOLLOWING: 'following',
  DRAGGING: 'dragging'
};

// Simple bulls-eye composable - just returns bullsEye directly
let _instance = null;

export function useBullsEye() {
  if (_instance) {
    return _instance;
  }

  // Bulls-eye position state
  const x = ref(window.innerWidth / 2);
  const y = ref(window.innerHeight / 2);
  const position = computed(() => ({ x: x.value, y: y.value }));

  const focalPointMode = ref(FOCALPOINT_MODES.LOCKED);
  const isLocked = computed(() => focalPointMode.value === FOCALPOINT_MODES.LOCKED);
  const isFollowing = computed(() => focalPointMode.value === FOCALPOINT_MODES.FOLLOWING);
  const isDragging = computed(() => focalPointMode.value === FOCALPOINT_MODES.DRAGGING);

  function setBullsEye(newX, newY, source = 'composable') {
    console.warn('[useBullsEye] Bulls-eye cannot be moved! Position is fixed at viewport center');
    // Bulls-eye position is managed by the core bullsEye module
    if (window.bullsEye) {
      const pos = window.bullsEye.getPosition();
      x.value = pos.x;
      y.value = pos.y;
    }
  }

  function setFocalPointMode(mode) {
    focalPointMode.value = mode;
  }

  function updatePosition() {
    if (window.bullsEye) {
      const pos = window.bullsEye.getPosition();
      x.value = pos.x;
      y.value = pos.y;
    }
  }

  function cleanup() {
    window.CONSOLE_LOG_IGNORE('BullsEye: Composable cleanup called');
    _instance = null;
  }

  const bullsEyeInstance = {
    x,
    y,
    position,
    focalPointMode,
    isLocked,
    isFollowing,
    isDragging,
    setBullsEye,
    setFocalPointMode,
    updatePosition,
    cleanup
  };

  _instance = bullsEyeInstance;
  return bullsEyeInstance;
}