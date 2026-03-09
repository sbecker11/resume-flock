// modules/core/renderingConfig.mjs
// Parallax/depth rendering constants from app_state.json system-constants.rendering.
// Synced when app state loads; used by filters.mjs and useParallaxVue3Enhanced.mjs.

const DEFAULTS = {
  parallaxScaleAtMaxZ: 0.9,
  saturationAtMaxZ: 1.0,
  brightnessAtMaxZ: 1.0,
  blurAtMaxZ: 0
}

let current = { ...DEFAULTS }

/**
 * Update config from app state (system-constants.rendering). Call after loadAppState().
 * @param {object} [rendering] - state['system-constants'].rendering
 */
export function setFromAppState(rendering) {
  if (!rendering || typeof rendering !== 'object') return
  if (rendering.parallaxScaleAtMaxZ !== undefined) current.parallaxScaleAtMaxZ = Number(rendering.parallaxScaleAtMaxZ) || DEFAULTS.parallaxScaleAtMaxZ
  if (rendering.saturationAtMaxZ !== undefined) current.saturationAtMaxZ = Number(rendering.saturationAtMaxZ) ?? DEFAULTS.saturationAtMaxZ
  if (rendering.brightnessAtMaxZ !== undefined) current.brightnessAtMaxZ = Number(rendering.brightnessAtMaxZ) ?? DEFAULTS.brightnessAtMaxZ
  if (rendering.blurAtMaxZ !== undefined) current.blurAtMaxZ = Math.max(0, Number(rendering.blurAtMaxZ)) ?? DEFAULTS.blurAtMaxZ
}

/**
 * Current rendering constants (always has all keys; defaults until app state loads).
 */
export function getRendering() {
  return { ...current }
}
