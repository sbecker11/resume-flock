/**
 * Module: parallax
 * Simple parallax effects without IM framework
 */
import * as zUtils from '../utils/zUtils.mjs';
import * as mathUtils from '../utils/mathUtils.mjs';
import { selectionManager } from './selectionManager.mjs';

export const TEST_PARALLAX = false;
export const EPSILON = 0.01;
// Parallax constants
export const PARALLAX_X_EXAGGERATION_FACTOR = 0.9;
export const PARALLAX_Y_EXAGGERATION_FACTOR = 1.0;

// Simple parallax functions
let sceneContainerRect = { left: 0, top: 0, width: 0, height: 0 };
let viewportManager = null;

// Track previous displacement values for change detection
let previousDisplacements = { dh: null, dv: null };

export function initializeParallax() {
  updateSceneContainerRect();
  
  // Listen for viewport changes
  window.addEventListener('viewport-changed', updateSceneContainerRect);
  window.addEventListener('focal-point-changed', handleFocalPointChanged);
  
  // Listen for resize handle changes
  window.addEventListener('resize-handle-changed', () => {
    renderAllCDivs();
  });
  
  // Listen for window resize
  window.addEventListener('resize', () => {
    updateSceneContainerRect();
    renderAllCDivs();
  });
  
  // Listen for layout orientation changes
  window.addEventListener('layout-orientation-changed', () => {
    setTimeout(() => {
      updateSceneContainerRect();
      renderAllCDivs();
    }, 100);
  });
  
  // Listen for bullsEye changes (when bullsEye recenters)
  window.addEventListener('bullseye-recentered', () => {
    renderAllCDivs();
  });
  
}

function updateSceneContainerRect() {
  const sceneContainer = document.getElementById('scene-container');
  if (sceneContainer) {
    const rect = sceneContainer.getBoundingClientRect();
    sceneContainerRect = {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height
    };
    refreshAllParallaxTransforms();
  }
}

function handleFocalPointChanged(event) {
  renderAllCDivs();
}

function calculateParallaxDisplacements() {
  // Use bullsEye position as viewport origin if available, otherwise use window center
  let viewportOriginX = window.innerWidth / 2;
  let viewportOriginY = window.innerHeight / 2;
  
  // Try to get bullsEye position if available
  if (window.bullsEye && window.bullsEye.getPosition) {
    try {
      const bullsEyePos = window.bullsEye.getPosition();
      if (bullsEyePos && bullsEyePos.x && bullsEyePos.y) {
        viewportOriginX = bullsEyePos.x;
        viewportOriginY = bullsEyePos.y;
      }
    } catch (error) {
      console.warn('[ParallaxModule] Could not get bullsEye position:', error);
    }
  }
  
  // Get focal point position
  let focalPointX = viewportOriginX; // Default to viewport origin
  let focalPointY = viewportOriginY;
  
  // Try to get actual focal point position if available
  if (window.focalPoint && window.focalPoint.x && window.focalPoint.y) {
    focalPointX = window.focalPoint.x.value || focalPointX;
    focalPointY = window.focalPoint.y.value || focalPointY;
  }
  
  const dh = (viewportOriginX - focalPointX) * PARALLAX_X_EXAGGERATION_FACTOR;
  const dv = (viewportOriginY - focalPointY) * PARALLAX_Y_EXAGGERATION_FACTOR;
  
  console.log(`dh: ${dh.toFixed(1)}, dv: ${dv.toFixed(1)}`);
  
  // Log displacement changes only when they differ from previous values
  // if (previousDisplacements.dh !== dh || previousDisplacements.dv !== dv) {
  //   const dhChange = previousDisplacements.dh !== null ? (dh - previousDisplacements.dh).toFixed(2) : 'initial';
  //   const dvChange = previousDisplacements.dv !== null ? (dv - previousDisplacements.dv).toFixed(2) : 'initial';
  //   
  //   console.log('[ParallaxModule] Displacement changed:', {
  //     dh: dh.toFixed(2),
  //     dv: dv.toFixed(2),
  //     dhChange: dhChange,
  //     dvChange: dvChange
  //   });
  // }
  
  // Update previous values
  previousDisplacements.dh = dh;
  previousDisplacements.dv = dv;
  
  return { dh, dv };
}

export function applyParallaxToBizCardDiv(bizCardDiv, dh, dv) {
  if (!bizCardDiv) {
    console.warn('[ParallaxModule] applyParallaxToBizCardDiv called with null bizCardDiv');
    return;
  }
  
  const sceneZ = parseFloat(bizCardDiv.getAttribute('data-sceneZ')) || 15;
  const parallaxX = dh * (sceneZ / 15); // Normalize by default Z
  const parallaxY = dv * (sceneZ / 15);
  
  // Apply transform
  const transformValue = `translate(${parallaxX}px, ${parallaxY}px)`;
  bizCardDiv.style.transform = transformValue;
  
}

function refreshAllParallaxTransforms() {
  requestAnimationFrame(() => {
    const { dh, dv } = calculateParallaxDisplacements();
    const bizCardDivs = document.getElementsByClassName('biz-card-div');
    
    // Reduced logging
    
    for (const bizCardDiv of bizCardDivs) {
      applyParallaxToBizCardDiv(bizCardDiv, dh, dv);
    }
  });
}

// Comprehensive renderAllCDivs function that responds to all viewport changes
export function renderAllCDivs() {
  // console.log('[ParallaxModule] renderAllCDivs called - refreshing all parallax transforms');
  refreshAllParallaxTransforms();
}

// Auto-initialize when module is imported
if (typeof window !== 'undefined') {
  // Initialize after a brief delay to ensure DOM is ready
  setTimeout(initializeParallax, 100);
  
  // Make renderAllCDivs globally available for debugging
  window.renderAllCDivs = renderAllCDivs;
}