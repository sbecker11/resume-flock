import { ref, computed, onMounted, onUnmounted, getCurrentInstance } from 'vue';
import { BaseComponent } from '@/modules/core/abstracts/BaseComponent.mjs';
import { useAimPoint, FOCALPOINT_MODES } from './useAimPoint.mjs';
import * as mathUtils from '@/modules/utils/mathUtils.mjs';

// --- Constants ---
const EASE_FACTOR = 0.05;

// --- FocalPoint Manager Component (IM-managed) ---
export class FocalPointManager extends BaseComponent {
  constructor() {
    super('FocalPointManager');
    this.focalPointElement = null;
    this.stateManager = null;
    this.aimPointManager = null;
    this.animationFrameId = null;
    
    // Reactive state - Initialize to null to indicate uninitialized state
    this.focalPointState = ref({
      current: { x: null, y: null },
      target: { x: null, y: null }
    });
    this.isInitialized = false;
  }

  getDependencies() {
    return ['StateManager', 'AimPointManager']; // Depend on both StateManager and AimPointManager
  }

  initialize(dependencies) {
    this.stateManager = dependencies.StateManager;
    this.aimPointManager = dependencies.AimPointManager;
    
    // Initialize position to bullsEye location if in locked mode
    this.initializeFocalPointPosition();
    
    // Set up animation loop for smooth focal point movement
    this.startAnimationLoop();
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Listen for focalPointMode changes from AimPointManager
    window.addEventListener('focal-point-mode-changed', (event) => {
      const focalPointMode = event.detail.focalPointMode;
      if (focalPointMode === FOCALPOINT_MODES.LOCKED) {
        // Position at bulls-eye when locked
        const initializationManager = window.initializationManager;
        if (initializationManager) {
          const bullsEye = initializationManager.getComponent('BullsEye');
          if (bullsEye && bullsEye.getPosition) {
            const bullsEyePos = bullsEye.getPosition();
            this.setTarget(bullsEyePos.x, bullsEyePos.y, 'focalPointMode-change-to-locked');
          }
        }
      }
    });
    
    // Sync focal point with aim point position changes  
    this.syncWithAimPoint();
  }

  initializeFocalPointPosition() {
    // Since AimPointManager is an IM dependency, it's guaranteed to be fully initialized
    const aimPointPos = this.aimPointManager.getPosition();
    
    // Only initialize if we have a valid position (not 0,0 which indicates uninitialized)
    if (aimPointPos.x > 0 && aimPointPos.y > 0) {
      // Initialize both current and target to aimPoint position
      this.focalPointState.value.current.x = aimPointPos.x;
      this.focalPointState.value.current.y = aimPointPos.y;
      this.focalPointState.value.target.x = aimPointPos.x;
      this.focalPointState.value.target.y = aimPointPos.y;
      this.isInitialized = true;
      
      console.log('[FocalPointManager] Initialized to aimPoint position:', aimPointPos);
    } else {
      console.log('[FocalPointManager] AimPoint not ready yet (0,0) - will sync via events');
      // Leave state as null - will be initialized when first valid target is set
    }
  }
  
  syncWithAimPoint() {
    // Since AimPointManager is an IM dependency, it's guaranteed to be available
    // Set up continuous sync with aim point position
    this.aimPointSyncInterval = setInterval(() => {
      const aimPos = this.aimPointManager.aimPointState.value;
      this.setTarget(aimPos.x, aimPos.y, 'aim-point-sync');
    }, 50); // ~20fps sync for smoother easing
    
    console.log('[FocalPointManager] Started syncing with aim point position');
  }

  // Called by Vue component to provide template ref
  setFocalPointElement(element) {
    this.focalPointElement = element;
    console.log('[FocalPointManager] FocalPoint element set via template ref');
    
    // Apply positioning since dependencies are guaranteed to be ready via IM
    this.updateFocalPointPosition();
  }

  updateFocalPointPosition() {
    if (!this.focalPointElement) return;

    const { x, y } = this.focalPointState.value.current;
    
    // LOG ALL POSITION UPDATES TO TRACK 0,0 FLASHING
    console.log(`[FocalPointManager] updateFocalPointPosition called with: (${x}, ${y})`);
    
    // Skip update if focal point position is uninitialized (null)
    if (x === null || y === null) {
      console.log('[FocalPointManager] Position not initialized yet - hiding focal point');
      this.focalPointElement.style.visibility = 'hidden';
      return;
    }
    
    // Skip update if focal point position is invalid
    if (isNaN(x) || isNaN(y)) {
      console.warn('[FocalPointManager] Focal point position invalid - hiding:', { x, y });
      this.focalPointElement.style.visibility = 'hidden';
      return;
    }
    
    // WARN IF POSITION IS 0,0 (should not happen due to guards)
    if (x <= 0 || y <= 0) {
      console.warn(`[FocalPointManager] WARNING: Positioning focal point at invalid coordinates (${x}, ${y}) - this should not happen!`);
    }
    
    // Apply positioning styles
    this.focalPointElement.style.position = 'fixed';
    this.focalPointElement.style.left = `${x}px`;
    this.focalPointElement.style.top = `${y}px`;
    this.focalPointElement.style.transform = 'translate(-50%, -50%)';
    this.focalPointElement.style.zIndex = '1001'; // Above bulls-eye and aim point
    this.focalPointElement.style.visibility = 'visible'; // Show when properly positioned
    
    console.log(`[FocalPointManager] Applied CSS: left=${x}px, top=${y}px`);
    
    // Update visual state based on focalPointMode
    this.updateVisualState();
  }

