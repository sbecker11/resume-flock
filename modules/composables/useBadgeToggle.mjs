// Simple badge toggle state for controlling badge visibility globally
import { ref } from 'vue'

// Global badge visibility state - persists across cDiv selections
const isBadgesVisible = ref(true) // Default to showing badges

export function useBadgeToggle() {
    const toggleBadges = () => {
        isBadgesVisible.value = !isBadgesVisible.value
        console.log(`[BadgeToggle] Badges ${isBadgesVisible.value ? 'enabled' : 'disabled'} globally`)
        return isBadgesVisible.value
    }

    return {
        isBadgesVisible,
        toggleBadges
    }
}