/**
 * Centralized AppState management using Vue composables
 * Replaces the complex IM framework with simple, Vue-native patterns
 * 
 * Usage:
 *   const { appState, isLoading, loadAppState } = useAppState()
 *   await loadAppState() // Call once in App.vue onMounted
 *   // appState.value is now available in all components
 */

import { ref, readonly } from 'vue'
import { deepMerge } from '../utils/utils.mjs'
import { BadgeMode } from '../core/BadgeMode.mjs'

// Singleton state - shared across all component instances
const appState = ref(null)
const isLoading = ref(false)
const isLoaded = ref(false)
const loadError = ref(null)

// Single promise to prevent multiple simultaneous loads
let loadPromise = null

/**
 * Gets the default state - preserving existing user/system separation
 */
function getDefaultState() {
    return {
        version: "1.2",
        lastUpdated: new Date().toISOString(),
        
        // USER PREFERENCES - things users customize
        layout: {
            orientation: 'scene-left',
            scenePercentage: 50,
            resumePercentage: 50
        },
        resizeHandle: {
            stepCount: 4
        },
        focalPoint: {
            mode: 'locked'
        },
        badgeToggle: {
            mode: BadgeMode.NONE
        },
        badges: {
            height: '2.5em',
            padding: '0.5em 0.75em',
            verticalMargin: '0.1em',
            borderRadius: '1.25em',
            borderWidth: '1px',
            fontSize: '12px',
            fontWeight: '500',
            transition: 'all 0.2s ease',
            spacing: {
                vertical: 10,
                horizontal: 10
            },
            states: {
                normal: {
                    borderWidth: '1px',
                    transform: 'scale(1.0)',
                    boxShadow: 'none'
                },
                hovered: {
                    borderWidth: '2px',
                    transform: 'scale(1.05)',
                    boxShadow: 'none'
                },
                selected: {
                    borderWidth: '2px',
                    transform: 'scale(1.1)',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
                }
            }
        },
        selectedJobNumber: null,
        lastVisitedJobNumber: null,
        resume: {
            sortRule: { field: 'startDate', direction: 'asc' }
        },
        theme: {
            colorPalette: '50_Dark_Grey_Monotone.json',
            brightnessFactorSelected: 2.0,
            brightnessFactorHovered: 1.75,
            borderSettings: {
                normal: {
                    padding: '8px',
                    innerBorderWidth: '1px',
                    innerBorderColor: 'white',
                    outerBorderWidth: '0px',
                    outerBorderColor: 'transparent',
                    borderRadius: '25px'
                },
                hovered: {
                    padding: '7px',
                    innerBorderWidth: '2px',
                    innerBorderColor: 'blue',
                    outerBorderWidth: '0px',
                    outerBorderColor: 'transparent',
                    borderRadius: '25px'
                },
                selected: {
                    padding: '6px',
                    innerBorderWidth: '3px',
                    innerBorderColor: 'purple',
                    outerBorderWidth: '0px',
                    outerBorderColor: 'transparent',
                    borderRadius: '25px'
                }
            },
            rDivBorderOverrideSettings: {
                normal: {
                    padding: '15px',
                    innerBorderWidth: '1px',
                    marginTop: '11px'
                },
                hovered: {
                    padding: '14px',
                    innerBorderWidth: '2px',
                    marginTop: '11px'
                },
                selected: {
                    padding: '13px',
                    innerBorderWidth: '3px',
                    marginTop: '11px'
                }
            }
        },
        
        // COLOR PALETTES - loaded dynamically
        color: {
            palettes: {}
        },
        
        // SYSTEM CONSTANTS - rarely changed, technical settings
        constants: {
            zIndex: {
                root: 0,
                scene: 1,
                sceneGradients: 2,
                timeline: 3,
                connectionLines: 4,
                badges: 5,
                backgroundMax: 6,
                cardsMin: 10,
                cardsMax: 19,
                bullsEye: 98,
                selectedCard: 99,
                focalPoint: 100,
                aimPoint: 101
            },
            cards: {
                meanWidth: 180,
                minHeight: 180,
                maxXOffset: 100,
                maxWidthOffset: 30,
                minZDiff: 2
            },
            timeline: {
                pixelsPerYear: 200,
                paddingTop: 0,
                gradientLength: "50vh"
            },
            resizeHandle: {
                width: 20,
                shadowWidth: 8,
                shadowBlur: 5,
                defaultWidthPercent: 50
            },
            animation: {
                durations: {
                    fast: "0.2s",
                    medium: "0.3s",
                    slow: "0.5s",
                    spinner: "1s"
                },
                autoScroll: {
                    repeatMillis: 10,
                    maxVelocity: 3.0,
                    minVelocity: 2.0,
                    changeThreshold: 2.0,
                    scrollZonePercentage: 0.20
                }
            },
            performance: {
                thresholds: {
                    resizeTime: 16,
                    scrollTime: 8,
                    memoryUsage: 52428800
                },
                debounceTimeout: 100
            },
            typography: {
                fontSizes: {
                    small: "10px",
                    medium: "12px",
                    large: "14px",
                    xlarge: "16px",
                    xxlarge: "20px",
                    timeline: "48px"
                },
                fontFamily: "'Inter', sans-serif"
            },
            visualEffects: {
                parallax: {
                    xExaggerationFactor: 0.9,
                    yExaggerationFactor: 1.0
                },
                depthEffects: {
                    minBrightnessPercent: 15,
                    blurScaleFactor: 2.0,
                    filterMultipliers: {
                        brightness: { min: 0.4, factor: 0.10 },
                        blur: { min: 0, factor: 0.10 },
                        contrast: { min: 0.75, factor: 0.010 },
                        saturate: { min: 0.75, factor: 0.010 }
                    }
                }
            }
        }
    }
}

