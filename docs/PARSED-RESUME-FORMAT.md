# Parsed Resume Object — File/Directory Format

A **parsed resume** is a directory under `parsed_resumes/<id>/` containing the original resume file (optional), parser output files, and metadata. The app loads jobs/skills from these directories via `GET /api/resumes/:id/data`.

## Directory layout

**Preferred (resume-flock convention):**

```
parsed_resumes/
  <id>/                    # stable slug (e.g. parsed-resume-1, from-static-1734567890)
    meta.json              # optional for load; required for list UI
    jobs/
      jobs.mjs             # required — parser output (export const jobs = [...];)
    skills/
      skills.mjs           # optional — parser output (export const skills = {...};); default {}
    resume.docx            # optional — original uploaded document (any name ok)
    resume.pdf             # optional — original uploaded document (one of resume.*)
```

**Alternate (flat):** Jobs file at folder root, skills optional:

```
parsed_resumes/
  <id>/
    jobs.mjs               # required — same format as above
    skills.mjs             # optional — at root; if missing, skills = {}
```

- **`<id>`**: Opaque identifier. Use lowercase alphanumeric and hyphens (e.g. `parsed-resume-1`). Must not be `default` (reserved for static content).
- **Jobs**: Either `jobs/jobs.mjs` or `jobs.mjs` at folder root. Same format as `static_content/jobs/jobs.mjs`. Parsed by `parseMjsExport(content, 'jobs')`.
- **Skills**: Optional. Either `skills/skills.mjs` or (in flat layout) `skills.mjs`. If missing, the server returns `skills: {}`.
- **Original doc**: Optional; any filename (e.g. `resume.docx`, `data-engineer.docx`).

## meta.json schema

```json
{
  "id": "<same as directory name>",
  "displayName": "Human-readable label",
  "createdAt": "ISO 8601 date string",
  "fileName": "resume.docx",
  "jobCount": 11,
  "skillCount": 85
}
```

| Field         | Type   | Required | Description |
|---------------|--------|----------|-------------|
| `id`          | string | yes      | Same as parent directory name. |
| `displayName` | string | yes      | Label for UI (e.g. "Default resume", "Shawn Becker 2025"). |
| `createdAt`   | string | yes      | ISO 8601 (e.g. `2025-03-07T12:00:00.000Z`). |
| `fileName`    | string | no       | Original file name if uploaded (e.g. `resume.docx`). Omit if no file. |
| `jobCount`    | number | yes      | Length of `jobs` array in `jobs.mjs`. |
| `skillCount`  | number | yes      | Number of keys in `skills` object in `skills.mjs`. |

## Validation rules

- Jobs file must parse to an array; each element has at least `index`, `role`, `employer`, `start`, `end`, `Description` (see resume-parser format).
- If present, skills file must parse to an object; keys are skill names, values have `url` and optionally `img`.
- Server returns 404 only if the resume folder or jobs file is missing for a given `id`. `meta.json` and `skills` are optional.

## Using a parsed resume from another directory

The app reads only from **resume-flock’s** `parsed_resumes/` directory (project root). To use a folder you created elsewhere (e.g. `~/workspace-resume/parsed-resumes/parsed-resume-1/`):

1. **Copy or symlink** that folder into resume-flock’s `parsed_resumes/` under the same id:
   - From repo root:  
     `cp -r ~/workspace-resume/parsed-resumes/parsed-resume-1 ./parsed_resumes/parsed-resume-1`  
   - or:  
     `ln -s ~/workspace-resume/parsed-resumes/parsed-resume-1 ./parsed_resumes/parsed-resume-1`
2. Your layout is supported: **jobs at root** (`jobs.mjs`) and **no skills file** (server uses `skills: {}`). Original doc name (e.g. `data-engineer.docx`) is fine.
3. In the app, set `currentResumeId` to `parsed-resume-1` and call the reinitializer (or use a future “Load resume” UI).

## Relationship to “default” resume

- **Default resume**: Jobs/skills come from `static_content/jobs/jobs.mjs` and `static_content/skills/skills.mjs` (API path `/api/resumes/default/data`). No directory under `parsed_resumes/` is required.
- **Parsed resume**: Jobs/skills come from `parsed_resumes/<id>/jobs/jobs.mjs` and `.../skills/skills.mjs` (API path `/api/resumes/:id/data`). App state `currentResumeId` holds `id` or `null` for default.

