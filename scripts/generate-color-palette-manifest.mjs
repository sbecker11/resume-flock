import fs from 'fs/promises';
import path from 'path';

const projectRoot = process.cwd();
const palettesDir = path.join(projectRoot, 'static_content', 'colorPalettes');
const outPath = path.join(palettesDir, 'manifest.json');

async function main() {
  const entries = await fs.readdir(palettesDir, { withFileTypes: true });
  const files = entries
    .filter((e) => e.isFile())
    .map((e) => e.name)
    .filter((n) => n.toLowerCase().endsWith('.json') && n !== 'manifest.json')
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

  await fs.writeFile(outPath, JSON.stringify(files, null, 2) + '\n', 'utf8');
  console.log(`[generate-color-palette-manifest] Wrote ${files.length} entries to ${outPath}`);
}

main().catch((e) => {
  console.error('[generate-color-palette-manifest] Failed:', e);
  process.exitCode = 1;
});

