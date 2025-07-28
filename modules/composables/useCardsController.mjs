import { ref, onMounted } from 'vue'
import { jobs } from '@/static_content/jobs/jobs.mjs'
import { selectionManager } from '@/modules/core/selectionManager.mjs'
import { useTimeline, initialize } from '@/modules/composables/useTimeline.mjs'
import { useColorPalette, applyPaletteToElement, readyPromise } from '@/modules/composables/useColorPalette.mjs'
import * as dateUtils from '@/modules/utils/dateUtils.mjs'

// Simple CardsController initialization for Vue setup
export function useCardsController() {
    const isInitialized = ref(false)
    const bizCardDivs = ref([])
    
    // Get timeline functions
    const { getPositionForDate, isInitialized: timelineInitialized } = useTimeline()
    
    // Get color palette functions
    const { colorPalettes, currentPaletteFilename } = useColorPalette()

    async function initializeCardsController() {
        if (isInitialized.value) return

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
        const card = document.createElement('div')
        card.className = 'biz-card-div'
        card.id = `biz-card-div-${jobNumber}`
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

    // Auto-initialize when component mounts
    onMounted(() => {
        // Delay to ensure DOM is ready
        setTimeout(initializeCardsController, 100)
    })

    return {
        isInitialized,
        bizCardDivs,
        initializeCardsController
    }
}