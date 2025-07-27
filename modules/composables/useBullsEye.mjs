import { ref, computed, onMounted, onUnmounted, watchEffect, getCurrentInstance } from 'vue';
import { BaseComponent } from '@/modules/core/abstracts/BaseComponent.mjs';
import { useLayoutToggle } from './useLayoutToggle.mjs';

// --- Constants ---
export const FOCALPOINT_MODES = {
  LOCKED: 'locked',
  FOLLOWING: 'following',
  DRAGGING: 'dragging'
};

// --- BullsEye Manager Component (IM-managed) ---
export class BullsEyeManager extends BaseComponent {
  constructor() {
    super('BullsEyeManager');
    this.bullsEyeCore = null;
    this.focalPointMode = FOCALPOINT_MODES.LOCKED;
    this.mousePosition = { x: 0, y: 0 };
    this.updateTimeout = null;
    this.isProperlyInitialized = false; // Track actual positioning status
    
    // Reactive state
    this.bullsEyeState = ref({
      x: 0,
      y: 0
    });
  }

  getDependencies() {
    return ['BullsEye']; // Depend on the core BullsEye component
  }

  initialize(dependencies) {
    this.bullsEyeCore = dependencies.BullsEye;
    
    // Listen for bulls-eye-moved events from core (fired after setupDom positioning)
    window.addEventListener('bulls-eye-moved', (event) => {
      const { position } = event.detail;
      this.bullsEyeState.value.x = position.x;
      this.bullsEyeState.value.y = position.y;
      
      // Mark as properly initialized once we receive the first position update
      if (!this.isProperlyInitialized) {
        this.isProperlyInitialized = true;
        console.log('[BullsEyeManager] Now properly initialized with position from bulls-eye-moved event:', position);
      }
    });
    
    // Set up event listeners for mouse tracking
    this.setupEventListeners();
    
    // Note: Initial position update removed - will be set via bulls-eye-moved event after setupDom()
    console.log('[BullsEyeManager] Initialized - waiting for bulls-eye-moved event for position');
  }

  updateBullsEyePosition() {
    if (this.bullsEyeCore && this.bullsEyeCore.isReady()) {
      const bullsEyeElement = this.bullsEyeCore.getBullsEyeElement();
      if (bullsEyeElement) {
        const rect = bullsEyeElement.getBoundingClientRect();
        const newX = rect.left + rect.width / 2;
        const newY = rect.top + rect.height / 2;
        
        // Only update if we have valid coordinates (not 0,0 from unready DOM)
        if (newX > 0 && newY > 0) {
          this.bullsEyeState.value.x = newX;
          this.bullsEyeState.value.y = newY;
          
          // Mark as properly initialized once we have a valid position
          if (!this.isProperlyInitialized) {
            this.isProperlyInitialized = true;
            console.log('[BullsEyeManager] Now properly initialized with position:', { x: newX, y: newY });
          }
        }
      }
    }
  }

  immediateBullsEyeUpdate(x, y, source = 'unknown') {
    // BULLS-EYE NEVER MOVES! It always stays at viewport center.
    // This method should NOT reposition the bulls-eye - that's handled by the core BullsEye component
    console.warn(`[BullsEyeManager] INVALID CALL: Bulls-eye should never move! Called from: ${source}`);
    console.warn('[BullsEyeManager] Bulls-eye position is managed by core BullsEye component and stays at viewport center');
    
    // Update reactive state to reflect current bulls-eye position (not the requested x,y)
    this.updateBullsEyePosition();
  }

  debouncedUpdateBullsEye(x, y, source = 'unknown') {
    if (this.updateTimeout) {
      clearTimeout(this.updateTimeout);
    }
    
    this.updateTimeout = setTimeout(() => {
      this.immediateBullsEyeUpdate(x, y, source);
      this.updateTimeout = null;
    }, 50); // 50ms debounce
  }

  setupEventListeners() {
    // Bulls-eye never moves - it stays at viewport center
    // No mouse tracking needed since bulls-eye position is fixed by core BullsEye component
    window.CONSOLE_LOG_IGNORE('[BullsEyeManager] No event listeners needed - bulls-eye position is fixed at viewport center');
  }

  setFocalPointMode(newFocalPointMode) {
    this.focalPointMode = newFocalPointMode;
  }

  getFocalPointMode() {
    return this.focalPointMode;
  }

  isReady() {
    return this.isProperlyInitialized && this.bullsEyeCore && this.bullsEyeCore.isReady();
  }

  destroy() {
    if (this.updateTimeout) {
      clearTimeout(this.updateTimeout);
    }
    this.bullsEyeCore = null;
    this.isProperlyInitialized = false;
  }
}

// Create singleton instance
export const bullsEyeManager = new BullsEyeManager();

// --- Composable Wrapper (for Vue components) ---
let _instance = null;

export function useBullsEye() {
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

  // Watch for layout changes and update bulls-eye reactively
  const layoutToggle = useLayoutToggle();
  watchEffect(() => {
    // Re-run when layout orientation changes
    const orientation = layoutToggle.orientation.value;
    window.CONSOLE_LOG_IGNORE(`BullsEye: Layout orientation changed to:`, orientation);
    
    // Trigger bulls-eye recalculation after layout change
    if (bullsEyeManager.bullsEyeCore) {
      setTimeout(() => {
        bullsEyeManager.updateBullsEyePosition();
      }, 350); // Wait for CSS transitions to complete
    }
  });

  // Create computed properties that reference the IM-managed bulls-eye state
  const x = computed(() => bullsEyeManager.bullsEyeState.value.x);
  const y = computed(() => bullsEyeManager.bullsEyeState.value.y);
  const position = computed(() => ({ 
    x: bullsEyeManager.bullsEyeState.value.x, 
    y: bullsEyeManager.bullsEyeState.value.y 
  }));
  const focalPointMode = computed(() => bullsEyeManager.getFocalPointMode());
  const isLocked = computed(() => bullsEyeManager.getFocalPointMode() === FOCALPOINT_MODES.LOCKED);
  const isFollowing = computed(() => bullsEyeManager.getFocalPointMode() === FOCALPOINT_MODES.FOLLOWING);
  const isDragging = computed(() => bullsEyeManager.getFocalPointMode() === FOCALPOINT_MODES.DRAGGING);

  // Wrapper functions that delegate to the IM-managed instance
  function setBullsEye(x, y, source = 'composable') {
    console.warn(`[useBullsEye] INVALID CALL: Bulls-eye cannot be moved! Called from: ${source}`);
    console.warn('[useBullsEye] Bulls-eye position is fixed at viewport center by core BullsEye component');
    // Return current position instead of trying to move it
    return bullsEyeManager.updateBullsEyePosition();
  }

  function setFocalPointMode(newFocalPointMode) {
    return bullsEyeManager.setFocalPointMode(newFocalPointMode);
  }

  function updatePosition() {
    return bullsEyeManager.updateBullsEyePosition();
  }

  function cleanup() {
    // Cleanup handled by IM lifecycle
    window.CONSOLE_LOG_IGNORE('BullsEye: Composable cleanup called');
    _instance = null;
  }

  // Create the instance
  const bullsEyeInstance = {
    // Reactive state
    x,
    y,
    position,
    focalPointMode,
    isLocked,
    isFollowing,
    isDragging,
    
    // Methods
    setBullsEye,
    setFocalPointMode,
    updatePosition,
    cleanup
  };

  _instance = bullsEyeInstance;
  return bullsEyeInstance;
}