/**
 * TimelineManager - IM component that manages timeline state and initialization
 * Replaces the useTimeline composable for timeline data management
 */

import { BaseComponent } from './abstracts/BaseComponent.mjs';
import { ref, computed } from 'vue';
import * as dateUtils from '../utils/dateUtils.mjs';
import { linearInterp } from '../utils/mathUtils.mjs';

// --- Constants ---
const YEAR_HEIGHT = 200; // The height in pixels for one year on the timeline
const TIMELINE_PADDING_TOP = 0; // No top padding - scene plane will handle alignment

class TimelineManager extends BaseComponent {
    constructor() {
        super('TimelineManager');
        
        // --- Reactive State ---
        this.isTimelineInitialized = ref(false);
        this.startYear = ref(0);
        this.endYear = ref(0);
        this.timelineHeight = ref(0);
        
        // Store the singleton instance
        TimelineManager.instance = this;
    }

    getPriority() {
        return 'high'; // Must initialize after JobsDataManager but before CardsController
    }

    async initialize({ JobsDataManager }) {
        console.log('[TimelineManager] Initializing with JobsDataManager...');
        
        this.jobsDataManager = JobsDataManager;
        
        // Validate dependencies
        if (!this.jobsDataManager) {
            throw new Error('[TimelineManager] JobsDataManager dependency not provided');
        }
        
        // Get jobs data and initialize timeline
        const jobsData = this.jobsDataManager.getAllJobs();
        this._initializeTimelineWithData(jobsData);
        
        // isInitialized is managed by BaseComponent
        console.log('[TimelineManager] Successfully initialized');
    }
    
    destroy() {
        this.isTimelineInitialized.value = false;
        this.startYear.value = 0;
        this.endYear.value = 0;
        this.timelineHeight.value = 0;
        this.jobsDataManager = null;
        // isInitialized is managed by BaseComponent
        TimelineManager.instance = null;
    }

    _initializeTimelineWithData(jobsData) {
        if (this.isTimelineInitialized.value) return; // Already initialized
        if (!jobsData) {
            console.error('[TimelineManager] Timeline initialization failed: jobsData not provided.');
            return;
        }

        // Self-initializing timeline: analyze jobs data to determine bounds
        // Min: Earliest job start date - 1 year  
        // Max: Today + 1 year
        
        let earliestStartDate = null;
        jobsData.forEach(job => {
            try {
                const startDate = dateUtils.parseFlexibleDateString(job.start);
                if (!earliestStartDate || startDate < earliestStartDate) {
                    earliestStartDate = startDate;
                }
            } catch (error) {
                console.warn('Error parsing job start date:', job.start, error);
            }
        });
        
        if (!earliestStartDate) {
            console.error('[TimelineManager] No valid job start dates found');
            return;
        }
        
        // Timeline start: Earliest job - 1 year (preserve month/day)
        const timelineStartDate = new Date(earliestStartDate);
        timelineStartDate.setFullYear(timelineStartDate.getFullYear() - 1);
        
        // Timeline end: Today + 1 year (preserve month/day) 
        const today = new Date();
        const timelineEndDate = new Date(today);
        timelineEndDate.setFullYear(timelineEndDate.getFullYear() + 1);
        
        // Calculate year range
        this.startYear.value = timelineStartDate.getFullYear();
        this.endYear.value = timelineEndDate.getFullYear();
        
        // Calculate timeline height
        const yearRange = this.endYear.value - this.startYear.value;
        this.timelineHeight.value = TIMELINE_PADDING_TOP + (yearRange * YEAR_HEIGHT);
        
        this.isTimelineInitialized.value = true;
        
        console.log(`[TimelineManager] Timeline initialized:`);
        console.log(`  Start year: ${this.startYear.value}`);
        console.log(`  End year: ${this.endYear.value}`);
        console.log(`  Height: ${this.timelineHeight.value}px`);
        console.log(`  Year range: ${yearRange} years`);
    }

    // Public API Methods

    // isInitialized is handled by BaseComponent - no need for custom getter

    /**
     * Get position for a given date
     * @param {Date} date - The date to get position for
     * @returns {number} Y position in pixels
     */
    getPositionForDate(date) {
        if (!this.isTimelineInitialized.value) {
            console.warn('[TimelineManager] getPositionForDate called before initialization');
            return 0;
        }

        const startDate = new Date(this.startYear.value, 0, 1);
        const endDate = new Date(this.endYear.value, 11, 31);
        
        // Get position using linear interpolation
        const startTime = startDate.getTime();
        const endTime = endDate.getTime();
        const targetTime = date.getTime();
        
        // Calculate position (0 at top, increasing downward)
        const position = linearInterp(targetTime, startTime, endTime, TIMELINE_PADDING_TOP, this.timelineHeight.value - TIMELINE_PADDING_TOP);
        
        return Math.max(TIMELINE_PADDING_TOP, Math.min(this.timelineHeight.value, position));
    }

    /**
     * Get reactive timeline state for Vue components
     * This maintains compatibility with the original useTimeline composable
     */
    getTimelineState() {
        return {
            isInitialized: this.isTimelineInitialized,
            startYear: this.startYear,
            endYear: this.endYear,
            timelineHeight: this.timelineHeight,
            getPositionForDate: this.getPositionForDate.bind(this)
        };
    }

    /**
     * Get timeline bounds
     */
    getBounds() {
        return {
            startYear: this.startYear.value,
            endYear: this.endYear.value,
            height: this.timelineHeight.value
        };
    }

}

// Create and export singleton instance
export const timelineManager = new TimelineManager();

// Export class for testing
export { TimelineManager };