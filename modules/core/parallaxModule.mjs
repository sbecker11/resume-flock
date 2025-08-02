/**
 * Module: parallax
 * Simple parallax effects without IM framework
 */
import * as zUtils from '../utils/zUtils.mjs';
import { bullsEye } from './bullsEye.mjs';
import { useFocalPoint } from '../composables/useFocalPoint.mjs';

export const TEST_PARALLAX = false;
export const EPSILON = 0.01;
// Parallax constants
export const PARALLAX_X_EXAGGERATION_FACTOR = 0.9;
export const PARALLAX_Y_EXAGGERATION_FACTOR = 1.0;
export const CLONE_Z_SCALE = 0; // Clones have no parallax effect
export const MAX_Z_SCALE = 0.9; // Maximum Z scale for non-clones

// Simple parallax functions
let sceneContainerRect = { left: 0, top: 0, width: 0, height: 0 };
const Z_RANGE = zUtils.ALL_CARDS_Z_MAX - zUtils.ALL_CARDS_Z_MIN;

// Track previous displacement values for change detection
let previousDisplacements = { dh: null, dv: null };

// Debounced rendering to prevent multiple rapid calls
let renderTimeout = null;

function debouncedRenderAllCDivs(delay = 0) {
  if (renderTimeout) {
    clearTimeout(renderTimeout);
  }
  renderTimeout = setTimeout(() => {
    renderAllCDivs();
    renderTimeout = null;
  }, delay);
}

// Valid parallax events and their sources
const PARALLAX_EVENTS = {
  'viewport-changed': { source: 'useViewport.mjs', delay: 0 },
  'focal-point-changed': { source: 'useFocalPoint.mjs', delay: 0 },
  'resize-handle-changed': { source: 'useResizeHandle.mjs', delay: 0 },
  'resize': { source: 'browser native', delay: 0 },
  'bullseye-recentered': { source: 'bullsEye.mjs', delay: 0 },
  'layout-orientation-changed': { source: 'useLayoutToggle.mjs', delay: 100 }
};

function verifyEventSources() {
  console.log('[ParallaxModule] Verifying event sources...');
  
  // Check if expected global objects exist
  const checks = {
    'bullsEye available': !!window.bullsEye,
    'focalPoint available': !!window.focalPoint,
    'useFocalPoint composable': typeof useFocalPoint === 'function',
    'bullsEye instance ready': window.bullsEye?.isReady?.()
  };
  
  Object.entries(checks).forEach(([check, result]) => {
    console.log(`[ParallaxModule] ${check}: ${result ? '✅' : '❌'}`);
  });
  
  console.log('[ParallaxModule] Event sources:', Object.fromEntries(
    Object.entries(PARALLAX_EVENTS).map(([event, info]) => [event, info.source])
  ));
}

function addParallaxEventListener(eventName) {
  if (!PARALLAX_EVENTS[eventName]) {
    throw new Error(`Invalid parallax event: ${eventName}. Valid events: ${Object.keys(PARALLAX_EVENTS).join(', ')}`);
  }
  
  const { source, delay } = PARALLAX_EVENTS[eventName];
  const handler = delay > 0 ? 
    () => {
      const focalPointMode = window.focalPoint?.focalPointMode?.value || 'unknown';
      console.log(`[ParallaxModule] 🎯 Received '${eventName}' event from ${source} (mode: ${focalPointMode}, ${delay}ms delay)`);
      debouncedRenderAllCDivs(delay);
    } : 
    () => {
      const focalPointMode = window.focalPoint?.focalPointMode?.value || 'unknown';
      console.log(`[ParallaxModule] 🎯 Received '${eventName}' event from ${source} (mode: ${focalPointMode})`);
      debouncedRenderAllCDivs(0);
    };
  
  window.addEventListener(eventName, handler);
  console.log(`[ParallaxModule] ✅ Registered listener for '${eventName}' (${source}, ${delay}ms delay)`);
}

export function initializeParallax() {
  verifyEventSources();

  window.getBullsEyePosition = getBullsEyePosition;
  window.getFocalPointPosition = getFocalPointPosition;
  window.getViewportOrigin = getViewportOrigin;
  
  // Register all parallax event listeners with validation
  Object.keys(PARALLAX_EVENTS).forEach(eventName => {
    addParallaxEventListener(eventName);
  });
}

function getBullsEyePosition() {
  return bullsEye.getPosition();
}

function getViewportOrigin() {
  const bullsEyePos = getBullsEyePosition();
  return { x: bullsEyePos.x, y: bullsEyePos.y };
}

function getFocalPointPosition() {
  // Access focal point position from global window object instead of composable
  // This avoids calling Vue composable outside of setup context
  if (window.focalPoint && window.focalPoint.getPosition) {
    return window.focalPoint.getPosition();
  }
  
  // Fallback: get from global state or use default
  return window.appState?.focalPoint || { x: window.innerWidth / 2, y: window.innerHeight / 2 };
}

