# Local files and secrets

These files are in `.gitignore` and are **never committed or pushed**. They are either secrets or private per-user data.

| File | Purpose | Treat as | Example / init |
|------|---------|----------|----------------|
| **`.env`** | API keys and environment config (e.g. `EXPRESS_PORT`, `VITE_DEV_PORT`, API keys). | **Secrets** | Copy from `.env.example` to create `.env`. See [REPLICATE-PORTS-CONFIG.md](REPLICATE-PORTS-CONFIG.md). |
| **`app_state.json`** | Persisted application state (layout, theme, selection, `currentResumeId`, etc.). Written when a persistent attribute is updated; read at startup / hard-refresh. | Per-user, not shared | **Remedy when missing:** the server initializes it from **`app_state.example.json`** (see below). |

## Remedy when `app_state.json` is missing

**`app_state.example.json`** is committed and synced with remote. It has the full application state structure with **safe defaults and no actual user data** (all private attributes are `null` or default values). When `app_state.json` cannot be located:

1. The server copies `app_state.example.json` to `app_state.json`.
2. The server then reads and returns that state (GET /api/state), so the client gets a valid state without a 404.

If `app_state.example.json` is also missing (e.g. corrupt repo), GET /api/state returns 404 and the client uses in-memory defaults.

## Summary

- **Secrets:** `.env` — never commit; treat as sensitive.
- **Example files (committed):** `.env.example`, **`app_state.example.json`** — safe defaults, no user data; used to initialize the corresponding local files when missing.
- **Persisted state:** `app_state.json` — written by the app; per-user, not committed. When missing, initialized from `app_state.example.json`.
