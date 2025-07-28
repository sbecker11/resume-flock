// Browser debugging functions - add to window for console access
export function debugComponents() {
    console.log('=== DOM Elements Check ===');
    const bullsEye = document.getElementById('bulls-eye');
    console.log('BullsEye element:', bullsEye);
    if (bullsEye) {
        const styles = window.getComputedStyle(bullsEye);
        console.log('BullsEye visibility:', styles.visibility);
        console.log('BullsEye display:', styles.display);
        console.log('BullsEye position:', styles.position);
        console.log('BullsEye left:', styles.left);
        console.log('BullsEye top:', styles.top);
    }
    
    const sceneContainer = document.getElementById('scene-container');
    console.log('Scene container:', sceneContainer);
    
    const scenePlane = document.getElementById('scene-plane');
    console.log('Scene plane:', scenePlane);
    
    if (scenePlane) {
        const bizCards = scenePlane.querySelectorAll('.biz-card-div');
        console.log('BizCard divs found:', bizCards.length);
        bizCards.forEach((card, index) => {
            console.log(`Card ${index}:`, card.id, card.style.display);
        });
    }
    
    console.log('\n=== Component States ===');
    if (window.initializationManager) {
        const components = Array.from(window.initializationManager.components.entries());
        components.forEach(([name, comp]) => {
            console.log(`${name}: ${comp.status}`);
        });
        
        console.log('\n=== Vue DOM Status ===');
        const vueDomStatus = window.initializationManager.getVueDomStatus();
        console.log('Vue DOM Ready:', vueDomStatus.isVueDomReady);
        console.log('Pending Components:', vueDomStatus.pendingComponents);
        console.log('Pending Count:', vueDomStatus.pendingCount);
        
        console.log('\n=== Registry ===');
        const registry = Array.from(window.initializationManager.componentRegistry.keys());
        console.log('Registered:', registry);
    }
}

// Additional debugging functions
export function checkInitializationStatus() {
    if (!window.initializationManager) {
        console.log('InitializationManager not available');
        return;
    }
    
    console.log('=== Initialization Status ===');
    const status = window.initializationManager.getStatus();
    Object.entries(status).forEach(([name, info]) => {
        console.log(`${name}: ${info.status} (ready: ${info.ready}) - deps: [${info.dependencies.join(', ')}]`);
    });
    
    const vueDomStatus = window.initializationManager.getVueDomStatus();
    console.log('\n=== Vue DOM Status ===');
    console.log('Vue DOM Ready:', vueDomStatus.isVueDomReady);
    console.log('Pending Components:', vueDomStatus.pendingComponents);
}

export function showDependencyGraph() {
    if (!window.initializationManager) {
        console.log('InitializationManager not available');
        return;
    }
    
    console.log(window.initializationManager.getDependencyGraph());
}

export function validateDependencies() {
    if (!window.initializationManager) {
        console.log('InitializationManager not available');
        return;
    }
    
    const validation = window.initializationManager.validateDependencies();
    console.log('=== Dependency Validation ===');
    console.log('Valid:', validation.isValid);
    if (validation.errors.length > 0) {
        console.log('Errors:', validation.errors);
    }
    if (validation.warnings.length > 0) {
        console.log('Warnings:', validation.warnings);
    }
}

export function triggerVueDomReady() {
    console.log('Manually triggering Vue DOM ready event...');
    window.dispatchEvent(new CustomEvent('vue-dom-ready', { 
        detail: { timestamp: Date.now(), manual: true } 
    }));
}

// Make all functions available globally
window.debugComponents = debugComponents;
window.checkInitializationStatus = checkInitializationStatus;
window.showDependencyGraph = showDependencyGraph;
window.validateDependencies = validateDependencies;
window.triggerVueDomReady = triggerVueDomReady;