  updateVisualState() {
    if (!this.focalPointElement) return;
    
    // Get current focalPointMode from AimPointManager
    const initializationManager = window.initializationManager;
    const aimPointManager = initializationManager?.getComponent('AimPointManager');
    const focalPointMode = aimPointManager?.getFocalPointMode() || FOCALPOINT_MODES.LOCKED;
    
    // Remove all focalPointMode classes
    this.focalPointElement.classList.remove('locked', 'following', 'dragging');
    
    // Add current focalPointMode class
    this.focalPointElement.classList.add(focalPointMode);
    
    // Update locked state data attribute for CSS styling
    const isLocked = focalPointMode === FOCALPOINT_MODES.LOCKED;
    this.focalPointElement.setAttribute('data-locked', isLocked);
    this.focalPointElement.classList.toggle('locked', isLocked);
    
    // Update dragging state
    const isDragging = focalPointMode === FOCALPOINT_MODES.DRAGGING;
    this.focalPointElement.setAttribute('data-dragging', isDragging);
    this.focalPointElement.classList.toggle('dragging', isDragging);
  }

  setTarget(x, y, source = 'external') {
    // Guard against setting 0,0 targets which would cause flashing
    if (x <= 0 || y <= 0) {
      console.warn(`[FocalPointManager] Ignoring invalid target position (${x}, ${y}) from ${source}`);
      return;
    }
    
    // If this is the first valid position, initialize current position too
    if (!this.isInitialized) {
      console.log(`[FocalPointManager] First valid position from ${source} - initializing current position to (${x}, ${y})`);
      this.focalPointState.value.current.x = x;
      this.focalPointState.value.current.y = y;
      this.isInitialized = true;
    }
    
    this.focalPointState.value.target.x = x;
    this.focalPointState.value.target.y = y;
    
    // Get current focalPointMode from AimPointManager
    const initializationManager = window.initializationManager;
    const aimPointManager = initializationManager?.getComponent('AimPointManager');
    const focalPointMode = aimPointManager?.getFocalPointMode() || FOCALPOINT_MODES.LOCKED;
    
    // In DRAGGING focalPointMode, snap immediately for aggressive tracking
    if (focalPointMode === FOCALPOINT_MODES.DRAGGING) {
      this.focalPointState.value.current.x = x;
      this.focalPointState.value.current.y = y;
      this.updateFocalPointPosition();
    }
    // In other focalPointModes, let animation loop handle smooth movement with easing
  }

  startAnimationLoop() {
    const animate = () => {
      const current = this.focalPointState.value.current;
      const target = this.focalPointState.value.target;
      
      // Skip animation if not initialized yet
      if (!this.isInitialized || current.x === null || current.y === null || target.x === null || target.y === null) {
        this.animationFrameId = requestAnimationFrame(animate);
        return;
      }
      
      // Calculate distance and apply easing
      const dx = target.x - current.x;
      const dy = target.y - current.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Only animate if there's significant movement needed
      if (distance > 0.5) {
        const newX = current.x + dx * EASE_FACTOR;
        const newY = current.y + dy * EASE_FACTOR;
        
        // LOG ANIMATION UPDATES THAT MIGHT CAUSE 0,0
        console.log(`[FocalPointManager] Animation: current=(${current.x}, ${current.y}) target=(${target.x}, ${target.y}) -> new=(${newX}, ${newY})`);
        
        current.x = newX;
        current.y = newY;
        this.updateFocalPointPosition();
      }
      
      // Continue animation loop
      this.animationFrameId = requestAnimationFrame(animate);
    };
    
    this.animationFrameId = requestAnimationFrame(animate);
  }

