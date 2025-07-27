// modules/resize/resizeHandler.mjs

import { BaseComponent } from '../core/abstracts/BaseComponent.mjs';
import { initializationManager } from '../core/initializationManager.mjs';

// Simple debounce implementation
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * ResizeHandler - Manages window resize events and coordinates layout updates
 * Depends on SceneContainer and BullsEye to properly handle container resizing
 */
class ResizeHandler extends BaseComponent {
    constructor() {
        super('ResizeHandler');
        this._debouncedResize = null;
        this._isListening = false;
    }

    getDependencies() {
        return []; // No dependencies - base component
    }

    getPriority() {
        return 'high'; // High priority - foundation component that others depend on
    }

    async initialize(dependencies = {}) {
        window.CONSOLE_LOG_IGNORE('[ResizeHandler] Initializing resize handling...');
        
        // Create debounced resize handler
        this._debouncedResize = debounce(this._handleResize.bind(this), 100);
        
        // Add event listener to the window
        window.addEventListener('resize', this._debouncedResize);
        this._isListening = true;
        
        window.CONSOLE_LOG_IGNORE('[ResizeHandler] Resize handler initialized');
    }

    _handleResize() {
        window.CONSOLE_LOG_IGNORE('[ResizeHandler] Resize event triggered');

        // Dispatch custom event for other components to handle resize
        window.dispatchEvent(new CustomEvent('viewport-resize', {
            detail: { source: 'ResizeHandler' }
        }));
    }

    destroy() {
        if (this._isListening && this._debouncedResize) {
            window.removeEventListener('resize', this._debouncedResize);
            this._isListening = false;
        }
        this._debouncedResize = null;
    }

    // Public API
    isListening() {
        return this._isListening;
    }
}

// Create singleton instance
const resizeHandler = new ResizeHandler();

// Export the instance for service locator access
export { resizeHandler };

// Backward compatibility
export const handleResize = () => {
    const handler = initializationManager.getComponent('ResizeHandler');
    if (handler) {
        handler._handleResize();
    }
}; 