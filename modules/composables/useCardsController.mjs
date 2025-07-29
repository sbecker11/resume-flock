import { ref, onMounted, onUnmounted } from 'vue'
import { jobs } from '@/static_content/jobs/jobs.mjs'
import { selectionManager } from '@/modules/core/selectionManager.mjs'
import { useTimeline, initialize } from '@/modules/composables/useTimeline.mjs'
import { useColorPalette, applyPaletteToElement, readyPromise } from '@/modules/composables/useColorPalette.mjs'
import * as dateUtils from '@/modules/utils/dateUtils.mjs'
import { createBizCardDivId } from '@/modules/utils/bizCardUtils.mjs'

// Simple CardsController initialization for Vue setup
export function useCardsController() {
    const isInitialized = ref(false)
    const bizCardDivs = ref([])
    
    // Get timeline functions
    const { getPositionForDate, isInitialized: timelineInitialized } = useTimeline()
    
    // Get color palette functions
    const { colorPalettes, currentPaletteFilename } = useColorPalette()

    async function initializeCardsController() {
        console.log('[DEBUG] initializeCardsController called, isInitialized:', isInitialized.value)
        if (isInitialized.value) {
            console.log('[DEBUG] Already initialized, returning early')
            return
        }

        try {
            console.log('[CardsController] Initializing with Vue composable pattern...')
            
            // Initialize timeline first
            if (!timelineInitialized.value) {
                console.log('[CardsController] Initializing timeline...')
                initialize(jobs)
            }
            
            // Get the scene plane element
            const scenePlaneElement = document.getElementById('scene-plane')
            if (!scenePlaneElement) {
                console.warn('[CardsController] scene-plane element not found, retrying...')
                setTimeout(initializeCardsController, 500)
                return
            }

            // Clear any existing cards
            const existingCards = scenePlaneElement.querySelectorAll('.biz-card-div')
            console.log(`[DEBUG] Found ${existingCards.length} existing cards to remove`)
            existingCards.forEach(card => card.remove())

            // Wait for palettes to be ready before applying colors
            console.log('[CardsController] Waiting for palettes to be ready...')
            await readyPromise
            console.log('[CardsController] Palettes are ready, creating cards...')
            
            // Create business cards for each job
            const cards = []
            for (let index = 0; index < jobs.length; index++) {
                const job = jobs[index]
                const card = createBizCardDiv(job, index)
                if (card) {
                    scenePlaneElement.appendChild(card)
                    cards.push(card)
                    
                    // Apply color palette to the card
                    try {
                        await applyPaletteToElement(card)
                        // console.log(`[CardsController] Applied palette to job ${index}`)
                    } catch (error) {
                        console.warn(`[CardsController] Could not apply palette to job ${index}:`, error)
                    }
                }
            }

            bizCardDivs.value = cards
            isInitialized.value = true
            
            console.log(`[CardsController] ✅ Created ${cards.length} business cards`)
            
        } catch (error) {
            console.error('[CardsController] Initialization failed:', error)
            // Retry after a delay
            setTimeout(initializeCardsController, 1000)
        }
    }

    function createBizCardDiv(job, jobNumber) {
        const cardId = createBizCardDivId(jobNumber)
        
        // Check if card already exists in DOM
        if (document.getElementById(cardId)) {
            console.log(`[DEBUG] Card ${cardId} already exists, skipping creation`)
            return null
        }
        
        const card = document.createElement('div')
        card.className = 'biz-card-div'
        card.id = cardId
        card.setAttribute('data-job-number', jobNumber)
        
        // Calculate timeline-based position
        let x = 200 + (jobNumber % 3) * 50 // Simple horizontal offset
        let y = 100 // Default fallback
        
        try {
            // Parse job start date and get timeline position
            const startDate = dateUtils.parseFlexibleDateString(job.start || job.startDate)
            if (startDate && timelineInitialized.value) {
                y = getPositionForDate(startDate)
                // console.log(`[CardsController] Job ${jobNumber} (${job.employer}): ${job.start} → Y position: ${y}`)
            } else {
                console.warn(`[CardsController] Could not position job ${jobNumber}: missing date or timeline not ready`)
            }
        } catch (error) {
            console.error(`[CardsController] Error positioning job ${jobNumber}:`, error)
        }
        
        // Store scene positions as data attributes (for original CardsController compatibility)
        card.setAttribute('data-sceneLeft', x)
        card.setAttribute('data-sceneTop', y)
        card.setAttribute('scene-left', x)
        card.setAttribute('scene-top', y)
        
        // Add color index for palette application
        card.setAttribute('data-color-index', jobNumber % 7) // Cycle through palette colors
        
        // Position only - styling is handled by CSS
        card.style.left = `${x}px`
        card.style.top = `${y}px`
        
        // Add content - styling handled by CSS classes
        card.innerHTML = `
            <div class="biz-details-employer">
                ${job.employer || 'Unknown Employer'}
            </div>
            <div class="biz-details-role">
                ${job.role || 'Unknown Role'}
            </div>
            <div class="biz-details-dates">
                ${job.start || job.startDate} - ${job.end || job.endDate || 'Present'}
            </div>
        `
        
        // Add click handler
        card.addEventListener('click', () => {
            console.log(`[CardsController] Card clicked: Job ${jobNumber}`)
            if (selectionManager) {
                selectionManager.selectJobNumber(jobNumber)
            }
        })
        
        return card
    }

    // Set up selection event listeners for clone management
    onMounted(() => {
        // Delay to ensure DOM is ready
        setTimeout(initializeCardsController, 100)
        
        // Listen for selection events to handle clone creation
        selectionManager.addEventListener('job-selected', handleJobSelected)
        selectionManager.addEventListener('selection-cleared', handleSelectionCleared)
    })
    
    // Clone management functions
    function handleJobSelected(event) {
        const { jobNumber, previousSelection } = event.detail
        console.log(`[useCardsController] Job selected: ${jobNumber}, previous: ${previousSelection}`)
        
        // Clear any existing clones first (handles previous selection)
        if (previousSelection !== null && previousSelection !== jobNumber) {
            console.log(`[useCardsController] Clearing previous selection: ${previousSelection}`)
            removeAllClones()
        }
        
        // Create clone for new selection
        createSelectedClone(jobNumber)
    }
    
    function handleSelectionCleared(event) {
        console.log('[useCardsController] Selection cleared, removing clones...')
        removeAllClones()
    }
    
    function createSelectedClone(jobNumber) {
        const scenePlaneElement = document.getElementById('scene-plane')
        if (!scenePlaneElement) {
            console.warn('[useCardsController] scene-plane not found for clone creation')
            return
        }
        
        // Find the original card
        const originalCardId = createBizCardDivId(jobNumber)
        const originalCard = document.getElementById(originalCardId)
        if (!originalCard) {
            console.warn(`[useCardsController] Original card not found for job ${jobNumber}`)
            return
        }
        
        // Check if clone already exists
        const cloneId = `${originalCardId}-clone`
        if (document.getElementById(cloneId)) {
            console.log(`[useCardsController] Clone already exists: ${cloneId}`)
            return
        }
        
        // Create deep clone
        const clone = originalCard.cloneNode(true)
        clone.id = cloneId
        clone.classList.add('selected')
        clone.classList.remove('hovered')
        
        // Mark original as having a clone and hide it (keep position unchanged)
        originalCard.classList.add('hasClone')
        originalCard.style.display = 'none'
        
        console.log(`[useCardsController] Hidden original card ${originalCard.id}:`, {
            display: originalCard.style.display,
            hasClone: originalCard.classList.contains('hasClone')
        })
        
        // Position clone at scene center (different from original position)
        const sceneRect = scenePlaneElement.getBoundingClientRect()
        const centerX = sceneRect.width / 2
        clone.style.left = `${centerX - (parseFloat(clone.style.width) || 180) / 2}px`
        clone.style.zIndex = '99' // Above other cards
        
        // Add visual indicator to distinguish clone from original
        clone.style.border = '3px solid #ff6b6b' // Red border for debugging
        clone.title = `CLONE of Job ${jobNumber}` // Tooltip to identify clone
        
        // Add clone to DOM
        scenePlaneElement.appendChild(clone)
        
        // Add click handler to clone for deselection
        clone.addEventListener('click', () => {
            console.log(`[useCardsController] Clone clicked: clearing selection`)
            if (selectionManager) {
                selectionManager.clearSelection()
            }
        })
        
        // Apply color palette to clone
        try {
            applyPaletteToElement(clone)
        } catch (error) {
            console.warn(`[useCardsController] Could not apply palette to clone:`, error)
        }
        
        console.log(`[useCardsController] ✅ Created clone for job ${jobNumber}`)
    }
    
    function removeAllClones() {
        const scenePlaneElement = document.getElementById('scene-plane')
        if (!scenePlaneElement) return
        
        // Find all clones and remove them
        const clones = scenePlaneElement.querySelectorAll('[id$="-clone"]')
        clones.forEach(clone => {
            clone.remove()
        })
        
        // Restore original cards (find by hasClone class)
        const cardsWithClones = scenePlaneElement.querySelectorAll('.hasClone')
        cardsWithClones.forEach(card => {
            card.classList.remove('hasClone')
            card.style.display = 'block'
            console.log(`[useCardsController] Restored original card ${card.id}`)
        })
        
        console.log(`[useCardsController] ✅ Removed ${clones.length} clones`)
    }
    
    // Cleanup event listeners on unmount
    onUnmounted(() => {
        selectionManager.removeEventListener('job-selected', handleJobSelected)
        selectionManager.removeEventListener('selection-cleared', handleSelectionCleared)
    })

    return {
        isInitialized,
        bizCardDivs,
        initializeCardsController
    }
}