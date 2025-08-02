// Type definitions for utils.mjs
export function deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T;