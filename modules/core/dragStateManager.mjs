/**
 * Drag State Manager
 * 
 * Manages global drag state to suspend expensive calculations during resize handle operations.
 * This prevents janky, non-fluid resize handle movement by deferring rDiv recalculations
 * until drag operations complete.
 */

class DragStateManager {
    constructor() {
        this.isDragging = false
        this.pendingCalculations = new Set()
        this.listeners = []
    }

    /**
     * Start drag mode - suspends expensive calculations
     * @param {string} source - Source identifier for debugging
     */
    startDrag(source = 'unknown') {
        this.isDragging = true
        console.log(`🎯 [DragState] Started dragging from ${source} - suspending calculations`)
        this.notifyListeners('dragStart', { source })
    }

    /**
     * End drag mode - resumes calculations and processes pending ones
     * @param {string} source - Source identifier for debugging
     */
    endDrag(source = 'unknown') {
        if (!this.isDragging) return
        
        this.isDragging = false
        console.log(`🎯 [DragState] Ended dragging from ${source} - resuming calculations`)
        
        // Process any pending calculations
        if (this.pendingCalculations.size > 0) {
            console.log(`🎯 [DragState] Processing ${this.pendingCalculations.size} pending calculations`)
            
            // Execute pending calculations after a brief delay to allow UI to settle
            setTimeout(() => {
                this.pendingCalculations.forEach(calculation => {
                    try {
                        calculation()
                    } catch (error) {
                        console.error('[DragState] Error executing pending calculation:', error)
                        throw error
                    }
                })
                this.pendingCalculations.clear()
                console.log(`🎯 [DragState] Completed all pending calculations`)
            }, 50)
        }
        
        this.notifyListeners('dragEnd', { source })
    }

    /**
     * Check if currently dragging
     * @returns {boolean} True if dragging is active
     */
    get dragging() {
        return this.isDragging
    }

    /**
     * Conditionally execute expensive calculation - suspend during drag, defer if needed
     * @param {Function} calculation - Function to execute
     * @param {string} id - Unique identifier for this calculation type
     * @returns {boolean} True if executed immediately, false if deferred
     */
    executeOrDefer(calculation, id = 'unknown') {
        if (!this.isDragging) {
            // Not dragging - execute immediately
            calculation()
            return true
        } else {
            // Dragging - defer calculation
            console.log(`🎯 [DragState] Deferring calculation: ${id}`)
            this.pendingCalculations.add(calculation)
            return false
        }
    }

    /**
     * Add listener for drag state changes
     * @param {Function} listener - Callback function (event, data) => void
     */
    addListener(listener) {
        this.listeners.push(listener)
    }

    /**
     * Remove listener
     * @param {Function} listener - Callback function to remove
     */
    removeListener(listener) {
        const index = this.listeners.indexOf(listener)
        if (index > -1) {
            this.listeners.splice(index, 1)
        }
    }

    /**
     * Notify all listeners of drag state changes
     * @private
     */
    notifyListeners(event, data) {
        this.listeners.forEach(listener => {
            try {
                listener(event, data)
            } catch (error) {
                console.error('[DragState] Error in listener:', error)
                throw error
            }
        })
    }

    /**
     * Clear all pending calculations (useful for cleanup)
     */
    clearPending() {
        this.pendingCalculations.clear()
        console.log(`🎯 [DragState] Cleared all pending calculations`)
    }
}

// Create singleton instance
export const dragStateManager = new DragStateManager()

// Global access for debugging
if (typeof window !== 'undefined') {
    window.resizeHandleDragStateManager = dragStateManager
}