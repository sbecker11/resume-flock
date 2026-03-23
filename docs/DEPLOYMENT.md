# Deployment notes

## GitHub Pages (static build)

Workflow: [`.github/workflows/deploy-github-pages.yml`](../.github/workflows/deploy-github-pages.yml). It runs on push to **`master`** and on **workflow dispatch**.

### Checklist

1. **Palette catalog URL (required)**  
   The production bundle does **not** call `/api/palette-catalog` (there is no Express server on Pages). The client loads the NDJSON catalog from a URL **baked at build time** as `import.meta.env.S3_PALETTE_CATALOG_RESOLVED` (see `vite.config.js` and `modules/utils/paletteCatalogS3Url.mjs`).

   Configure **one** of the following for the build job (repository or **`github-pages`** environment secrets/variables):

   - **`S3_COLOR_PALETTES_JSON_URL`** — full `https://…` URL to the `.jsonl` catalog, **or**
   - **`S3_IMAGES_BUCKET`** + **`AWS_REGION`** (or **`S3_REGION`**) + **`S3_PALETTES_JSONL_KEY`**, **or**
   - Legacy: **`S3_BUCKET`** + **`S3_REGION`** + **`S3_COLOR_PALETTES_OBJECT_KEY`**

   If those are unset, the workflow runs **`scripts/apply-committed-palette-catalog-env.mjs`**, which can set the URL from a committed file:

   - **`config/github-pages-palette-catalog.url`** — single HTTPS URL on the first line (see `config/github-pages-palette-catalog.url.example`).

   **`scripts/verify-palette-catalog-env.mjs`** runs before `npm run build` and **fails the job** if no catalog URL resolves. Fix secrets/vars or the committed URL file, then re-run the workflow.

2. **Base path**  
   The build step sets **`VITE_BASE: /resume-flyer/`**. That must match the GitHub Pages path for this repo (`https://<user>.github.io/resume-flyer/`). If you rename the repo or use a custom domain, update **`VITE_BASE`** in the workflow to match.

3. **S3 CORS**  
   The browser fetches the catalog from S3 (or another HTTPS host). The bucket (or CDN) must allow **GET** from your Pages origin (e.g. `https://<user>.github.io`) or you will see network/CORS errors in the console.

4. **Artifacts copied into `dist/`**  
   Besides Vite output, the workflow copies **`parsed_resumes/`** (via `scripts/generate-parsed-resumes-index.mjs`) and **`static_content/`** (icons, media). Optional local-only **`static_content/colorPalettes/`** is **not** required for Pages if the catalog URL is configured.

5. **After deploy**  
   Hard-refresh or verify the **new hashed** `index-*.js` in the Network tab so you are not on a cached old bundle.

### Console expectations

- **No** `GET …/api/palette-catalog` **404** on production: intentional; prod skips `/api` palette routes.
- **`[Violation] Forced reflow`**: Chromium performance hints, not application errors (see parallax/scene measurement timing if you tune further).

---

## Local development (`npm run dev`)

- **Backend + Vite**: `npm run dev` starts Express (palette API, state API, etc.) and Vite with **`/api` proxied** to the backend. Palettes load from **`/api/palette-catalog`** first when available, then S3 if needed (see `modules/composables/useColorPalette.mjs`).
- **`.env`**: Copy from **`.env.example`**. For palette warmup without S3, the server can prime from **`static_content/colorPalettes/*.json`** when no S3 URL is set (see server startup in `server.mjs`).
- Ports and proxy: **[REPLICATE-PORTS-CONFIG.md](REPLICATE-PORTS-CONFIG.md)**.

---

## Related docs

- **[LOCAL-FILES-AND-SECRETS.md](LOCAL-FILES-AND-SECRETS.md)** — `.env`, `app_state.json`, and how they differ on Pages vs local.
- **`.env.example`** (repo root) — variable names for palette/S3 and ports.
