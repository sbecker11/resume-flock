// modules/resume/resumeSystemInitializer.mjs

import { resumeListController } from './ResumeListController.mjs';
import { resumeItemsController } from '../scene/ResumeItemsController.mjs';
import { selectionManager } from '../core/selectionManager.mjs';
import { jobs } from '../../static_content/jobs/jobs.mjs';

/**
 * Create basic resume divs without CardsController dependency
 * This is a temporary solution to get the resume system working with Vue composables
 */
async function createBasicResumeDivs(resumeListController, resumeItemsController) {
    console.log('[ResumeSystemInitializer] Creating basic resume divs from jobs data...');
    
    try {
        // Create mock bizCardDivs from jobs data
        const mockBizCardDivs = jobs.map((job, index) => {
            const mockDiv = document.createElement('div');
            mockDiv.setAttribute('data-job-number', index.toString());
            mockDiv.setAttribute('data-color-index', (index % 10).toString()); // Simple color cycling
            return mockDiv;
        });
        
        console.log(`[ResumeSystemInitializer] Created ${mockBizCardDivs.length} mock card divs`);
        
        // Use ResumeItemsController to create resume divs
        const resumeDivs = await resumeItemsController.createAllBizResumeDivs(mockBizCardDivs);
        console.log(`[ResumeSystemInitializer] Created ${resumeDivs.length} resume divs`);
        
        // Add the resume divs to the DOM
        const resumeContentDiv = resumeListController.resumeContentDiv;
        if (resumeContentDiv && resumeDivs.length > 0) {
            resumeDivs.forEach((div, index) => {
                if (div instanceof Node) {
                    resumeContentDiv.appendChild(div);
                } else {
                    console.error(`[ResumeSystemInitializer] Resume div ${index} is not a Node:`, div);
                }
            });
            
            console.log(`[ResumeSystemInitializer] Added ${resumeDivs.length} resume divs to DOM`);
            
            // Store the divs in the controllers
            resumeListController.bizResumeDivs = resumeDivs;
            resumeItemsController.bizResumeDivs = resumeDivs;
            
            // Initialize the sort indices
            resumeListController.sortedIndices = Array.from({length: jobs.length}, (_, i) => i);
            
            // Setup infinite scrolling - this is crucial for scrollability!
            console.log('[ResumeSystemInitializer] Setting up infinite scrolling...');
            console.log(`[ResumeSystemInitializer] About to setup infinite scrolling with ${resumeDivs.length} resume divs`);
            console.log(`[ResumeSystemInitializer] Jobs array length: ${jobs.length}`);
            resumeListController.setupInfiniteScrolling();
            
            return true;
        } else {
            console.error('[ResumeSystemInitializer] resumeContentDiv not available or no resume divs created');
            return false;
        }
    } catch (error) {
        console.error('[ResumeSystemInitializer] Failed to create resume divs:', error);
        return false;
    }
}

/**
 * Initialize the resume system controllers and make them globally available
 * This replaces the IM framework approach with a simpler direct initialization
 */
