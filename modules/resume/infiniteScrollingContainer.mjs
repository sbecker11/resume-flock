// modules/resume/infiniteScrollingContainer.mjs
// TRUE INFINITE SCROLLING - Creates illusion of infinite content with head/tail clones

import { applyPaletteToElement } from '../composables/useColorPalette.mjs';
import { selectionManager } from '../core/selectionManager.mjs';

class InfiniteScrollingContainer {
  constructor(scrollportElement, contentElement, options = {}) {
    this.scrollport = scrollportElement;
    this.contentHolder = contentElement;
    this.options = {
      onItemChange: options.onItemChange || null,
      ...options
    };

    this.originalItems = [];
    this.headClones = [];
    this.tailClones = [];
    this.currentIndex = 0;
    this._isInitialized = false;

    // Infinite scrolling configuration
    this.CLONE_COUNT = 10; // Number of clones to create above and below
    this.SCROLL_BUFFER = 200; // Pixels from edge to trigger repositioning
    this.isRepositioning = false;

    this.init();
  }

  init() {
    this.setupContainer();
    this.setupScrollListener();
    console.log('[InfiniteScrollingContainer] Initialized with true infinite scrolling');
  }

  setupContainer() {
    console.log('[DEBUG] InfiniteScrollingContainer: Setting up infinite scrolling container');
    
    // Set up scrollport for native scrolling
    this.scrollport.style.position = 'relative';
    this.scrollport.style.overflowY = 'auto';
    this.scrollport.style.overflowX = 'hidden'; // Prevent horizontal scrolling
    this.scrollport.style.backgroundColor = 'var(--grey-dark-6)';
    
    // Set up content holder as flexbox container
    this.contentHolder.style.backgroundColor = 'var(--grey-dark-6)';
    this.contentHolder.style.position = 'relative';
    this.contentHolder.style.width = '100%';
    this.contentHolder.style.height = 'auto'; // Let content determine height
    this.contentHolder.style.display = 'flex';
    this.contentHolder.style.flexDirection = 'column';
    this.contentHolder.style.alignItems = 'stretch';
  }

  setupScrollListener() {
    this.scrollport.addEventListener('scroll', () => {
      if (!this.isRepositioning && this.originalItems.length > 0) {
        this.checkScrollBoundaries();
      }
    });
  }

  setItems(items, startingIndex = 0) {
    console.log(`[DEBUG] InfiniteScrollingContainer.setItems: ${items.length} items with infinite scrolling`);
    
    this.originalItems = [...items];
    this.headClones = [];
    this.tailClones = [];
    
    // Clear existing content
    this.contentHolder.innerHTML = '';
    
    // Create head clones (items that appear above the original list)
    this.createHeadClones();
    
    // Add original items
    this.originalItems.forEach((item, index) => {
      if (item) {
        this.prepareItemForInfiniteScroll(item, index, 'original');
        this.contentHolder.appendChild(item);
      }
    });
    
    // Create tail clones (items that appear below the original list)
    this.createTailClones();
    
    console.log(`[DEBUG] InfiniteScrollingContainer: Created infinite scroll structure - ${this.headClones.length} head clones + ${this.originalItems.length} originals + ${this.tailClones.length} tail clones`);
    
    this._isInitialized = true;
  }

  createHeadClones() {
    // Create clones of the last N items to appear above the first item
    const sourceItems = this.originalItems.slice(-this.CLONE_COUNT);
    
    sourceItems.forEach((sourceItem, index) => {
      if (sourceItem) {
        const clone = this.createInfiniteClone(sourceItem, 'head', this.originalItems.length - this.CLONE_COUNT + index);
        this.headClones.push(clone);
        this.contentHolder.appendChild(clone);
      }
    });
  }

  createTailClones() {
    // Create clones of the first N items to appear below the last item
    const sourceItems = this.originalItems.slice(0, this.CLONE_COUNT);
    
    sourceItems.forEach((sourceItem, index) => {
      if (sourceItem) {
        const clone = this.createInfiniteClone(sourceItem, 'tail', index);
        this.tailClones.push(clone);
        this.contentHolder.appendChild(clone);
      }
    });
  }

