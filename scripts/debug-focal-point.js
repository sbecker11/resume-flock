// Run this in browser console to debug focal point positioning

console.log('=== FOCAL POINT DEBUG ===');

// Check if elements exist
const focalPoint = document.getElementById('focal-point');
const bullsEye = document.getElementById('bulls-eye');
const aimPoint = document.getElementById('aim-point');

console.log('DOM Elements:');
console.log('- focalPoint:', !!focalPoint, focalPoint);
console.log('- bullsEye:', !!bullsEye, bullsEye);
console.log('- aimPoint:', !!aimPoint, aimPoint);

if (focalPoint) {
    const style = window.getComputedStyle(focalPoint);
    console.log('Focal Point CSS:');
    console.log('- position:', style.position);
    console.log('- left:', style.left);
    console.log('- top:', style.top);
    console.log('- transform:', style.transform);
    console.log('- visibility:', style.visibility);
    console.log('- display:', style.display);
    
    const rect = focalPoint.getBoundingClientRect();
    console.log('Focal Point Rect:', rect);
}

if (bullsEye) {
    const style = window.getComputedStyle(bullsEye);
    console.log('Bulls Eye CSS:');
    console.log('- position:', style.position);
    console.log('- left:', style.left);
    console.log('- top:', style.top);
    console.log('- transform:', style.transform);
    
    const rect = bullsEye.getBoundingClientRect();
    console.log('Bulls Eye Rect:', rect);
}

// Check IM components
if (window.initializationManager) {
    const focalPointManager = window.initializationManager.getComponent('FocalPointManager');
    const aimPointManager = window.initializationManager.getComponent('AimPointManager');
    const bullsEyeManager = window.initializationManager.getComponent('BullsEyeManager');
    
    console.log('IM Components:');
    console.log('- focalPointManager:', !!focalPointManager);
    console.log('- aimPointManager:', !!aimPointManager);
    console.log('- bullsEyeManager:', !!bullsEyeManager);
    
    if (focalPointManager) {
        console.log('FocalPointManager state:');
        console.log('- isInitialized:', focalPointManager.isInitialized);
        console.log('- focalPointElement:', !!focalPointManager.focalPointElement);
        console.log('- current position:', focalPointManager.focalPointState?.value?.current);
        console.log('- target position:', focalPointManager.focalPointState?.value?.target);
    }
    
    if (aimPointManager) {
        console.log('AimPointManager state:');
        console.log('- aimPointState:', aimPointManager.aimPointState?.value);
        console.log('- focalPointModeState:', aimPointManager.focalPointModeState?.value);
    }
    
    if (bullsEyeManager) {
        console.log('BullsEyeManager state:');
        console.log('- bullsEyeState:', bullsEyeManager.bullsEyeState?.value);
        console.log('- isProperlyInitialized:', bullsEyeManager.isProperlyInitialized);
    }
}

console.log('=== END DEBUG ===');