/**
 * Parse .mjs file content (e.g. "export const jobs = [...];" or "const skills = {...};")
 * to a JavaScript value. Used for resume-parser output compatibility (jobs.mjs, skills.mjs).
 *
 * @param {string} content - Raw file content
 * @param {string} varName - Variable name (e.g. 'jobs', 'skills')
 * @returns {unknown} Parsed JSON value (array or object)
 */
export function parseMjsExport(content, varName) {
  const prefix = `const ${varName} = `;
  const idx = content.indexOf(prefix);
  if (idx === -1) {
    const exportPrefix = `export const ${varName} = `;
    const exportIdx = content.indexOf(exportPrefix);
    if (exportIdx === -1) throw new Error(`Missing "${varName}" in .mjs content`);
    const start = exportIdx + exportPrefix.length;
    const rest = content.slice(start);
    const end = rest.lastIndexOf(';');
    const json = (end === -1 ? rest : rest.slice(0, end)).trim();
    return JSON.parse(json);
  }
  const start = idx + prefix.length;
  const rest = content.slice(start);
  const end = rest.lastIndexOf(';');
  const json = (end === -1 ? rest : rest.slice(0, end)).trim();
  return JSON.parse(json);
}
