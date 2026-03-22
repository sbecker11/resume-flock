/**
 * Resolve the public HTTPS URL for the palette catalog NDJSON.
 *
 * Color Palette Maker / color-palette-utils-ts:
 * - Full URL: `S3_COLOR_PALETTES_JSON_URL`
 * - Or: `S3_IMAGES_BUCKET` + `AWS_REGION` (or `S3_REGION`) + `S3_PALETTES_JSONL_KEY`
 * - Legacy: `S3_BUCKET` + `S3_REGION` + `S3_COLOR_PALETTES_OBJECT_KEY`
 *
 * Browser bundle: `vite.config.js` sets `import.meta.env.S3_PALETTE_CATALOG_RESOLVED` from
 * merged `process.env` + `loadEnv` so GitHub Actions `env:` secrets are baked at build time.
 *
 * @param {Record<string, string | undefined>} env
 * @returns {string} trimmed URL or '' if not configured
 */
export function resolvePaletteCatalogS3UrlFromRecord(env) {
    const e = env || {};

    const full = typeof e.S3_COLOR_PALETTES_JSON_URL === 'string' ? e.S3_COLOR_PALETTES_JSON_URL.trim() : '';
    if (full) return full;

    const bucket =
        (typeof e.S3_IMAGES_BUCKET === 'string' ? e.S3_IMAGES_BUCKET.trim() : '') ||
        (typeof e.S3_BUCKET === 'string' ? e.S3_BUCKET.trim() : '');
    const region =
        (typeof e.AWS_REGION === 'string' ? e.AWS_REGION.trim() : '') ||
        (typeof e.S3_REGION === 'string' ? e.S3_REGION.trim() : '');
    const objectKey =
        (typeof e.S3_PALETTES_JSONL_KEY === 'string' ? e.S3_PALETTES_JSONL_KEY.trim() : '') ||
        (typeof e.S3_COLOR_PALETTES_OBJECT_KEY === 'string' ? e.S3_COLOR_PALETTES_OBJECT_KEY.trim() : '');

    if (bucket && region && objectKey) {
        const key = objectKey.replace(/^\/+/, '');
        return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
    }

    return '';
}

/**
 * @param {Record<string, string | undefined>} [overrideEnv] - if provided (including `{}`), only this object is used (tests).
 * @returns {string} trimmed URL or '' if not configured
 */
export function resolvePaletteCatalogS3Url(overrideEnv) {
    if (overrideEnv !== undefined) {
        return resolvePaletteCatalogS3UrlFromRecord(overrideEnv);
    }

    const build =
        typeof import.meta.env.S3_PALETTE_CATALOG_RESOLVED === 'string'
            ? import.meta.env.S3_PALETTE_CATALOG_RESOLVED.trim()
            : '';
    if (build) return build;

    return resolvePaletteCatalogS3UrlFromRecord(
        typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {}
    );
}
