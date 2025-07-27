// Stub badgeManager to maintain compatibility (NOT part of IM)
// Original moved to archived_components/

class BadgeManagerStub {
  constructor() {
    console.log('[BadgeManagerStub] Badge system disabled - using stub');
  }

  isBadgesVisible() {
    return false;
  }

  isConnectionLinesVisible() {
    return false;
  }

  addEventListener(event, handler) {
    // No-op
  }

  removeEventListener(event, handler) {
    // No-op
  }
}

// Create singleton instance (NOT registered with IM)
export const badgeManager = new BadgeManagerStub();
export default badgeManager;