function calculateParallaxDisplacements() {

  const bullsEyePos = getBullsEyePosition();
  const focalPointPos = getFocalPointPosition();
  
  let dh = (bullsEyePos.x - focalPointPos.x) * PARALLAX_X_EXAGGERATION_FACTOR;
  let dv = (bullsEyePos.y - focalPointPos.y) * PARALLAX_Y_EXAGGERATION_FACTOR;
  
  // Don't update previous values here - let the caller do it after comparison
  return { dh, dv };
}

export function isClone(bizCardDiv) {
  return bizCardDiv.id.indexOf("clone") != -1;
}

export function hasClone(bizCardDiv) {
  return bizCardDiv.classList.contains("hasClone");
}

function refreshAllParallaxTransforms() {
  requestAnimationFrame(() => {
    const { dh, dv } = calculateParallaxDisplacements();
    // console.log(`[ParallaxModule] 🔄 refreshAllParallaxTransforms: dh=${dh.toFixed(2)}, dv=${dv.toFixed(2)}`);
    // console.log(`[ParallaxModule] 📊 Previous: dh=${previousDisplacements.dh}, dv=${previousDisplacements.dv}`);
    
    // new deltas are zero, so no parallax update
    if (dh == 0 && dv == 0) {
      console.log(`[ParallaxModule] ⏹️ No displacement, skipping parallax update`);
      return;
    }
    // no change in deltas, so no parallax update
    if (dh == previousDisplacements.dh && dv == previousDisplacements.dv) {
      console.log(`[ParallaxModule] ⏹️ No change in displacement, skipping parallax update`);
      return;
    }
        
    const bizCardDivs = document.getElementsByClassName('biz-card-div');
    // console.log(`[ParallaxModule] 🎴 Applying parallax to ${bizCardDivs.length} cDivs`);
    
    let appliedCount = 0;
    let skippedCount = 0;
    
    // apply new deltas to all cDivs
    for (const bizCardDiv of bizCardDivs) {
      const wasApplied = applyParallaxToBizCardDiv(bizCardDiv, dh, dv);
      if (wasApplied) appliedCount++;
      else skippedCount++;
    }

    // save new deltas
    previousDisplacements.dh = dh;
    previousDisplacements.dv = dv;
    
    // console.log(`[ParallaxModule] ✅ Parallax applied to ${appliedCount} cDivs, skipped ${skippedCount}`);
  });
}

// Comprehensive renderAllCDivs function that responds to all viewport changes
export function renderAllCDivs() {
  refreshAllParallaxTransforms();
}

// Auto-initialize when module is imported
if (typeof window !== 'undefined') {
  // Initialize after a brief delay to ensure DOM is ready
  setTimeout(initializeParallax, 100);
  
  // Make renderAllCDivs globally available for debugging
  window.renderAllCDivs = renderAllCDivs;
}

/**
 * Applies the calculated parallax transform to a single business card div.
 * @param {HTMLElement} bizCardDiv The element to apply the transform to.
 * @param {number} dh The horizontal displacement.
 * @param {number} dv The vertical displacement.
 */
export function applyParallaxToBizCardDiv(bizCardDiv, dh, dv) {
  if (!bizCardDiv) {
    return false; // skip null bizCardDiv
  }
  if (hasClone(bizCardDiv)) {
      console.log(`[ParallaxModule] ⏭️ Skipping ${bizCardDiv.id} - has clone (selected)`);
      return false; // Do not apply parallax to the original card if it's selected (has a clone).
  }
  const sceneZ = parseFloat(bizCardDiv.getAttribute('data-sceneZ'));
  if (isNaN(sceneZ)) {
      console.log(`[ParallaxModule] ⏭️ Skipping ${bizCardDiv.id} - no valid sceneZ`);
      return false; // Element doesn't have a valid Z position.
  }

  // The parallax effect is scaled by the card's Z position.
  let zScale = CLONE_Z_SCALE; // default for clones (no parallax)
  if (!isClone(bizCardDiv) && sceneZ > 0) {
      zScale = (MAX_Z_SCALE - ((sceneZ - zUtils.ALL_CARDS_Z_MIN - 1) / Z_RANGE));
  } else if (!isClone(bizCardDiv) && sceneZ <= 0) {
      throw new Error(`Invalid sceneZ value: ${sceneZ} for bizCardDiv: ${bizCardDiv.id}`);
  }

  // Initialize translation values
  let translateX = 0;
  let translateY = 0;
  
  // scene to viewport translation
  // const bullsEyePos = getBullsEyePosition();
  // translateX += bullsEyePos.x;
  
  // only original cDivs with zScale > 0 are subject to parallax
  translateX += dh * zScale;
  translateY += dv * zScale;
  
  const transformString = `translateX(${translateX}px) translateY(${translateY}px)`;
  bizCardDiv.style.transform = transformString;
  
  // console.log(`[ParallaxModule] ✅ Applied parallax to ${bizCardDiv.id}: zScale=${zScale.toFixed(3)}, transform=${transformString}`);
  return true;
}