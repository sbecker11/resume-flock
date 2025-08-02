import { ref, computed, getCurrentInstance } from 'vue';
// useAimPoint removed during Vue 3 migration - using simplified approach

// Focal point modes
export const FOCALPOINT_MODES = {
  LOCKED: 'LOCKED',
  FOLLOWING: 'FOLLOWING',
  DRAGGING: 'DRAGGING'
};

// Cursor constant - single source of truth
const CROSSHAIR_CURSOR = 'url(\'/static_content/icons/x-hairs/icons8-accuracy-32-whiter.png\') 16 16, crosshair';

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
  
  // Simplified focal point mode (no aim point dependency)
  const focalPointMode = ref(FOCALPOINT_MODES.LOCKED);
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
    focalPointElement.style.pointerEvents = 'none';
    focalPointElement.style.visibility = (x.value > 0 && y.value > 0) ? 'visible' : 'hidden';
    
    // Dispatch event for parallax system
    window.dispatchEvent(new CustomEvent('focal-point-changed', {
      detail: { x: x.value, y: y.value }
    }));
  }

  function setFocalPoint(newX, newY, source = 'composable') {
    x.value = newX;
    y.value = newY;
    updatePosition();
  }

  function cleanup() {
    window.CONSOLE_LOG_IGNORE('FocalPoint: Composable cleanup called');
    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
      animationFrame = null;
    }
    
    // If we're in drag mode, preserve the state and re-add the listener after a brief delay
    const wasDragModeActive = isDragModeActive;
    
    removeMouseListener();
    
    // Re-add drag mode listener if we were in drag mode
    if (wasDragModeActive) {
      console.log('[useFocalPoint] 🔄 Restoring drag mode listener after cleanup');
      setTimeout(() => {
        if (isDragModeActive) {
          addMouseListener();
        }
      }, 100);
    }
    
    // Don't reset _instance to null during programmatic refresh - keep the singleton alive
    // _instance = null;
  }

  // Initialize with center position
  x.value = window.innerWidth / 2;
  y.value = window.innerHeight / 2;

  // Animation state
  let animationFrame = null;
  let targetX = x.value;
  let targetY = y.value;

  function startEasing() {
    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
    }

    function animate() {
      const currentX = x.value;
      const currentY = y.value;
      
      // Calculate distance to target
      const dx = targetX - currentX;
      const dy = targetY - currentY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // If we're close enough, snap to target
      if (distance < 1) {
        x.value = targetX;
        y.value = targetY;
        updatePosition();
        animationFrame = null;
        return;
      }
      
      // Easing factor - adjust for desired animation speed
      const easingFactor = isDragging.value ? 1 : 0.15; // Immediate in dragging mode, smooth otherwise
      
      // Update position with easing
      x.value = currentX + (dx * easingFactor);
      y.value = currentY + (dy * easingFactor);
      updatePosition();
      
      // Continue animation
      animationFrame = requestAnimationFrame(animate);
    }
    
    animate();
  }

  function setTarget(newX, newY, source = 'composable') {
    targetX = newX;
    targetY = newY;
    
    if (isDragging.value) {
      // In drag mode: Pure DOM manipulation, no Vue reactivity, no animation
      if (focalPointElement) {
        focalPointElement.style.left = `${newX}px`;
        focalPointElement.style.top = `${newY}px`;
        
        // Update reactive values for parallax system
        x.value = newX;
        y.value = newY;
        
        // Dispatch parallax event in drag mode for real-time updates
        window.dispatchEvent(new CustomEvent('focal-point-changed', {
          detail: { x: newX, y: newY }
        }));
      }
      // Cancel animation loop entirely - no need to run it in drag mode
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
        animationFrame = null;
      }
      // Skip all Vue reactive updates for maximum performance
      return;
    } else {
      // Non-drag modes: Start smooth easing animation with Vue reactivity
      startEasing();
    }
  }

  // Pure vanilla JavaScript mouse handler - completely bypass composable in drag mode
  let isDragModeActive = false;
  let vanillaMouseHandler = null;
  
  // Create separate vanilla JS handler that never touches Vue
  function createVanillaHandler() {
    let lastX = null;
    let lastY = null;
    return (event) => {
      // Only log and dispatch if coordinates actually changed
      if (event.clientX !== lastX || event.clientY !== lastY) {
        console.log(`[FocalPoint] 🖱️ Vanilla handler called: x=${event.clientX}, y=${event.clientY}`);
        
        if (focalPointElement) {
          focalPointElement.style.left = event.clientX + 'px';
          focalPointElement.style.top = event.clientY + 'px';
          
          // Update global focal point values for parallax system
          targetX = event.clientX;
          targetY = event.clientY;
          
          // Also update the reactive values so parallax can read them
          x.value = event.clientX;
          y.value = event.clientY;
          
          // Dispatch parallax event in drag mode for real-time updates
          console.log(`[FocalPoint] 📡 Dispatching focal-point-changed from vanilla handler`);
          window.dispatchEvent(new CustomEvent('focal-point-changed', {
            detail: { x: event.clientX, y: event.clientY }
          }));
        }
        
        lastX = event.clientX;
        lastY = event.clientY;
      }
    };
  }
  
  const handleMouseMove = (event) => {
    // Only used for non-drag modes - Vue path
    x.value = event.clientX;
    y.value = event.clientY;
  };

  let mouseListenerActive = false;

  function addMouseListener() {
    if (!mouseListenerActive) {
      if (isDragModeActive) {
        // Pure vanilla JS handler for drag mode - never calls Vue composable
        vanillaMouseHandler = createVanillaHandler();
        document.addEventListener('mousemove', vanillaMouseHandler, { passive: true });
        console.log('[useFocalPoint] ✅ Added vanilla mouse listener for drag mode');
      } else {
        // Vue composable handler for other modes
        document.addEventListener('mousemove', handleMouseMove, { passive: true });
        console.log('[useFocalPoint] ✅ Added Vue mouse listener for non-drag mode');
      }
      mouseListenerActive = true;
    } else {
      console.log('[useFocalPoint] ⚠️ Mouse listener already active, skipping add');
    }
  }

  function removeMouseListener() {
    if (mouseListenerActive) {
      if (vanillaMouseHandler) {
        document.removeEventListener('mousemove', vanillaMouseHandler, { passive: true });
        vanillaMouseHandler = null;
        console.log('[useFocalPoint] ⚠️ Pure vanilla JS mouse listener removed - STACK TRACE:', new Error().stack);
      } else {
        document.removeEventListener('mousemove', handleMouseMove, { passive: true });
        console.log('[useFocalPoint] ⚠️ Vue mouse listener removed - STACK TRACE:', new Error().stack);
      }
      mouseListenerActive = false;
    }
  }

  // Listen for aim point changes to update focal point target
  window.addEventListener('focal-point-mode-changed', () => {
    console.log('[useFocalPoint] 🚨 focal-point-mode-changed event received - STACK TRACE:', new Error().stack);
    // Always remove existing mouse listener first when changing modes
    removeMouseListener();
    
    // Handle mode-specific behavior
    if (focalPointMode.value === FOCALPOINT_MODES.DRAGGING) {
      
      isDragModeActive = true;
      
      // Hide the focal point DOM element entirely
      if (focalPointElement) {
        focalPointElement.style.display = 'none';
      }
      
      // Set crosshair cursor specifically on scene container and its children
      const sceneContainer = document.getElementById('scene-container');
      if (sceneContainer) {
        sceneContainer.style.setProperty('cursor', CROSSHAIR_CURSOR, 'important');
        
        // Apply crosshair to all elements within scene container
        const sceneElements = sceneContainer.querySelectorAll('*');
        sceneElements.forEach(el => {
          el.style.setProperty('cursor', CROSSHAIR_CURSOR, 'important');
        });
        
        console.log('[useFocalPoint] Applied crosshair cursor to scene container and its children');
      }
      
      // Add the vanilla mouse listener for drag mode
      addMouseListener();
      
    } else if (focalPointMode.value === FOCALPOINT_MODES.LOCKED) {
      // Locked mode: no mouse listener, focal point follows aim point only
      isDragModeActive = false;
      
      // Show the focal point DOM element
      if (focalPointElement) {
        focalPointElement.style.display = 'flex';
      }
      
      // Restore normal cursor
      const sceneContainer = document.getElementById('scene-container');
      if (sceneContainer) {
        sceneContainer.style.removeProperty('cursor');
        const sceneElements = sceneContainer.querySelectorAll('*');
        sceneElements.forEach(el => {
          el.style.removeProperty('cursor');
        });
      }
      
      // Simplified locked mode - no aim point tracking needed
      
      // NO mouse listener in locked mode - focal point only follows aim point
      
    } else {
      // Following mode
      isDragModeActive = false;
      
      // Show the focal point DOM element
      if (focalPointElement) {
        focalPointElement.style.display = 'flex';
      }
      
      // Restore normal cursor by removing the forced styles from scene container
      const sceneContainer = document.getElementById('scene-container');
      if (sceneContainer) {
        sceneContainer.style.removeProperty('cursor');
        
        // Clear cursor from scene container children
        const sceneElements = sceneContainer.querySelectorAll('*');
        sceneElements.forEach(el => {
          el.style.removeProperty('cursor');
        });
        
        console.log('[useFocalPoint] Restored default cursors in scene container');
      }
      
      // Sync reactive values with current mouse position since DOM element was hidden
      x.value = targetX;
      y.value = targetY;
      
      // Simplified following mode - no aim point tracking needed
      
      // Add the Vue mouse listener back only for following mode
      if (focalPointMode.value === FOCALPOINT_MODES.FOLLOWING) {
        addMouseListener();
      }
      
      // No aim point sync needed in simplified system
    }
  });

  // Initialize cursor-based drag mode if starting in drag mode
  if (focalPointMode.value === FOCALPOINT_MODES.DRAGGING) {
    isDragModeActive = true;
    // Apply cursor styling immediately
    if (focalPointElement) {
      focalPointElement.style.display = 'none';
    }
    const sceneContainer = document.getElementById('scene-container');
    if (sceneContainer) {
      sceneContainer.style.cursor = CROSSHAIR_CURSOR;
    }
    document.body.style.cursor = CROSSHAIR_CURSOR;
    document.documentElement.style.cursor = CROSSHAIR_CURSOR;
  }

  // Simplified focal point system - no aim point dependency

  // Mode cycling function
  function cycleMode() {
    const modes = Object.values(FOCALPOINT_MODES);
    const currentIndex = modes.indexOf(focalPointMode.value);
    const nextIndex = (currentIndex + 1) % modes.length;
    focalPointMode.value = modes[nextIndex];
    console.log(`[useFocalPoint] Mode cycled to: ${focalPointMode.value}`);
  }

  // Test function for cursor debugging
  function testCrosshairCursor() {
    console.log('[useFocalPoint] Testing crosshair cursor manually');
    document.body.style.cursor = CROSSHAIR_CURSOR;
    document.documentElement.style.cursor = CROSSHAIR_CURSOR;
    const sceneContainer = document.getElementById('scene-container');
    if (sceneContainer) {
      sceneContainer.style.cursor = CROSSHAIR_CURSOR;
    }
    console.log('[useFocalPoint] Applied crosshair cursor for testing');
  }

  // Make test function globally available for debugging
  if (typeof window !== 'undefined') {
    window.testCrosshairCursor = testCrosshairCursor;
  }

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
    setTarget,
    updatePosition,
    cycleMode,
    cleanup,
    testCrosshairCursor
  };

  // Make focal point available globally for parallax system
  if (typeof window !== 'undefined') {
    window.focalPoint = focalPointInstance;
  }

  _instance = focalPointInstance;
  return focalPointInstance;
}