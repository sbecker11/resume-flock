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

export function initializeParallax() {
  updateSceneContainerRect();
  
  // Listen for viewport changes
  window.addEventListener('viewport-changed', updateSceneContainerRect);
  window.addEventListener('focal-point-changed', handleFocalPointChanged);
  
  console.log('ParallaxModule initialized');
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

function handleFocalPointChanged() {
  const { dh, dv } = calculateParallaxDisplacements();
  const bizCardDivs = document.getElementsByClassName('biz-card-div');
  
  for (const bizCardDiv of bizCardDivs) {
    applyParallaxToBizCardDiv(bizCardDiv, dh, dv);
  }
}

function calculateParallaxDisplacements() {
  // Simple viewport origin calculation
  const viewportOriginX = window.innerWidth / 2;
  const viewportOriginY = window.innerHeight / 2;
  
  // Get focal point position
  let focalPointX = window.innerWidth / 2;
  let focalPointY = window.innerHeight / 2;
  
  // Try to get actual focal point position if available
  if (window.focalPoint && window.focalPoint.x && window.focalPoint.y) {
    focalPointX = window.focalPoint.x.value || focalPointX;
    focalPointY = window.focalPoint.y.value || focalPointY;
  }
  
  const dh = (viewportOriginX - focalPointX) * PARALLAX_X_EXAGGERATION_FACTOR;
  const dv = (viewportOriginY - focalPointY) * PARALLAX_Y_EXAGGERATION_FACTOR;
  
  return { dh, dv };
}

export function applyParallaxToBizCardDiv(bizCardDiv, dh, dv) {
  if (!bizCardDiv) return;
  
  const sceneZ = parseFloat(bizCardDiv.getAttribute('data-sceneZ')) || 15;
  const parallaxX = dh * (sceneZ / 15); // Normalize by default Z
  const parallaxY = dv * (sceneZ / 15);
  
  // Apply transform
  bizCardDiv.style.transform = `translate(${parallaxX}px, ${parallaxY}px)`;
}

function refreshAllParallaxTransforms() {
  requestAnimationFrame(() => {
    const { dh, dv } = calculateParallaxDisplacements();
    const bizCardDivs = document.getElementsByClassName('biz-card-div');
    
    for (const bizCardDiv of bizCardDivs) {
      applyParallaxToBizCardDiv(bizCardDiv, dh, dv);
    }
  });
}

// Auto-initialize when module is imported
if (typeof window !== 'undefined') {
  // Initialize after a brief delay to ensure DOM is ready
  setTimeout(initializeParallax, 100);
}