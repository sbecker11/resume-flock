// modules/composables/useKeyboardNavigation.mjs
// Vue 3 keyboard navigation composable using provide/inject

import { onMounted, onUnmounted } from 'vue'
import { useResumeListController } from '../core/globalServices'

export function useKeyboardNavigation() {
  // Use provide/inject instead of window.resumeListController
  const resumeListController = useResumeListController()
  
  // Enhanced context detection to prevent hijacking form controls
  const isInputContext = (element) => {
    if (!element) return false
    
    const tagName = element.tagName.toLowerCase()
    const inputTypes = ['input', 'textarea', 'select', 'button']
    
    // Check if it's a form control
    if (inputTypes.includes(tagName)) return true
    
    // Check if it's contenteditable
    if (element.contentEditable === 'true') return true
    
    // Check if it's inside a dropdown or modal
    if (element.closest('.dropdown-menu, .modal, [role="combobox"]')) return true
    
    // Check for specific classes that indicate input contexts
    if (element.closest('.color-palette-dropdown, .sort-dropdown')) return true
    
    return false
  }
  
  // Smart keyboard handler that respects context
  const handleKeyDown = (event) => {
    const activeElement = document.activeElement
    
    // Skip if we're in an input context
    if (isInputContext(activeElement)) {
      return
    }
    
    // Only handle arrow keys
    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') {
      return
    }
    
    // Prevent default behavior only for our handled keys
    event.preventDefault()
    
    if (!resumeListController) {
      console.warn('[KeyboardNavigation] Resume list controller not available via provide/inject')
      return
    }
    
    try {
      if (event.key === 'ArrowUp') {
        console.log('[KeyboardNavigation] Arrow Up - navigating to previous item')
        resumeListController.goToPreviousResumeItem()
      } else if (event.key === 'ArrowDown') {
        console.log('[KeyboardNavigation] Arrow Down - navigating to next item')
        resumeListController.goToNextResumeItem()
      }
    } catch (error) {
      console.error('[KeyboardNavigation] Navigation error:', error)
    }
  }
  
  // Service availability check
  const checkServiceAvailability = () => {
    const isAvailable = !!resumeListController
    console.log(`[KeyboardNavigation] Resume list controller available: ${isAvailable ? '✅' : '❌'}`)
    return isAvailable
  }
  
  // Initialize keyboard navigation
  const initialize = () => {
    console.log('[KeyboardNavigation] Initializing Vue 3 keyboard navigation with provide/inject')
    checkServiceAvailability()
    
    document.addEventListener('keydown', handleKeyDown)
    console.log('[KeyboardNavigation] ✅ Keyboard event listener attached')
  }
  
  // Cleanup
  const destroy = () => {
    document.removeEventListener('keydown', handleKeyDown)
    console.log('[KeyboardNavigation] Keyboard event listener removed')
  }
  
  // Auto-setup lifecycle hooks
  onMounted(() => {
    initialize()
  })
  
  onUnmounted(() => {
    destroy()
  })
  
  return {
    // State
    isServiceAvailable: checkServiceAvailability,
    
    // Methods
    initialize,
    destroy,
    handleKeyDown,
    
    // Service access
    resumeListController
  }
}