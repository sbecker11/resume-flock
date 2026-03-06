/**
 * Palette color utilities – TypeScript, no framework deps.
 * Use in Node, browser, or any TS/JS project that consumes exported palette JSON.
 */
import type { ContrastIconSet, GetContrastIconSetOptions, GetHighlightColorOptions, HighContrastForBackground, RGB } from './types.js';
/** Format hex for display: always 7 chars (#rrggbb), lowercase. Expands #rgb to #rrggbb. */
export declare function formatHexDisplay(hex: string | null | undefined): string;
export declare function rgbToHex(r: number, g: number, b: number): string;
/** Parse hex color to { r, g, b } (0-255). Returns null if invalid. */
export declare function hexToRgb(hex: string): RGB | null;
/** Returns black or white hex for best contrast on the given background: white on dark, black on light. Uses LAB L* (perceptual lightness); bright when L* >= LAB_LIGHT_THRESHOLD → black text/icons. */
export declare function getHighContrastMono(hex: string): '#000000' | '#ffffff';
/**
 * Returns high-contrast text color and icon set for a given background in one call, so text and
 * icons always use the same light/dark decision. Prefer this over separate getHighContrastMono
 * and getIconSetForBackgroundColor to avoid mismatches.
 */
export declare function getHighContrastForBackground(backgroundColorHex: string, options?: GetContrastIconSetOptions): HighContrastForBackground;
/**
 * Returns an icon set (url, back, img paths and variant) for a given background color.
 * Prefer getHighContrastForBackground when you need both text color and icons for the same background.
 */
export declare function getIconSetForBackgroundColor(backgroundColorHex: string, options?: GetContrastIconSetOptions): ContrastIconSet;
/**
 * @deprecated Use getIconSetForBackgroundColor. Returns paths for url, back, and img icons (same behavior).
 */
export declare function getContrastIconSet(hex: string, options?: GetContrastIconSetOptions): ContrastIconSet;
/**
 * Perceptually distinct highlight. When L >= nearlyWhiteL (e.g. 85): darken (L2 = L / multiplier).
 * When L < nearlyWhiteL: brighten (L2 = L * multiplier, capped at 100).
 * E.g. highlightPercent 135 (1.35): L>=85 → L/1.35; L<85 → L*1.35.
 * Use with getHighContrastMono(highlightColor) for text on the highlight.
 */
export declare function getHighlightColor(hex: string, options?: GetHighlightColorOptions): string;
//# sourceMappingURL=colors.d.ts.map