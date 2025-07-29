import { AppState, saveState } from './stateManager.mjs';
import { jobs } from '../../static_content/jobs/jobs.mjs';

// Simple selection manager without IM framework
class SelectionManager {
    constructor() {
        this.eventTarget = new EventTarget();
        this.selectedJobNumber = null;
        this.hoveredJobNumber = null;
        
        // Load initial selection from AppState
        this.loadInitialSelection();
    }

    loadInitialSelection() {
        if (AppState && AppState.selectedJobNumber !== null) {
            this.selectedJobNumber = AppState.selectedJobNumber;
        }
    }

    selectJobNumber(jobNumber) {
        const previousSelection = this.selectedJobNumber;
        this.selectedJobNumber = jobNumber;
        
        // Fetch dataJobObject using jobNumber
        const dataJobObject = this.getJobDataByNumber(jobNumber);
        
        // Update AppState
        if (AppState) {
            AppState.selectedJobNumber = jobNumber;
            AppState.lastVisitedJobNumber = jobNumber;
            saveState(AppState);
        }

        // Dispatch selection event
        this.eventTarget.dispatchEvent(new CustomEvent('job-selected', {
            detail: { 
                jobNumber, 
                dataJobObject,
                previousSelection,
                source: 'SelectionManager'
            }
        }));

        console.log(`[SelectionManager] Job ${jobNumber} selected:`, dataJobObject?.employer || 'Unknown');
    }

    clearSelection() {
        const previousSelection = this.selectedJobNumber;
        this.selectedJobNumber = null;
        
        // Update AppState
        if (AppState) {
            AppState.selectedJobNumber = null;
            saveState(AppState);
        }

        // Dispatch clear event
        this.eventTarget.dispatchEvent(new CustomEvent('selection-cleared', {
            detail: { previousSelection }
        }));

        console.log('[SelectionManager] Selection cleared');
    }

    getSelectedJobNumber() {
        return this.selectedJobNumber;
    }

    getJobDataByNumber(jobNumber) {
        if (jobNumber === null || jobNumber === undefined) {
            return null;
        }
        
        // Jobs array is 0-indexed, jobNumber should match the array index
        if (jobNumber >= 0 && jobNumber < jobs.length) {
            return jobs[jobNumber];
        }
        
        console.warn(`[SelectionManager] Job number ${jobNumber} out of range (0-${jobs.length - 1})`);
        return null;
    }

    setHoveredJobNumber(jobNumber) {
        this.hoveredJobNumber = jobNumber;
        
        // Dispatch hover event
        this.eventTarget.dispatchEvent(new CustomEvent('job-hovered', {
            detail: { jobNumber }
        }));
    }

    getHoveredJobNumber() {
        return this.hoveredJobNumber;
    }

    addEventListener(type, listener) {
        this.eventTarget.addEventListener(type, listener);
    }

    removeEventListener(type, listener) {
        this.eventTarget.removeEventListener(type, listener);
    }
}

// Create and export singleton
export const selectionManager = new SelectionManager();
export default selectionManager;