## Reinitializing the app with a parsed resume

After setting `currentResumeId` in app state and persisting, call the single reinit path so Timeline, CardsController, and the resume list rebuild from the new jobs:

```js
import { reinitializeResumeSystem } from '@/modules/resume/resumeReinitializer.mjs'

// e.g. after user selects a resume or after parse
await reinitializeResumeSystem(resumeId)  // resumeId string or null for default
```

See `modules/resume/resumeReinitializer.mjs` for registration of Timeline, CardsController, and resume-list callbacks.

---

## Latest work (implementation status)

### currentResumeId behavior

- **`currentResumeId: null`** — Loads the **default resume** from `static_content/jobs/jobs.mjs` and `static_content/skills/skills.mjs` (API: `/api/resumes/default/data`).
- **`currentResumeId: "<id>"`** — Loads the **parsed resume** from `parsed_resumes/<id>/` (API: `/api/resumes/:id/data`).

Set and persist in `app_state.json` under `user-settings.currentResumeId`; the app reads it on load and fetches the corresponding jobs/skills.

### Using a parsed resume (steps that work)

1. **Parser output** (e.g. from `resume_to_flock.py` in workspace-resume/resume-parser): produces `jobs/jobs.mjs` and `skills/skills.mjs` in an output directory (e.g. `~/workspace-resume/parsed-resumes/parsed-resume-1/`).
2. **Symlink into resume-flock** (from resume-flock repo root):  
   `ln -s ~/workspace-resume/parsed-resumes/parsed-resume-1 ./parsed_resumes/parsed-resume-1`
3. **Set default resume in app state**: In `app_state.json`, set `user-settings.currentResumeId` to `"parsed-resume-1"` (or `null` for static default).
4. **Start app**: `npm run dev`. Jobs load from the API; Timeline, CardsController, and resume list reinitialize from the loaded jobs.

### Server behavior

- **Two layouts supported**: (1) `jobs/jobs.mjs` + `skills/skills.mjs`; (2) `jobs.mjs` at folder root with optional `skills.mjs`. Missing skills file → `skills: {}`.
- **Reinit path**: Single path in `resumeReinitializer.mjs`: load jobs by id → Timeline reinit → CardsController reinit → resume list reinit.

### CardsController / jobs race fix

CardsController now initializes when **either** (1) `scene-plane-ready` fires **or** (2) jobs become available (watcher on jobs dependency). That avoids the case where the scene is ready before `loadJobs()` completes (e.g. parsed resume from API), which previously left biz-card-divs and skill-card-divs at zero.

---

## Invoking the parser (next objective)

To run the parse-resume pipeline from resume-flock given a `resume.docx` path:

- **Parser**: `resume_to_flock.py` (in a separate repo, e.g. `RESUME_PARSER_PATH` or `~/workspace-resume/resume-parser`).
- **Invocation**: `python resume_to_flock.py <path-to-resume.docx> -o <output-dir>`.
- **Output dir**: Typically `parsed_resumes/<id>/` (or an external path like `~/workspace-resume/parsed-resumes/parsed-resume-1`); the parser writes `jobs/jobs.mjs` and `skills/skills.mjs` inside it.

**Script:** `scripts/run-parse-resume.mjs` (npm script `parse-resume`) invokes the parser subprocess.

```bash
# Local folder: input docx inside the output dir (from repo root)
npm run parse-resume -- --docx ./parsed_resumes/parsed-resume-0/data-engineer-0.docx --out ./parsed_resumes/parsed-resume-0

# Output to resume-flock’s parsed_resumes/<id> (then symlink or use as currentResumeId)
npm run parse-resume -- --docx /path/to/your/resume.docx --id parsed-resume-2

# Output to another repo (e.g. workspace-resume)
npm run parse-resume -- --docx /path/to/your/resume.docx --out ~/workspace-resume/parsed-resumes/parsed-resume-1
```

Set `RESUME_PARSER_PATH` if the parser repo is not at `../workspace-resume/resume-parser` relative to resume-flock. The script uses the parser’s `venv/bin/python` when present.
