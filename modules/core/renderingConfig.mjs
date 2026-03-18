// modules/core/renderingConfig.mjs
// Parallax/depth rendering constants from app_state.json system-constants.rendering.
// Synced when app state loads; used by filters.mjs and useParallaxVue3Enhanced.mjs.
// Min/max/step for 3D sliders live in app_state.json system-constants.renderingLimits (single place to edit).

const DEFAULTS = {
  parallaxScaleAtMinZ: 1.0,  // at min scene Z (1 = near; scene Z is distance-from-viewer, not z-index)
  parallaxScaleAtMaxZ: 1.0,   // at max scene Z (14 = far)
  saturationAtMaxZ: 100,      // percentage 0–100; 100 = no change
  brightnessAtMaxZ: 100,     // percentage 75–100; 100 = no z-based darkness
  blurAtMaxZ: 0
}

/** Default min/max/step for 3D Settings inputs. Override in app_state.json system-constants.renderingLimits. */
export const DEFAULT_RENDERING_LIMITS = {
  blurAtMaxZ: { min: 0, max: 5, step: 0.5 },
  saturationAtMaxZ: { min: 0, max: 100, step: 5 },
  brightnessAtMaxZ: { min: 75, max: 100, step: 5 },
  parallaxScaleAtMinZ: { min: 0, max: 1.5, step: 0.05 },
  parallaxScaleAtMaxZ: { min: 0, max: 1.5, step: 0.05 }
}

/**
 * Clamp a value using rendering limits (from app state or DEFAULT_RENDERING_LIMITS).
 * @param {object} limits - system-constants.renderingLimits
 * @param {string} field - key e.g. 'brightnessAtMaxZ'
 * @param {number} value
 * @returns {number}
 */
export function clampRenderingValue(limits, field, value) {
  const lim = (limits && limits[field]) || DEFAULT_RENDERING_LIMITS[field]
  if (!lim) return value
  const n = Number(value)
  if (Number.isNaN(n)) return lim.min
  return Math.max(lim.min, Math.min(lim.max, n))
}

let current = { ...DEFAULTS }

/**
 * Update config from app state (system-constants.rendering). Call after loadAppState().
 * If limits provided, values are clamped to renderingLimits (e.g. from app_state.json).
 * @param {object} [rendering] - state['system-constants'].rendering
 * @param {object} [limits] - state['system-constants'].renderingLimits (optional)
 */
export function setFromAppState(rendering, limits) {
  if (!rendering || typeof rendering !== 'object') return
  const clamp = (val, field) => clampRenderingValue(limits || null, field, val)
  if (rendering.parallaxScaleAtMinZ !== undefined) current.parallaxScaleAtMinZ = clamp(Number(rendering.parallaxScaleAtMinZ), 'parallaxScaleAtMinZ')
  if (rendering.parallaxScaleAtMaxZ !== undefined) current.parallaxScaleAtMaxZ = clamp(Number(rendering.parallaxScaleAtMaxZ), 'parallaxScaleAtMaxZ')
  // MinZ = near cards, MaxZ = far cards; allow any order; no constraint needed
  if (rendering.saturationAtMaxZ !== undefined) {
    const v = Number(rendering.saturationAtMaxZ)
    const pct = (v >= 0 && v <= 1) ? Math.round(v * 100) : v
    current.saturationAtMaxZ = Number.isNaN(pct) ? DEFAULTS.saturationAtMaxZ : clamp(pct, 'saturationAtMaxZ')
  }
  if (rendering.brightnessAtMaxZ !== undefined) {
    const v = Number(rendering.brightnessAtMaxZ)
    const pct = (v <= 1 && v > 0) ? Math.round(v * 100) : v
    current.brightnessAtMaxZ = Number.isNaN(pct) ? DEFAULTS.brightnessAtMaxZ : clamp(pct, 'brightnessAtMaxZ')
  }
  if (rendering.blurAtMaxZ !== undefined) current.blurAtMaxZ = clamp(Number(rendering.blurAtMaxZ), 'blurAtMaxZ') ?? DEFAULTS.blurAtMaxZ
}

/**
 * Current rendering constants (always has all keys; defaults until app state loads).
 */
export function getRendering() {
  return { ...current }
}
