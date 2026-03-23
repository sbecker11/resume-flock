#!/usr/bin/env node
/**
 * Runs the root Vitest suite, then `color-palette-utils-ts` tests.
 * Extra args after `npm run test -- …` are forwarded only to Vitest
 * (avoids `&& (cd … && npm test) --flag` shell errors and stray npm flags).
 *
 * @example npm test
 * @example npm run test -- --reporter=dot
 */

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');
const vitestEntry = join(projectRoot, 'node_modules', 'vitest', 'vitest.mjs');
const vitestConfig = join(projectRoot, 'vitest.config.js');
const vitestExtraArgs = process.argv.slice(2);

if (!existsSync(vitestEntry)) {
  console.error('[run-tests] Vitest not found at', vitestEntry, '— run npm install');
  process.exit(1);
}

const vitestResult = spawnSync(
  process.execPath,
  [vitestEntry, 'run', '--config', vitestConfig, ...vitestExtraArgs],
  { cwd: projectRoot, stdio: 'inherit' },
);
if (vitestResult.status !== 0) {
  process.exit(vitestResult.status ?? 1);
}

const paletteResult = spawnSync('npm', ['test'], {
  cwd: join(projectRoot, 'color-palette-utils-ts'),
  stdio: 'inherit',
  shell: process.platform === 'win32',
});
process.exit(paletteResult.status ?? 1);
