# Manual Test Checklist — Resume Details Editor

Use this when testing the **resume-flyer** app: **Resume Details** modal (`modules/resume-details-editor`), **Print**, and related resume-manager flows. Requires the **Express API** (e.g. `npm run dev` with backend + Vite).

## Prerequisites

- **`npm run dev`** running (frontend + backend; `/api` must be available for meta, other-sections, print fallback)
- A **non-default** resume selected: `currentResumeId` must not be `'default'` (parsed folder under `parsed_resumes/`). Details/Print use `v-if="currentResumeId && currentResumeId !== 'default'"` in `ResumeContainer.vue`.
- DevTools console open for errors

---

## 1. Entry Points

| # | Action | Expected |
|---|--------|----------|
| 1.1 | Load app with **`default`** resume (or no parsed resume selected) | **Details** and **Print** buttons **hidden** |
| 1.2 | Select a parsed resume (dropdown or **Manage Resumes**) | **Details**, **Print** **visible** |
| 1.3 | Click **Details** | Modal opens; tab bar includes **Meta**, **Other sections**, **Resume jobs**, **Job skills** (see `ResumeDetailsEditor.vue`) |

---

## 2. Meta Tab

| # | Action | Expected |
|---|--------|----------|
| 2.1 | Open Details, select Meta tab | displayName, fileName editable; id, createdAt read-only |
| 2.2 | Change displayName, click Save | Success; modal closes; list/header reflects new name on reload/refresh |
| 2.3 | Open again, change fileName, Save | `meta.json` in the resume folder updated (via PATCH `/api/resumes/:id/meta` or filesystem) |

**Note:** The modal **footer Save** persists **Meta** and **Other sections** only. **Resume jobs** and **Job skills** use the **Save** control **inside** those tabs.

---

## 3. Other Sections Tab

| # | Action | Expected |
|---|--------|----------|
| 3.1 | Edit Summary, Title | Values persist on Save |
| 3.2 | Fill Contact (name, email, phone, etc.) | All fields saved |
| 3.3 | Add certification (name, optional URL, optional description) | Row appears; footer **Save** creates/updates **`other-sections.json`** (PATCH `/api/resumes/:id/other-sections`) |
| 3.4 | Add website (label, URL, optional description) | Same |
| 3.5 | Add other section (title, subtitle, description) | Same |
| 3.6 | Remove item (×) | Item removed on Save |
| 3.7 | Save with empty/minimal data | No errors; file created/updated |

---

## 4. Create-If-Missing

| # | Action | Expected |
|---|--------|----------|
| 4.1 | Use resume that has no **`other-sections.json`** yet | **Other sections** tab shows empty defaults. With server, `/api/resumes/:id/other-sections` may **404**; `getResumeOtherSections` then tries static `parsed_resumes/<id>/other-sections.json`, else `{}`. |
| 4.2 | Add data, footer **Save** | **`other-sections.json`** created in the resume folder under `parsed_resumes/<id>/` |

---

## 5. Print

| # | Action | Expected |
|---|--------|----------|
| 5.1 | Edit Other Sections (summary, contact, certifications, websites) | — |
| 5.2 | Click **Print** | New tab opens with HTML built client-side (`buildPrintHtml` + live jobs from `getGlobalJobsDependency`, plus fetched skills/categories/other-sections). On failure, fallback opens **`/api/resumes/:id/html`** (pre-rendered `resume.html` if present). |
| 5.3 | Verify | Summary, contact, certifications, websites render correctly |
| 5.4 | Verify escaping | Values with `<`, `>`, `&` appear safe, not as HTML |

---

## 6. Errors & Edge Cases

| # | Action | Expected |
|---|--------|----------|
| 6.1 | Cancel without saving | Modal closes; no changes persisted |
| 6.2 | Network/server error during footer **Save** | Browser **`alert`** with message; modal **stays open** (`ResumeDetailsEditor.save` catch path) |
| 6.3 | Refresh page after save | Data still present in Details |
| 6.4 | Switch resume while Details open | Modal **stays open**; **Meta** / **Other sections** reload for the new id (`ResumeDetailsEditor` watches `isOpen` + `resumeId`) |

---

## Quick Smoke

1. Select a **non-default** parsed resume → **Details** available → open modal
2. **Meta** → change displayName → footer **Save** → success (modal closes; list/name refresh per app)
3. **Other sections** → edit summary + one certification → footer **Save** → success
4. **Print** → new tab with HTML (or API fallback)

**Not covered here:** GitHub Pages static deploy (no `/api`); see **[DEPLOYMENT.md](DEPLOYMENT.md)**. This checklist is for **local dev with backend**.