/**
 * Migrates old state versions to current version
 */
function migrateState(state) {
    if (!state.version) {
        state.version = "1.0"
    }

    // Migration from 1.0 to 1.1: Update marginTop values
    if (state.version === "1.0") {
        console.log('[AppState] Migrating state from v1.0 to v1.1: Updating marginTop values')
        
        if (!state.theme) state.theme = {}
        if (!state.theme.rDivBorderOverrideSettings) {
            state.theme.rDivBorderOverrideSettings = {
                normal: { padding: '15px', innerBorderWidth: '1px', marginTop: '11px' },
                hovered: { padding: '14px', innerBorderWidth: '2px', marginTop: '11px' },
                selected: { padding: '13px', innerBorderWidth: '3px', marginTop: '11px' }
            }
        } else {
            if (state.theme.rDivBorderOverrideSettings.normal) {
                state.theme.rDivBorderOverrideSettings.normal.marginTop = '11px'
            }
            if (state.theme.rDivBorderOverrideSettings.hovered) {
                state.theme.rDivBorderOverrideSettings.hovered.marginTop = '11px'
            }
            if (state.theme.rDivBorderOverrideSettings.selected) {
                state.theme.rDivBorderOverrideSettings.selected.marginTop = '11px'
            }
        }
        
        state.version = "1.1"
        console.log('[AppState] Successfully migrated to v1.1')
    }

    // Migration from 1.1 to 1.2: Add constants system
    if (state.version === "1.1") {
        console.log('[AppState] Migrating state from v1.1 to v1.2: Adding constants system')
        
        if (!state.resizeHandle) {
            state.resizeHandle = {}
        }
        if (!state.resizeHandle.stepCount) {
            state.resizeHandle.stepCount = 4
        }
        
        if (!state.color) {
            state.color = { palettes: {} }
        }
        
        state.version = "1.2"
        console.log('[AppState] Successfully migrated to v1.2 - preserved user preferences')
    }

    return state
}

/**
 * Load application state from server
 */
async function loadStateFromServer() {
    try {
        const response = await fetch('/api/state')
        if (!response.ok) {
            if (response.status === 404) {
                console.log("No saved state found on server, using default state.")
            } else {
                console.log(`Failed to load state, server responded with status: ${response.status}`)
            }
            return getDefaultState()
        }
        
        const rawState = await response.json()
        console.log("Loaded raw state from server:", rawState)
        
        // Migrate the state to current version
        const migratedState = migrateState(rawState)
        
        // Merge with defaults to ensure all keys exist
        const finalState = deepMerge(getDefaultState(), migratedState)
        
        console.log("Final state after migration and merge:", finalState)
        return finalState
        
    } catch (error) {
        console.log('Error fetching state from server, using default state.', error)
        return getDefaultState()
    }
}

/**
 * Save application state to server
 */
async function saveStateToServer(state) {
    try {
        state.lastUpdated = new Date().toISOString()
        await fetch('/api/state', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(state),
        })
        console.log("Saved state to server:", state)
    } catch (error) {
        console.log('Failed to save state to server.', error)
    }
}

/**
 * Vue composable for centralized AppState management
 * Call loadAppState() once in App.vue, then use appState anywhere
 */
export function useAppState() {
    
    /**
     * Load AppState from server (idempotent - safe to call multiple times)
     */
    const loadAppState = async () => {
        // Return existing promise if already loading
        if (loadPromise) {
            return loadPromise
        }
        
        // Return existing state if already loaded
        if (isLoaded.value && appState.value) {
            return appState.value
        }
        
        // Start loading
        isLoading.value = true
        loadError.value = null
        
        loadPromise = loadStateFromServer()
            .then(state => {
                appState.value = state
                isLoaded.value = true
                isLoading.value = false
                
                // Dispatch event for backward compatibility
                window.dispatchEvent(new CustomEvent('app-state-loaded', {
                    detail: { state: state }
                }))
                
                console.log('[AppState] ✅ AppState loaded and available globally')
                return state
            })
            .catch(error => {
                isLoading.value = false
                loadError.value = error
                console.error('[AppState] ❌ Failed to load AppState:', error)
                throw error
            })
            .finally(() => {
                loadPromise = null
            })
        
        return loadPromise
    }
    
    /**
     * Save current AppState to server
     */
    const saveAppState = async () => {
        if (!appState.value) {
            throw new Error('Cannot save AppState - not loaded yet')
        }
        
        await saveStateToServer(appState.value)
        return appState.value
    }
    
    /**
     * Update AppState and save to server
     */
    const updateAppState = async (updates) => {
        if (!appState.value) {
            throw new Error('Cannot update AppState - not loaded yet')
        }
        
        // Deep merge updates
        appState.value = deepMerge(appState.value, updates)
        await saveAppState()
        return appState.value
    }
    
    return {
        // Read-only reactive state
        appState: readonly(appState),
        isLoading: readonly(isLoading),
        isLoaded: readonly(isLoaded),
        loadError: readonly(loadError),
        
        // Actions
        loadAppState,
        saveAppState,
        updateAppState
    }
}

// Export for backward compatibility
export { appState as AppState }