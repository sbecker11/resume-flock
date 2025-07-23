///modules/core/aimPoint.mjs

import { BaseComponent } from './abstracts/BaseComponent.mjs';
import { initializationManager } from './initializationManager.mjs';
import * as mathUtils from '../utils/mathUtils.mjs';
import * as viewPort from './viewPortModule.mjs';

/**
 * AimPoint - Manages the aim-point element and coordinates with BullsEye
 * Depends on BullsEye to ensure bulls-eye element is ready
 */
class AimPoint extends BaseComponent {
    constructor() {
        super('AimPoint');
        this._aimPointElement = null;
        this._aimPointPosition = null;
        this._lastAimPointPosition = { x: 0, y: 0 };
        this._status = "STOPPED";
    }

    getDependencies() {
        return ['BullsEye']; // Wait for BullsEye to be ready
    }

    getPriority() {
        return 'medium'; // Initialize after BullsEye
    }

    async initialize(dependencies = {}) {
        window.CONSOLE_LOG_IGNORE('[AimPoint] Initializing with BullsEye dependency...');
        
        // Initialize viewPort module (legacy module that doesn't use IM)
        await viewPort.initialize();
        
        // Get BullsEye from service locator
        this.bullsEye = initializationManager.getComponent('BullsEye');
        if (!this.bullsEye) {
            throw new Error('[AimPoint] BullsEye not available from service locator');
        }

        // Get aim-point DOM element
        this._aimPointElement = document.getElementById("aim-point");
        if (!this._aimPointElement) {
            throw new Error("[AimPoint] #aim-point element not found in DOM");
        }

        // Set initial position to BullsEye center
        const initialPosition = this._getBullsEyePosition();
        if (initialPosition) {
            this._setAimPoint(initialPosition, "AimPoint.initialize");
        }
        
        window.CONSOLE_LOG_IGNORE('[AimPoint] Initialization complete');
    }

    destroy() {
        this._aimPointElement = null;
        this._aimPointPosition = null;
        this.bullsEye = null;
    }

    // Public API methods
    isReady() {
        return this._aimPointElement !== null;
    }

    getAimPointElement() {
        return this._aimPointElement;
    }

    getAimPoint() {
        if (!this._aimPointElement) return { x: 0, y: 0 };
        return {
            x: parseFloat(this._aimPointElement.style.left || 0), 
            y: parseFloat(this._aimPointElement.style.top || 0) 
        };
    }

    setAimPoint(position, caller = '') {
        return this._setAimPoint(position, caller);
    }

    getAimPointStatus() {
        return this._status;
    }

    setAimPointStatus(status) {
        this._status = status;
    }

    _getBullsEyePosition() {
        // Use service locator to get BullsEye component instead of direct DOM access
        if (this.bullsEye && this.bullsEye.isReady()) {
            const bullsEyeElement = this.bullsEye.getBullsEyeElement();
            if (bullsEyeElement) {
                const rect = bullsEyeElement.getBoundingClientRect();
                return {
                    x: rect.left + rect.width / 2,
                    y: rect.top + rect.height / 2
                };
            }
        }
        // Fallback to viewport center
        return viewPort.getViewPortOrigin();
    }

    _setAimPoint(position, caller = "") {
        if (!position) throw new Error("setAimPoint: position is null");
        if (!this._aimPointElement) return;

        // Use bullsEye position if position is the viewport center
        let targetPosition = position;
        if (position === viewPort.getViewPortOrigin()) {
            targetPosition = this._getBullsEyePosition();
        }

        // Skip move if move is too small
        const squaredDist = mathUtils.getPositionsSquaredDistance(targetPosition, this._lastAimPointPosition);
        this._lastAimPointPosition = targetPosition;
        if (squaredDist < 0.25) { // 0.50 squared
            this.setAimPointStatus("PAUSED");
            return;
        } else {
            if (this.getAimPointStatus() === "PAUSED") {
                this.setAimPointStatus("RUNNING");
            }
        }

        this._aimPointElement.style.left = `${targetPosition.x}px`;
        this._aimPointElement.style.top = `${targetPosition.y}px`;
        if (this._aimPointElement.classList.contains('hidden')) {
            this._aimPointElement.classList.remove('hidden');
        }
        if (caller !== "") {
            //window.CONSOLE_LOG_IGNORE(`setAimPoint:${caller}`, targetPosition);
        }
    }
}

// Create singleton instance - this will auto-register with InitializationManager
const aimPoint = new AimPoint();

// Export the instance for service locator access
export { aimPoint };
export default aimPoint;

// Backward compatibility functions for existing code
export function isInitialized() {
    return aimPoint.isReady();
}

export function initialize() {
    console.warn('[AimPoint] initialize() is deprecated. Use initializationManager.getComponent("AimPoint") instead');
    return Promise.resolve();
}

export function setAimPoint(position, caller = '') {
    return aimPoint.setAimPoint(position, caller);
}

export function getAimPoint() {
    return aimPoint.getAimPoint();
}

export function getAimPointElement() {
    return aimPoint.getAimPointElement();
}

export function getAimPointStatus() {
    return aimPoint.getAimPointStatus();
}

export function setAimPointStatus(status) {
    return aimPoint.setAimPointStatus(status);
}