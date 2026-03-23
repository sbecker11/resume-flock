/**
 * Normalize resume-parser output for consumption by resume-flyer.
 * Parser may emit jobs/skills as dicts keyed by ID; the app expects jobs as array and skills name-keyed for enrichment.
 *
 * - Jobs: array → unchanged; object keyed by jobID → array sorted by jobID, each item gains jobID.
 * - Skills: object keyed by skillID with { name, url?, img?, ... } → name-keyed { [name]: { url, img } }; legacy name-keyed → unchanged.
 * - Categories: returned as-is (dict keyed by categoryID).
 */

/**
 * @param {unknown} jobs - Parser output: array or object keyed by jobID
 * @returns {Array<object>} Normalized jobs array (for getJobsData / enrichJobs)
 */
export function normalizeParserJobs(jobs) {
  if (Array.isArray(jobs)) return jobs;
  if (jobs && typeof jobs === 'object' && !Array.isArray(jobs)) {
    const entries = Object.entries(jobs);
    const sorted = entries.sort(([a], [b]) => {
      const na = Number(a);
      const nb = Number(b);
      if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
      return String(a).localeCompare(String(b));
    });
    return sorted.map(([id, job]) => ({ ...job, jobID: id }));
  }
  return [];
}

/**
 * @param {unknown} skills - Parser output: legacy { [skillName]: { url?, img? } } or new { [skillID]: { name, url?, img?, categoryIDs?, jobIDs? } }
 * @returns {Record<string, { url?: string, img?: string }>} Name-keyed skills for enrichment (enrichJobFromDescription)
 */
export function normalizeParserSkills(skills) {
  if (!skills || typeof skills !== 'object') return {};
  const first = Object.values(skills)[0];
  const isNewFormat = first && typeof first === 'object' && 'name' in first && typeof (first).name === 'string';
  if (isNewFormat) {
    const byName = {};
    for (const skill of Object.values(skills)) {
      if (skill && typeof skill === 'object' && skill.name) {
        const name = String(skill.name).trim();
        if (name && !byName[name]) byName[name] = { url: skill.url, img: skill.img };
      }
    }
    return byName;
  }
  return /** @type {Record<string, { url?: string, img?: string }>} */ (skills);
}

/**
 * @param {unknown} categories - Parser output: { [categoryID]: { name, skillIDs? } } or missing
 * @returns {Record<string, { name: string, skillIDs?: string[] }>}
 */
export function normalizeParserCategories(categories) {
  if (!categories || typeof categories !== 'object') return {};
  return /** @type {Record<string, { name: string, skillIDs?: string[] }>} */ (categories);
}
