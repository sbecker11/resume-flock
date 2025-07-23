import { BaseComponent } from './abstracts/BaseComponent.mjs';
import * as mathUtils from '../utils/mathUtils.mjs';
import * as viewPort from './viewPortModule.mjs';
import * as bullsEyeModule from './bullsEye.mjs';

// --- Constants ---
const EASE_FACTOR = 0.05;
export const MODES = {
  LOCKED: 'locked',
  FOLLOWING: 'following',
  DRAGGING: 'dragging'
};

class FocalPointManager extends BaseComponent {
    constructor() {
        super('FocalPointManager');
        
        // Instance state
        this.focalPoint = {
            current: { x: 0, y: 0 },
            target: { x: 0, y: 0 },
        };
        
        this.mode = MODES.LOCKED;
        this.bullsEyePosition = { x: 0, y: 0 };
        this.animationFrameId = null;
        // No more _isInitialized - BaseComponent manages this
    }

    // --- Private Methods ---

    updateBullsEyePosition() {
        // Use the centralized bullsEye module to handle positioning
        if (bullsEyeModule.isInitialized()) {
            bullsEyeModule.recenterBullsEye();
            const position = bullsEyeModule.getBullsEye();
            this.bullsEyePosition.x = position.x;
            this.bullsEyePosition.y = position.y;
        } else {
            // Fallback to viewport center
            this.bullsEyePosition.x = window.innerWidth / 2;
            this.bullsEyePosition.y = window.innerHeight / 2;
        }
        
        // Also recenter the aimPoint element directly to bullsEye position
        const aimPointElement = document.getElementById('aim-point');
        if (aimPointElement) {
            aimPointElement.style.left = `${this.bullsEyePosition.x}px`;
            aimPointElement.style.top = `${this.bullsEyePosition.y}px`;
        }
    }

    animate() {
        window.CONSOLE_LOG_IGNORE('animate called, mode:', this.mode, 'current:', this.focalPoint.current, 'target:', this.focalPoint.target);
        if (this.mode === MODES.DRAGGING) {
            this.animationFrameId = null;
            return;
        }

        if (this.mode === MODES.LOCKED) {
            // Update bullsEye position to ensure it's current
            this.updateBullsEyePosition();
            
            // Get the aim-point position (which should be at bullsEye)
            const aimPointElement = document.getElementById('aim-point');
            if (aimPointElement) {
                const aimPointRect = aimPointElement.getBoundingClientRect();
                const aimPointCenter = {
                    x: aimPointRect.left + aimPointRect.width / 2,
                    y: aimPointRect.top + aimPointRect.height / 2
                };
                this.focalPoint.target.x = aimPointCenter.x;
                this.focalPoint.target.y = aimPointCenter.y;
            } else {
                // Fallback to bullsEye position
                this.focalPoint.target.x = this.bullsEyePosition.x;
                this.focalPoint.target.y = this.bullsEyePosition.y;
            }
        }

        const distanceSq = mathUtils.getPositionsSquaredDistance(this.focalPoint.current, this.focalPoint.target);

        if (distanceSq < 0.5) {
            this.focalPoint.current.x = this.focalPoint.target.x;
            this.focalPoint.current.y = this.focalPoint.target.y;
            // Keep animating if locked or following to always track the target
            if (this.mode === MODES.LOCKED || this.mode === MODES.FOLLOWING) {
                this.animationFrameId = requestAnimationFrame(() => this.animate());
            } else {
                this.animationFrameId = null; // Stop if not locked/following and at target
            }
        } else {
            this.focalPoint.current.x += (this.focalPoint.target.x - this.focalPoint.current.x) * EASE_FACTOR;
            this.focalPoint.current.y += (this.focalPoint.target.y - this.focalPoint.current.y) * EASE_FACTOR;
            this.animationFrameId = requestAnimationFrame(() => this.animate());
            
            // Dispatch focal point changed event for parallax module
            window.dispatchEvent(new CustomEvent('focal-point-changed', {
                detail: { position: this.focalPoint.current }
            }));
        }
    }

    startAnimation() {
        if (!this.animationFrameId) {
            this.animationFrameId = requestAnimationFrame(() => this.animate());
        }
    }

    handleFocalModeChange(event) {
        if (event.detail && event.detail.mode) {
            this.setMode(event.detail.mode);
        }
    }

    handleMouseMove(event) {
        window.CONSOLE_LOG_IGNORE('handleMouseMove', event.clientX, event.clientY, this.mode);
        if (this.mode === MODES.LOCKED) return;

        const newTarget = { x: event.clientX, y: event.clientY };

        if (this.mode === MODES.DRAGGING) {
            // If dragging, move immediately without easing
            this.focalPoint.target.x = newTarget.x;
            this.focalPoint.target.y = newTarget.y;
        } else { // FOLLOWING
            this.focalPoint.target.x = newTarget.x;
            this.focalPoint.target.y = newTarget.y;
            this.startAnimation();
        }
    }

    // --- Public API ---

    getDependencies() {
        return []; // FocalPointManager is a fundamental component with no IM dependencies
    }