export async function initializeResumeSystem() {
    console.log('[ResumeSystemInitializer] Initializing resume system...');
    
    try {
        // Make controllers and selectionManager globally available (as expected by Vue components and other modules)
        window.resumeListController = resumeListController;
        window.resumeItemsController = resumeItemsController;
        window.selectionManager = selectionManager;
        
        // Initialize the controllers themselves
        resumeItemsController.registerForInitialization();
        
        // Wait for DOM elements to be available (retry with delays)
        let attempts = 0;
        const maxAttempts = 5;
        
        const waitForDOMElements = async () => {
            while (attempts < maxAttempts) {
                const resumeContentDiv = document.getElementById('resume-content-div');
                const resumeContentWrapper = document.getElementById('resume-content-div-wrapper');
                
                if (resumeContentDiv && resumeContentWrapper) {
                    console.log('[ResumeSystemInitializer] Found DOM elements, setting up ResumeListController...');
                    
                    // Set the DOM elements directly (bypassing template ref system for now)
                    resumeListController.resumeContentDiv = resumeContentDiv;
                    resumeListController.resumeContentWrapper = resumeContentWrapper;
                    resumeListController.resumecontentdivElement = resumeContentDiv;
                    resumeListController.resumecontentdivwrapperElement = resumeContentWrapper;
                    
                    // Create basic resume divs from jobs data (without CardsController dependency)
                    await createBasicResumeDivs(resumeListController, resumeItemsController);
                    
                    return true;
                }
                
                attempts++;
                if (attempts < maxAttempts) {
                    console.log(`[ResumeSystemInitializer] DOM elements not yet available, retrying... (${attempts}/${maxAttempts})`);
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            }
            
            console.log('[ResumeSystemInitializer] DOM elements not available after retries - setup will be completed later');
            return false;
        };
        
        await waitForDOMElements();
        
        console.log('[ResumeSystemInitializer] ✅ Resume system initialized successfully');
        console.log('[ResumeSystemInitializer] - resumeListController available at window.resumeListController');
        console.log('[ResumeSystemInitializer] - resumeItemsController available at window.resumeItemsController');
        
        // Create a visual indicator that shows the resume system status
        const indicator = document.createElement('div');
        indicator.id = 'resume-system-indicator';
        indicator.style.cssText = 'position: fixed; top: 10px; right: 10px; background: green; color: white; padding: 5px; z-index: 9999; font-size: 12px; line-height: 1.2;';
        
        const totalJobs = jobs.length;
        const createdDivs = resumeListController.bizResumeDivs?.length || 0;
        const infiniteItems = resumeListController.infiniteScroller?.originalItems?.length || 0;
        
        indicator.innerHTML = `✅ Resume System<br/>Jobs: ${totalJobs}<br/>Divs: ${createdDivs}<br/>Infinite: ${infiniteItems}`;
        document.body.appendChild(indicator);
        
        // Remove the indicator after 5 seconds  
        setTimeout(() => indicator.remove(), 5000);
        
        return true;
    } catch (error) {
        console.error('[ResumeSystemInitializer] ❌ Failed to initialize resume system:', error);
        return false;
    }
}

/**
 * Check if the resume system is properly initialized
 */
export function isResumeSystemInitialized() {
    return !!(window.resumeListController && window.resumeItemsController);
}

/**
 * Global test function to verify resume system functionality
 * Available in browser console as window.testResumeSystem()
 */
export function testResumeSystem() {
    console.log('=== RESUME SYSTEM TEST ===');
    console.log('window.resumeListController exists:', !!window.resumeListController);
    console.log('window.resumeItemsController exists:', !!window.resumeItemsController);
    
    if (window.resumeListController) {
        console.log('ResumeListController methods:');
        console.log('- goToFirstResumeItem:', typeof window.resumeListController.goToFirstResumeItem);
        console.log('- applySortRule:', typeof window.resumeListController.applySortRule);
        console.log('- originalJobsData length:', window.resumeListController.originalJobsData?.length);
        console.log('- bizResumeDivs length:', window.resumeListController.bizResumeDivs?.length);
        console.log('- infiniteScroller exists:', !!window.resumeListController.infiniteScroller);
        console.log('- infiniteScroller type:', typeof window.resumeListController.infiniteScroller);
    }
    
    if (window.resumeItemsController) {
        console.log('ResumeItemsController methods:');
        console.log('- createAllBizResumeDivs:', typeof window.resumeItemsController.createAllBizResumeDivs);
        console.log('- isInitialized:', window.resumeItemsController.isInitialized());
        console.log('- bizResumeDivs length:', window.resumeItemsController.bizResumeDivs?.length);
    }
    
    // Test selectionManager API compatibility
    console.log('SelectionManager API test:');
    try {
        console.log('- hoverJobNumber method exists:', typeof window.selectionManager?.hoverJobNumber === 'function');
        console.log('- clearHover method exists:', typeof window.selectionManager?.clearHover === 'function');
        console.log('- getSelectedJobNumber method exists:', typeof window.selectionManager?.getSelectedJobNumber === 'function');
    } catch (error) {
        console.error('SelectionManager API test failed:', error);
    }
    
    console.log('=== END RESUME SYSTEM TEST ===');
}

/**
 * Check if resume divs are in the DOM
 */
export function checkResumeDivs() {
    console.log('=== RESUME DIVS CHECK ===');
    const resumeContentDiv = document.getElementById('resume-content-div');
    console.log('resume-content-div exists:', !!resumeContentDiv);
    
    if (resumeContentDiv) {
        const resumeDivs = resumeContentDiv.querySelectorAll('.biz-resume-div');
        console.log('Found resume divs:', resumeDivs.length);
        
        if (resumeDivs.length > 0) {
            console.log('First resume div content:', resumeDivs[0].textContent.substring(0, 100) + '...');
            console.log('Resume div classes:', resumeDivs[0].className);
        }
    }
    console.log('=== END RESUME DIVS CHECK ===');
}

/**
 * Test scrolling functionality
 */
export function testScrolling() {
    console.log('=== SCROLLING TEST ===');
    
    const wrapper = document.getElementById('resume-content-div-wrapper');
    console.log('resume-content-div-wrapper exists:', !!wrapper);
    
    if (wrapper) {
        console.log('Wrapper scroll properties:');
        console.log('- scrollHeight:', wrapper.scrollHeight);
        console.log('- clientHeight:', wrapper.clientHeight);
        console.log('- scrollTop:', wrapper.scrollTop);
        console.log('- overflow-y style:', getComputedStyle(wrapper).overflowY);
        console.log('- Can scroll:', wrapper.scrollHeight > wrapper.clientHeight);
    }
    
    if (window.resumeListController?.infiniteScroller) {
        console.log('InfiniteScrollingContainer status:');
        console.log('- Instance exists:', !!window.resumeListController.infiniteScroller);
        console.log('- Constructor name:', window.resumeListController.infiniteScroller.constructor.name);
        console.log('- Original items length:', window.resumeListController.infiniteScroller.originalItems?.length);
        console.log('- Current index:', window.resumeListController.infiniteScroller.currentIndex);
    }
    
    if (window.resumeListController) {
        console.log('ResumeListController scroll info:');
        console.log('- bizResumeDivs length:', window.resumeListController.bizResumeDivs?.length);
        console.log('- sortedIndices length:', window.resumeListController.sortedIndices?.length);
    }
    
    console.log('=== END SCROLLING TEST ===');
}

// Make test functions globally available
if (typeof window !== 'undefined') {
    window.testResumeSystem = testResumeSystem;
    window.checkResumeDivs = checkResumeDivs;
    window.testScrolling = testScrolling;
}