  createInfiniteClone(sourceItem, cloneType, originalIndex) {
    const clone = sourceItem.cloneNode(true);
    
    // Mark as infinite scroll clone
    clone.classList.add('infinite-scroll-clone');
    clone.classList.add(`${cloneType}-clone`);
    clone.dataset.originalIndex = originalIndex;
    clone.dataset.cloneType = cloneType;
    
    // Remove/modify IDs to avoid duplicates
    if (clone.id) {
      clone.id = `${clone.id}-${cloneType}-clone`;
    }
    
    // Update any child element IDs
    const childrenWithIds = clone.querySelectorAll('[id]');
    childrenWithIds.forEach(child => {
      if (child.id) {
        child.id = `${child.id}-${cloneType}-clone`;
      }
    });
    
    this.prepareItemForInfiniteScroll(clone, originalIndex, cloneType);
    
    // Apply color palette to the clone
    try {
      applyPaletteToElement(clone);
    } catch (error) {
      console.warn('Failed to apply palette to infinite scroll clone:', error);
    }
    
    return clone;
  }

  prepareItemForInfiniteScroll(item, index, type) {
    // Remove any existing positioning styles
    this.clearPositioningStyles(item);
    
    // Set flexbox child properties
    item.style.position = 'relative';
    item.style.width = '100%';
    item.style.height = 'auto';
    item.style.flexShrink = '0';
    
    // Add data attributes for tracking
    item.dataset.infiniteScrollType = type;
    item.dataset.infiniteScrollIndex = index;
  }

  clearPositioningStyles(element) {
    // Remove all positioning styles to allow flexbox
    element.style.removeProperty('position');
    element.style.removeProperty('top'); 
    element.style.removeProperty('left');
    element.style.removeProperty('height');
    element.style.removeProperty('width');
    
    // Remove any transform styles
    element.style.removeProperty('transform');
  }

  checkScrollBoundaries() {
    const scrollTop = this.scrollport.scrollTop;
    const scrollHeight = this.scrollport.scrollHeight;
    const clientHeight = this.scrollport.clientHeight;
    
    // Check if scrolled too close to top (into head clones)
    if (scrollTop < this.SCROLL_BUFFER) {
      console.log('[InfiniteScrollingContainer] Near top boundary - repositioning');
      this.repositionToBottom();
    }
    
    // Check if scrolled too close to bottom (into tail clones)
    if (scrollTop + clientHeight > scrollHeight - this.SCROLL_BUFFER) {
      console.log('[InfiniteScrollingContainer] Near bottom boundary - repositioning');
      this.repositionToTop();
    }
  }

  repositionToBottom() {
    if (this.isRepositioning) return;
    this.isRepositioning = true;
    
    // Calculate scroll position in original content range
    const headClonesHeight = this.calculateHeadClonesHeight();
    const originalContentHeight = this.calculateOriginalContentHeight();
    const currentScrollInOriginals = this.scrollport.scrollTop - headClonesHeight;
    
    // Jump to equivalent position at bottom (in tail clones area)
    const newScrollTop = headClonesHeight + originalContentHeight + currentScrollInOriginals;
    
    this.scrollport.scrollTop = newScrollTop;
    
    console.log(`[InfiniteScrollingContainer] Repositioned from top area to bottom: ${this.scrollport.scrollTop}px`);
    
    // Allow repositioning again after a brief delay
    setTimeout(() => {
      this.isRepositioning = false;
    }, 100);
  }

  repositionToTop() {
    if (this.isRepositioning) return;
    this.isRepositioning = true;
    
    // Calculate scroll position in original content range
    const headClonesHeight = this.calculateHeadClonesHeight();
    const originalContentHeight = this.calculateOriginalContentHeight();
    const currentScrollInTailClones = this.scrollport.scrollTop - headClonesHeight - originalContentHeight;
    
    // Jump to equivalent position at top (in head clones area)
    const newScrollTop = headClonesHeight + currentScrollInTailClones;
    
    this.scrollport.scrollTop = newScrollTop;
    
    console.log(`[InfiniteScrollingContainer] Repositioned from bottom area to top: ${this.scrollport.scrollTop}px`);
    
    // Allow repositioning again after a brief delay
    setTimeout(() => {
      this.isRepositioning = false;
    }, 100);
  }