    async initialize(dependencies = {}) {
        // BaseComponent manages isInitialized automatically
        window.CONSOLE_LOG_IGNORE("FocalPointManager: Starting initialization");
        
        // Set up event listeners with bound methods
        this.boundHandleMouseMove = this.handleMouseMove.bind(this);
        this.boundUpdateBullsEyePosition = this.updateBullsEyePosition.bind(this);
        this.boundHandleFocalModeChange = this.handleFocalModeChange.bind(this);
        
        window.addEventListener('mousemove', this.boundHandleMouseMove);
        window.addEventListener('resize', this.boundUpdateBullsEyePosition);
        window.addEventListener('layout-changed', this.boundUpdateBullsEyePosition);
        
        // Listen for focal-point-update events from viewport resize
        window.addEventListener('focal-point-update', (event) => {
            if (event.detail && event.detail.position && this.mode === MODES.LOCKED) {
                this.focalPoint.target.x = event.detail.position.x;
                this.focalPoint.target.y = event.detail.position.y;
                this.startAnimation();
            }
        });
        
        // Listen for focal mode change events from keyboard
        window.addEventListener('focalModeChange', this.boundHandleFocalModeChange);
        
        // Listen for viewport-changed events (when bullsEye position changes)
        window.addEventListener('viewport-changed', (event) => {
            if (this.mode === MODES.LOCKED) {
                // If focal point is locked to bullsEye, update aimPoint and ease focal point
                const bullsEyeCenter = { x: event.detail.centerX, y: event.detail.centerY };
                
                // Move aimPoint to bullsEye center
                const aimPointElement = document.getElementById('aim-point');
                if (aimPointElement) {
                    aimPointElement.style.left = `${bullsEyeCenter.x}px`;
                    aimPointElement.style.top = `${bullsEyeCenter.y}px`;
                }
                
                // Immediately update focal point position to trigger parallax
                this.focalPoint.current.x = bullsEyeCenter.x;
                this.focalPoint.current.y = bullsEyeCenter.y;
                this.focalPoint.target.x = bullsEyeCenter.x;
                this.focalPoint.target.y = bullsEyeCenter.y;
                
                // Start animation for smooth transitions
                this.startAnimation();
            }
        });

        // Initialize bullsEye module if not already initialized
        if (!bullsEyeModule.isInitialized()) {
            bullsEyeModule.initialize();
        }
        
        // Initialize to locked state at center
        this.updateBullsEyePosition();
        
        // Always use viewport center for focal point
        this.focalPoint.target.x = window.innerWidth / 2;
        this.focalPoint.current.x = window.innerWidth / 2;
        this.focalPoint.target.y = window.innerHeight / 2;
        this.focalPoint.current.y = window.innerHeight / 2;
        
        this.startAnimation();
        // No manual isInitialized assignment - BaseComponent handles this
        
        window.CONSOLE_LOG_IGNORE("FocalPointManager: Initialization complete");
    }

    destroy() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
        
        // Remove event listeners
        if (this.boundHandleMouseMove) {
            window.removeEventListener('mousemove', this.boundHandleMouseMove);
        }
        if (this.boundUpdateBullsEyePosition) {
            window.removeEventListener('resize', this.boundUpdateBullsEyePosition);
            window.removeEventListener('layout-changed', this.boundUpdateBullsEyePosition);
        }
        if (this.boundHandleFocalModeChange) {
            window.removeEventListener('focalModeChange', this.boundHandleFocalModeChange);
        }
        
        // Clean up bullsEye module
        bullsEyeModule.cleanup();
        
        // BaseComponent handles isInitialized automatically
    }

    getPosition() {
        window.CONSOLE_LOG_IGNORE('getPosition called, returning:', this.focalPoint.current);
        return this.focalPoint.current;
    }

    getMode() {
        return this.mode;
    }

    setMode(newMode) {
        window.CONSOLE_LOG_IGNORE('FocalPointManager.setMode called with:', newMode, 'current mode was:', this.mode);
        this.mode = newMode;
        
        // Dispatch an event to notify listeners that the mode changed
        window.dispatchEvent(new CustomEvent('focal-point-mode-changed', { 
            detail: { mode: newMode } 
        }));
        
        // If we enter a non-dragging mode, ensure animation is running
        if (this.mode !== MODES.DRAGGING) {
            this.startAnimation();
        }
    }

    cycleMode() {
        const modes = Object.values(MODES);
        const currentIndex = modes.indexOf(this.mode);
        const nextIndex = (currentIndex + 1) % modes.length;
        window.CONSOLE_LOG_IGNORE('FocalPointManager.cycleMode: current mode:', this.mode, 'next mode:', modes[nextIndex]);
        this.setMode(modes[nextIndex]);
    }
}

// Create and export singleton instance
export const focalPointManager = new FocalPointManager();

// Export class for testing
export { FocalPointManager };

// Export legacy functions for backward compatibility
export function initialize() {
    return focalPointManager.initialize();
}

export function isInitialized() {
    return focalPointManager.isInitialized;
}

export function getPosition() {
    return focalPointManager.getPosition();
}

export function getMode() {
    return focalPointManager.getMode();
}

export function setMode(newMode) {
    return focalPointManager.setMode(newMode);
}

export function cycleMode() {
    return focalPointManager.cycleMode();
}

export function cleanup() {
    return focalPointManager.destroy();
}