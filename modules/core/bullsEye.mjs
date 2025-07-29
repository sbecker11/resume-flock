// modules/core/bullsEye.mjs
// Simple BullsEye positioning without IM framework

/**
 * Simple BullsEye positioning system
 */
class BullsEye {
    constructor() {
        this._bullsEyeElement = null;
        this._sceneContainer = null;
    }

    /**
     * Initialize with DOM elements
     */
    initialize(bullsEyeElement, sceneContainer) {
        // If called without parameters during programmatic refresh, just recenter
        if (!bullsEyeElement && !sceneContainer) {
            console.log('[BullsEye] Initialize called without parameters - recentering existing');
            this._centerBullsEye();
            return;
        }
        
        this._bullsEyeElement = bullsEyeElement;
        this._sceneContainer = sceneContainer;
        
        // Position bulls-eye at center of scene container
        this._centerBullsEye();
        
        // Listen for viewport resize events
        window.addEventListener('resize', () => {
            this._centerBullsEye();
        });
        
        // Listen for resize handle changes
        window.addEventListener('resize-handle-changed', () => {
            this._centerBullsEye();
        });
        
        // Listen for layout orientation changes
        window.addEventListener('layout-orientation-changed', () => {
            console.log('[BullsEye] layout-orientation-changed event received');
            // Use setTimeout to ensure DOM has updated after layout change
            setTimeout(() => {
                console.log('[BullsEye] Recentering after layout change');
                this._centerBullsEye();
            }, 100);
        });
        
        // Also listen for scene-force-update which happens after layout changes
        window.addEventListener('scene-force-update', () => {
            console.log('[BullsEye] scene-force-update event received');
            setTimeout(() => {
                console.log('[BullsEye] Recentering after scene-force-update');
                this._centerBullsEye();
            }, 50);
        });
        
        // Listen for programmatic soft refresh completion
        window.addEventListener('programmatic-soft-refresh-complete', () => {
            console.log('[BullsEye] programmatic-soft-refresh-complete event received');
            // Recenter after the programmatic refresh is complete
            setTimeout(() => {
                console.log('[BullsEye] Recentering after programmatic refresh');
                this._centerBullsEye();
            }, 50);
        });

        console.log('[BullsEye] Simple initialization complete');
    }

    _centerBullsEye() {
        if (!this._bullsEyeElement || !this._sceneContainer) {
            console.log('[BullsEye] Cannot center - missing elements:', {
                bullsEyeElement: !!this._bullsEyeElement,
                sceneContainer: !!this._sceneContainer
            });
            return;
        }

        const rect = this._sceneContainer.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        console.log('[BullsEye] Centering bulls-eye:', {
            rect: { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
            center: { x: centerX, y: centerY }
        });

        this._bullsEyeElement.style.position = 'fixed';
        this._bullsEyeElement.style.left = `${centerX}px`;
        this._bullsEyeElement.style.top = `${centerY}px`;
        this._bullsEyeElement.style.transform = 'translate(-50%, -50%)';
        this._bullsEyeElement.style.zIndex = '98';
        this._bullsEyeElement.style.pointerEvents = 'none';

        // Dispatch event for other components
        window.dispatchEvent(new CustomEvent('bulls-eye-moved', {
            detail: { position: { x: centerX, y: centerY } }
        }));
    }

    getPosition() {
        if (!this._bullsEyeElement) return { x: 0, y: 0 };
        
        // Return the same coordinate system used for positioning
        // Parse the left/top values that were set during _centerBullsEye()
        const left = parseFloat(this._bullsEyeElement.style.left) || 0;
        const top = parseFloat(this._bullsEyeElement.style.top) || 0;
        
        return {
            x: left,
            y: top
        };
    }

    recenter() {
        this._centerBullsEye();
    }

    isReady() {
        return this._bullsEyeElement !== null && this._sceneContainer !== null;
    }

    getBullsEyeElement() {
        return this._bullsEyeElement;
    }

    cleanup() {
        console.log('[BullsEye] Cleanup called - preserving element references for reinitialization');
        // Don't clear element references during cleanup since they're still valid DOM elements
        // Just recenter in case layout changed
        this._centerBullsEye();
    }
}

// Create and export singleton
export const bullsEye = new BullsEye();
export default bullsEye;

// Make available globally for backwards compatibility
if (typeof window !== 'undefined') {
    window.bullsEye = bullsEye;
}