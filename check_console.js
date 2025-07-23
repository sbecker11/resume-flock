// Simple console monitoring script
console.log('=== CONSOLE MONITOR START ===');

// Override console methods to capture all logs
const originalLog = console.log;
const originalError = console.error;
const originalWarn = console.warn;

let logCount = 0;
const MAX_LOGS = 50;

function logWithPrefix(type, ...args) {
    if (logCount < MAX_LOGS) {
        originalLog(`[${type.toUpperCase()}] ${logCount++}:`, ...args);
    }
}

console.log = (...args) => {
    logWithPrefix('log', ...args);
    originalLog(...args);
};

console.error = (...args) => {
    logWithPrefix('error', ...args);
    originalError(...args);
};

console.warn = (...args) => {
    logWithPrefix('warn', ...args);
    originalWarn(...args);
};

// Check initialization status
setTimeout(() => {
    console.log('=== CHECKING INITIALIZATION STATUS ===');
    
    if (window.checkInitializationStatus) {
        console.log('Running checkInitializationStatus...');
        window.checkInitializationStatus();
    } else {
        console.log('checkInitializationStatus function not available');
    }
    
    if (window.showDependencyGraph) {
        console.log('Running showDependencyGraph...');
        window.showDependencyGraph();
    } else {
        console.log('showDependencyGraph function not available');
    }
    
    // Check for specific elements
    const bullsEye = document.getElementById('bulls-eye');
    const aimPoint = document.getElementById('aim-point');
    const scenePlane = document.getElementById('scene-plane');
    const sceneContainer = document.getElementById('scene-container');
    
    console.log('Element check:', {
        'bulls-eye': bullsEye ? 'FOUND' : 'MISSING',
        'aim-point': aimPoint ? 'FOUND' : 'MISSING', 
        'scene-plane': scenePlane ? 'FOUND' : 'MISSING',
        'scene-container': sceneContainer ? 'FOUND' : 'MISSING'
    });
    
    // Check for bizCardDivs
    const bizCards = document.querySelectorAll('.biz-card-div');
    console.log(`Found ${bizCards.length} bizCardDivs`);
    
    // Check window globals
    console.log('Window globals:', {
        cardsController: window.cardsController ? 'AVAILABLE' : 'MISSING',
        bullsEye: window.bullsEye ? 'AVAILABLE' : 'MISSING',
        aimPoint: window.aimPoint ? 'AVAILABLE' : 'MISSING'
    });
    
}, 3000);

console.log('=== CONSOLE MONITOR READY ===');