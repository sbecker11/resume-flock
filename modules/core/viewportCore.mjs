/**
 * ViewportCore - Pure DOM operations and viewport calculations
 * Handles scene container measurements, resize observers, and viewport property calculations
 * No Vue reactivity - provides clean data for Manager components to wrap
 */

import { BaseComponent } from './abstracts/BaseComponent.mjs';

// --- Constants ---
const VIEWPORT_PADDING = 100;

export class ViewportCore extends BaseComponent {
  constructor() {
    super('ViewportCore');
    this.sceneContainer = null;
    this.resizeObserver = null;
    
    // Pure data properties (no Vue reactivity)
    this.viewportProperties = {
      padding: VIEWPORT_PADDING,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      centerX: 0,
      centerY: 0,
      width: 0,
      height: 0
    };
  }

  getDependencies() {
    return ['SceneContainer']; // Only depends on SceneContainer
  }

  getPriority() {
    return 'high'; // Must be ready before other components need viewport calculations
  }

  initialize(dependencies) {
    this.sceneContainer = dependencies.SceneContainer;
    console.log('[ViewportCore] Initialized with SceneContainer dependency - DOM operations moved to setupDom()');
  }

  /**
   * DOM setup phase - called after Vue DOM is ready
   * Handles all DOM-related operations for viewport calculations
   */
  async setupDom() {
    console.log('[ViewportCore] DOM setup phase - setting up viewport calculations...');
    
    // Initial calculation
    this.updateViewportProperties();

    // Listen for window resize
    window.addEventListener('resize', () => this.updateViewportProperties());

    // Add ResizeObserver for scene container
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        window.CONSOLE_LOG_IGNORE('Scene container resized, updating viewport...');
        this.updateViewportProperties();
      });
      this.resizeObserver.observe(this.sceneContainer.getSceneContainer());
    }
    
    console.log('[ViewportCore] DOM setup complete');
  }

  /**
   * Core viewport calculation logic
   * Updates viewportProperties with current DOM measurements
   */
  updateViewportProperties() {
    if (!this.sceneContainer) return;

    const sceneElement = this.sceneContainer.getSceneContainer();
    const sceneContainerRect = sceneElement.getBoundingClientRect();
    const sceneWidth = sceneElement.offsetWidth;
    const viewPortWidth = sceneWidth;
    const viewPortLeft = 0;
    const viewPortHeight = sceneContainerRect.height;
    const viewPortTop = sceneContainerRect.top;

    const newCenterX = sceneContainerRect.left + sceneContainerRect.width / 2;
    const newCenterY = sceneContainerRect.top + sceneContainerRect.height / 2;
    
    window.CONSOLE_LOG_IGNORE('updateViewportProperties: viewPortWidth:', viewPortWidth, 'viewPortHeight:', viewPortHeight, 'centerX:', newCenterX, 'centerY:', newCenterY);
    
    // Update pure data properties
    this.viewportProperties = {
      padding: VIEWPORT_PADDING,
      top: viewPortTop,
      left: viewPortLeft,
      right: viewPortLeft + viewPortWidth,
      bottom: viewPortTop + viewPortHeight,
      centerX: newCenterX,
      centerY: newCenterY,
      width: viewPortWidth,
      height: viewPortHeight
    };

    // Dispatch event for other components that need viewport updates
    window.dispatchEvent(new CustomEvent('viewport-resize', {
      detail: this.viewportProperties
    }));
  }

  /**
   * Get current viewport properties
   * @returns {Object} Current viewport measurements
   */
  getViewportProperties() {
    return { ...this.viewportProperties }; // Return copy to prevent mutations
  }

  /**
   * Get specific viewport property
   * @param {string} property - Property name (centerX, centerY, width, height, etc.)
   * @returns {*} Property value
   */
  getViewportProperty(property) {
    return this.viewportProperties[property];
  }

  /**
   * Check if viewport is ready (has valid dimensions)
   * @returns {boolean} True if viewport has been calculated
   */
  isViewportReady() {
    return this.viewportProperties.width > 0 && this.viewportProperties.height > 0;
  }

  destroy() {
    // Clean up resize observer
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    // Remove window event listener
    window.removeEventListener('resize', () => this.updateViewportProperties());
    
    console.log('[ViewportCore] Cleanup complete');
  }
}

// Create and register singleton instance
export const viewportCore = new ViewportCore();