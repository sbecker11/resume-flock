/**
 * GitHub Actions: if S3_COLOR_PALETTES_JSON_URL is unset, copy the first URL line from
 * config/github-pages-palette-catalog.url into GITHUB_ENV so verify + Vite see it.
 * Logs remedy per project fast-failure guidelines.
 */
import fs from 'node:fs';

const githubEnv = process.env.GITHUB_ENV;
if (!githubEnv) {
    console.log('[apply-committed-palette-catalog-env] GITHUB_ENV unset; skip (not Actions or wrong step).');
    process.exit(0);
}

if (process.env.S3_COLOR_PALETTES_JSON_URL?.trim()) {
    console.log(
        '[apply-committed-palette-catalog-env] S3_COLOR_PALETTES_JSON_URL already set; skip file fallback.'
    );
    process.exit(0);
}

const path = 'config/github-pages-palette-catalog.url';
if (!fs.existsSync(path)) {
    console.log(`[apply-committed-palette-catalog-env] ${path} missing; skip.`);
    process.exit(0);
}

const line = fs
    .readFileSync(path, 'utf8')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .find((l) => l.length > 0 && !l.startsWith('#'));

if (!line) {
    console.log(`[apply-committed-palette-catalog-env] ${path} has no URL line; skip.`);
    process.exit(0);
}

const url = line;
if (!/^https?:\/\//i.test(url)) {
    console.error(`[apply-committed-palette-catalog-env] ${path} first line must be an http(s) URL.`);
    process.exit(1);
}

const delimiter = '_PALETTE_CATALOG_URL_';
const block = `S3_COLOR_PALETTES_JSON_URL<<${delimiter}\n${url}\n${delimiter}\n`;
fs.appendFileSync(githubEnv, block, 'utf8');
console.log(
    'Remedy: [apply-committed-palette-catalog-env] Set S3_COLOR_PALETTES_JSON_URL from config/github-pages-palette-catalog.url (Actions had no secrets/vars).'
);
process.exit(0);