  setupEventListeners() {
    // Sync with aim point position changes
    if (this.aimPointManager) {
      // Watch for aim point changes and update focal point target
      const syncWithAimPoint = () => {
        if (this.aimPointManager.aimPointState) {
          const aimPos = this.aimPointManager.aimPointState.value;
          this.setTarget(aimPos.x, aimPos.y, 'aim-point-sync');
        }
      };
      
      // Initial sync
      syncWithAimPoint();
      
      // Set up periodic sync (since we can't directly watch the aim point state from here)
      this.syncInterval = setInterval(syncWithAimPoint, 50);
    }

    // Handle focal point dragging
    let isDragging = false;
    let dragOffset = { x: 0, y: 0 };

    const handleMouseDown = (event) => {
      // Get current focalPointMode from AimPointManager
      const initializationManager = window.initializationManager;
      const aimPointManager = initializationManager?.getComponent('AimPointManager');
      const currentFocalPointMode = aimPointManager?.getFocalPointMode() || FOCALPOINT_MODES.LOCKED;
      
      if (event.target === this.focalPointElement && currentFocalPointMode === FOCALPOINT_MODES.DRAGGING) {
        isDragging = true;
        const rect = this.focalPointElement.getBoundingClientRect();
        dragOffset.x = event.clientX - (rect.left + rect.width / 2);
        dragOffset.y = event.clientY - (rect.top + rect.height / 2);
        event.preventDefault();
      }
    };

    const handleMouseMove = (event) => {
      if (isDragging) {
        const newX = event.clientX - dragOffset.x;
        const newY = event.clientY - dragOffset.y;
        this.setTarget(newX, newY, 'drag');
        
        // Update aim point and bulls-eye when dragging
        if (this.aimPointManager) {
          this.aimPointManager.setPosition(newX, newY, 'focal-point-drag');
        }
      }
    };

    const handleMouseUp = () => {
      if (isDragging) {
        isDragging = false;
        
        // Save focal point position to state
        if (this.stateManager) {
          const AppState = this.stateManager.getAppState();
          if (AppState && AppState.focalPoint) {
            AppState.focalPoint.x = this.focalPointState.value.current.x;
            AppState.focalPoint.y = this.focalPointState.value.current.y;
            // Note: StateManager handles saving automatically
          }
        }
      }
    };

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    // Store for cleanup
    this.handleMouseDown = handleMouseDown;
    this.handleMouseMove = handleMouseMove;
    this.handleMouseUp = handleMouseUp;
  }


  destroy() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    if (this.aimPointSyncInterval) {
      clearInterval(this.aimPointSyncInterval);
    }
    if (this.handleMouseDown) {
      document.removeEventListener('mousedown', this.handleMouseDown);
    }
    if (this.handleMouseMove) {
      document.removeEventListener('mousemove', this.handleMouseMove);
    }
    if (this.handleMouseUp) {
      document.removeEventListener('mouseup', this.handleMouseUp);
    }
    this.focalPointElement = null;
    this.stateManager = null;
  }
}

// Create singleton instance
export const focalPointManager = new FocalPointManager();

// --- Composable Wrapper (for Vue components) ---
let _instance = null;

export function useFocalPoint() {
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

  const aimPoint = useAimPoint();
  const { position: aimPointPosition, focalPointMode: aimPointFocalPointMode } = aimPoint;

  // Create computed properties that reference the IM-managed focal point state
  const position = computed(() => focalPointManager.focalPointState.value.current);
  const target = computed(() => focalPointManager.focalPointState.value.target);
  const focalPointMode = computed(() => aimPointFocalPointMode.value); // Get focalPointMode from AimPointManager
  const isLocked = computed(() => aimPointFocalPointMode.value === FOCALPOINT_MODES.LOCKED);
  const isDragging = computed(() => aimPointFocalPointMode.value === FOCALPOINT_MODES.DRAGGING);

  // Current position components
  const x = computed(() => focalPointManager.focalPointState.value.current.x);
  const y = computed(() => focalPointManager.focalPointState.value.current.y);

  // Wrapper functions that delegate to the IM-managed instance
  function setFocalPoint(x, y, source = 'composable') {
    return focalPointManager.setTarget(x, y, source);
  }

  // Method for Vue component to provide template ref
  function setFocalPointElement(element) {
    return focalPointManager.setFocalPointElement(element);
  }

  function updatePosition() {
    return focalPointManager.updateFocalPointPosition();
  }

  function cleanup() {
    // Cleanup handled by IM lifecycle
    window.CONSOLE_LOG_IGNORE('FocalPoint: Composable cleanup called');
    _instance = null;
  }

  // Create the instance
  const focalPointInstance = {
    // Reactive state
    position,
    target,
    focalPointMode,
    isLocked,
    isDragging,
    x,
    y,
    
    // Methods
    setFocalPoint,
    setFocalPointElement, // For template ref injection
    updatePosition,
    cleanup
  };

  _instance = focalPointInstance;
  return focalPointInstance;
}