  calculateHeadClonesHeight() {
    return this.headClones.reduce((total, clone) => {
      return total + (clone.offsetHeight || 0);
    }, 0);
  }

  calculateOriginalContentHeight() {
    return this.originalItems.reduce((total, item) => {
      return total + (item.offsetHeight || 0);
    }, 0);
  }

  calculateTailClonesHeight() {
    return this.tailClones.reduce((total, clone) => {
      return total + (clone.offsetHeight || 0);
    }, 0);
  }

  scrollToIndex(originalIndex, animate = true) {
    console.log(`[DEBUG] scrollToIndex: ${originalIndex} with animate=${animate}`);
    
    if (originalIndex < 0 || originalIndex >= this.originalItems.length) {
      console.warn(`[DEBUG] scrollToIndex: Invalid index ${originalIndex} - using modulo to wrap around`);
      // Use modulo to wrap around the index for infinite scrolling
      originalIndex = ((originalIndex % this.originalItems.length) + this.originalItems.length) % this.originalItems.length;
    }
    
    const targetItem = this.originalItems[originalIndex];
    if (targetItem) {
      // Scroll to the original item (not clones)
      targetItem.scrollIntoView({ 
        behavior: animate ? 'smooth' : 'auto', 
        block: 'center' 
      });
      
      this.currentIndex = originalIndex;
      
      if (this.options.onItemChange) {
        this.options.onItemChange(originalIndex, targetItem);
      }
    }
  }

  scrollToItem(index, caller = '') {
    return this.scrollToIndex(index, true);
  }

  scrollToBizResumeDiv(bizResumeDiv, animate = true) {
    const index = this.originalItems.findIndex(item => item === bizResumeDiv);
    if (index !== -1) {
      this.scrollToIndex(index, animate);
      return true;
    }
    return false;
  }

  scrollToJobNumber(jobNumber, animate = true) {
    const index = this.originalItems.findIndex(item => {
      const itemJobNumber = parseInt(item.getAttribute('data-job-number'), 10);
      return itemJobNumber === jobNumber;
    });
    
    if (index !== -1) {
      this.scrollToIndex(index, animate);
      return true;
    }
    return false;
  }

  recalculateHeights() {
    // No-op for flexbox - heights are automatic
    console.log('[DEBUG] recalculateHeights: No-op with flexbox flow');
  }

  recalculateHeightsAfterPalette() {
    // No-op for flexbox - palette changes don't affect layout
    console.log('[DEBUG] recalculateHeightsAfterPalette: No-op with flexbox flow');
  }

  getCurrentIndex() {
    return this.currentIndex;
  }

  getCurrentItem() {
    return this.originalItems[this.currentIndex] || null;
  }

  getItemAtIndex(index) {
    return this.originalItems[index] || null;
  }

  // Method for compatibility with legacy sorting code
  getCurrentlyVisibleJob() {
    // Return the current job number from the currently visible item
    const currentItem = this.getCurrentItem();
    if (currentItem) {
      const jobNumber = parseInt(currentItem.getAttribute('data-job-number'), 10);
      return isNaN(jobNumber) ? null : jobNumber;
    }
    return null;
  }

  goToNext() {
    // Infinite scrolling - no bounds checking needed
    const nextIndex = this.currentIndex + 1;
    this.scrollToIndex(nextIndex);
  }

  goToPrevious() {
    // Infinite scrolling - no bounds checking needed  
    const prevIndex = this.currentIndex - 1;
    this.scrollToIndex(prevIndex);
  }

  goToFirst() {
    this.scrollToIndex(0);
    return this.originalItems[0];
  }

  goToLast() {
    this.scrollToIndex(this.originalItems.length - 1);
    return this.originalItems[this.originalItems.length - 1];
  }

  isInitialized() {
    return this._isInitialized;
  }

  destroy() {
    // Clean up
    this.originalItems = [];
    this.headClones = [];
    this.tailClones = [];
    this.currentIndex = 0;
    this._isInitialized = false;
    this.isRepositioning = false;
  }

  // Static methods for singleton compatibility
  static reset() {
    if (InfiniteScrollingContainer.instance) {
      InfiniteScrollingContainer.instance.destroy();
      InfiniteScrollingContainer.instance = null;
    }
  }
}

export { InfiniteScrollingContainer };