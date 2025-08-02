// modules/core/keyDown.mjs

// import { toggleStepping } from './resizeHandle.mjs'; // TODO: Re-implement with composable

/**
 * function that handles keyboard events
 * @param {*} event 
 */
export function handleKeyDown(event) {
    // Always allow special debug shortcut
    if (event.ctrlKey && event.shiftKey && event.altKey && event.key === 'D') {
        window.CONSOLE_LOG_IGNORE("Ctrl+Shift+Alt+D detected: Dumping managers to console");
        window.dumpManagersToConsole();
        return;
    }

    // Skip navigation shortcuts when user is typing in input elements
    const activeElement = document.activeElement;
    const isInputActive = activeElement && (
        activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.tagName === 'SELECT' ||
        activeElement.isContentEditable ||
        activeElement.hasAttribute('contenteditable')
    );

    if (isInputActive && (event.key.startsWith('Arrow') || event.key === ' ')) {
        // Let input elements handle their own arrow key navigation
        return;
    }

    switch (event.key) {
        // Arrow key navigation using sorted order
        case "ArrowUp":
            event.preventDefault();
            window.CONSOLE_LOG_IGNORE("ArrowUp: Going to previous item in sorted order");
            if (window.resumeListController) {
                window.resumeListController.goToPreviousResumeItem();
            }
            break;
        case "ArrowDown":
            event.preventDefault();
            window.CONSOLE_LOG_IGNORE("ArrowDown: Going to next item in sorted order");
            if (window.resumeListController) {
                window.resumeListController.goToNextResumeItem();
            }
            break;
        case "ArrowLeft":
        case "ArrowRight":
        case " ": // Spacebar
            // These keys remain disabled for now
            break;

        // Focal point mode controls
        case "b":
            window.CONSOLE_LOG_IGNORE("'b' key pressed for bullseye");
            document.dispatchEvent(new CustomEvent('focalModeChange', { detail: { mode: 'locked' } }));
            break;
        case "f":
            window.CONSOLE_LOG_IGNORE("'f' key pressed for following");
            document.dispatchEvent(new CustomEvent('focalModeChange', { detail: { mode: 'following' } }));
            break;
        case "d":
            window.CONSOLE_LOG_IGNORE("'d' key pressed for dragging");
            document.dispatchEvent(new CustomEvent('focalModeChange', { detail: { mode: 'dragging' } }));
            break;
        
        // Other controls
        case "s":
            window.CONSOLE_LOG_IGNORE("'s' key pressed");
            // toggleStepping();
            break;
        
        // Obsolete controls 'c' (color palettes) and 't' (timeline) were removed.
        
        case 'l':
            eventBus.emit('focal-point-lock-toggle');
            break;
        
        default:
            window.CONSOLE_LOG_IGNORE("Key pressed: " + event.key);
            break;
    }
}

let _isInitialized = false;

/**
 * Initializes the keydown handler and attaches the event listener.
 */
export function initialize() {
    if (_isInitialized) {
        window.CONSOLE_LOG_IGNORE("Keydown handler already initialized.");
        return;
    }

    document.addEventListener('keydown', handleKeyDown);

    _isInitialized = true;
    window.CONSOLE_LOG_IGNORE("Keydown handler initialized.");
}

export function isInitialized() {
    return _isInitialized;
}
