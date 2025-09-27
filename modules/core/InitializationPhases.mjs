/**
 * Simple Initialization Phase Gates
 * 
 * Reliable, simple approach to prevent "call before init" problems
 * without complex dependency injection containers.
 */

class InitializationPhases {
    constructor() {
        this.phases = {
            'CORE_READY': false,      // AppState, ElementRegistry
            'SERVICES_READY': false,  // ColorPalette, SelectionManager  
            'CONTROLLERS_READY': false, // CardsController, ResumeController
            'DOM_READY': false        // All DOM elements registered
        };
        
        this.subscribers = {};
    }

    /**
     * Mark a phase as complete
     */
    markPhaseComplete(phaseName) {
        if (!this.phases.hasOwnProperty(phaseName)) {
            throw new Error(`Unknown phase: ${phaseName}`);
        }
        
        this.phases[phaseName] = true;
        console.log(`[InitPhases] ✅ Phase complete: ${phaseName}`);
        
        // Notify subscribers
        if (this.subscribers[phaseName]) {
            this.subscribers[phaseName].forEach(callback => callback());
        }
    }

    /**
     * Require a phase to be complete (FAIL FAST if not)
     */
    requirePhase(phaseName, context = 'Unknown') {
        if (!this.phases[phaseName]) {
            throw new Error(`[InitPhases] FAIL FAST: ${context} requires ${phaseName} to be complete, but it's not ready yet.`);
        }
    }

    /**
     * Wait for a phase to complete (returns Promise)
     */
    waitForPhase(phaseName) {
        if (this.phases[phaseName]) {
            return Promise.resolve();
        }

        return new Promise((resolve) => {
            if (!this.subscribers[phaseName]) {
                this.subscribers[phaseName] = [];
            }
            this.subscribers[phaseName].push(resolve);
        });
    }

    /**
     * Check if phase is ready (non-throwing)
     */
    isPhaseReady(phaseName) {
        return this.phases[phaseName] || false;
    }

    /**
     * Get current status
     */
    getStatus() {
        return { ...this.phases };
    }
}

// Global singleton
export const initPhases = new InitializationPhases();
