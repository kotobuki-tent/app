# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

寿テント（Kotobuki Tent）の業務管理アプリ **SEQUENCE LAB** — a tent/event-staging company's internal operations app covering 工程管理・在庫・時間外・車両・日報・工数 across 9 screens. Live at https://kotobuki-tent.github.io/app/spa/spa.html

Pure static site: HTML/CSS/JavaScript, **no framework, no build step, no package manager, no tests, no linter**. Backed by a Google Apps Script endpoint over Google Sheets, hosted on GitHub Pages.

## Workflow / "commands"

There is no build or test tooling. To work here:

- **Edit** the relevant `.html` / `.js` file directly.
- **Preview** by opening the file in a browser (or serve the dir, e.g. `python3 -m http.server`). Note: a Service Worker is active — see caching rules below.
- **Deploy** = commit + `git push origin main`. GitHub Pages serves `main` directly. The remote is SSH (`git@github.com:kotobuki-tent/app.git`).
- **Caching**: editing a root-level MPA page (anything in `PRECACHE_URLS`) requires a `CACHE_VERSION` bump in `sw.js` — but **iller does this manually; never touch `sw.js`** (see Operational rules). The SPA (`spa/spa.html`) is exempt anyway — it's in `NO_CACHE_PATTERNS` and always fetched fresh.

## Architecture

### Two parallel codebases — know which one you're editing

1. **`spa/spa.html`** — the **live product**. A single ~360KB file containing all 9 screens. This is what the public URL serves and what almost all changes target.
2. **Root `*.html`** (`index.html`=生産, `project.html`=企画制作, `sales.html`, `inventory.html`, `vehicle.html`, `overtime.html`, `labor.html`, `daily.html`, `portal.html`) — **legacy standalone MPA pages**, the pre-SPA single-screen versions. Still precached by `sw.js` as a fallback. **Slated for deletion (~1 month out).** Do not invest in them, do not make new edits — the SPA is canonical. **`register.html` is NOT slated for deletion** — it's an independent mobile-only product-add tool that stays.
   - When the legacy MPA pages are eventually deleted, their entries in `sw.js`'s `PRECACHE_URLS` must also be removed — but **iller edits `sw.js` manually** (see Operational rules); flag it, don't touch the file.

### SPA structure (`spa/spa.html`)

Each screen is a **self-contained IIFE namespace** (`Prod`, `Proj`, `Inv`, `Veh`, `Sales`, `Labor`, `Daily`, `Ot`, `Portal`) with private state and a uniform public surface: **`loadAll()`, `render()`, `init()`** plus whatever `onclick` handlers it exposes.

The **`App` registry** (search `const App = {`) is the orchestrator:
- `App.REG` lists every app as `{key, ns:()=>Namespace, section:'view-x', nav:'navX'}`. Registering a new screen = add one row here.
- `App.nav(name)` toggles section `display` and nav `.on` state — **no page reload, ~0s switching**. Lazy-loads data on first visit only (`_loaded`/`_loading` guards).
- Auto-refresh: `setInterval` every 5 min, guarded by `document.visibilityState==='visible'` and `_bgBusy`; **only the currently-visible app's `loadAll()` runs** (never hits GAS for background apps).

### Backend: one GAS endpoint, `?dept=` routing

Single endpoint `API` (`script.google.com/.../exec`, search `const API=`). Every request carries a `dept` param routing to a department handler (`production`/`project`/`sales`/`inventory`/`overtime`/`vehicle`/`daily`/`labor`/`attendance`/`drive`). Each IIFE has its **own** `apiGet`/`apiPost`/`fireAndForget` with its `dept` baked in — they are intentionally duplicated per-namespace, not shared.

- **Reads**: `fetch(API+'?dept=...&action=...')` → JSON.
- **Writes**: `no-cors` POST (`fireAndForget`) — response is opaque, so writes use **optimistic update**: mutate the local array immediately, then `setTimeout(loadAll, 3000)` to reconcile with GAS's real ID assignment. `mergeWithTmp(...)` reconciles optimistic temp rows against server data by a composite key.
- Google Sheets are the DB; sheet/column layout is documented in `README.md`. Google Drive integration (`dept=drive`) links 製作図 files to 生産 orders.

### Conventions baked into the code (preserve these)

- **Double-tap guard**: all write actions (save/delete/伝票check/status change — ~32 sites) set a 1.5s flag to prevent duplicate submissions. Match this when adding write buttons.
- **Error handling**: `apiGet` wraps `try/catch` and returns `null`/`[]` on GAS hiccups so the UI never freezes.
- **Mobile**: every screen has `max-width:768px` media queries; tables convert to cards via `:nth-of-type` + `::before` pseudo-elements. iOS pull-to-refresh suppressed via `overscroll-behavior-y:none`.
- **Search** is DOM-filter style (hides rows, keeps input focus), not a re-render.

## Operational rules (not inferable from the code)

- **Never edit `sw.js`.** `CACHE_VERSION` is managed manually by iller. Do not touch the file, do not bump the version, and do not ask whether it was pushed.
- **Edit by diff, not by rewrite.** Change only the affected lines. Never do a wholesale clear-and-paste of an entire file.
- **Two separate manifests — always confirm which one.** `spa/manifest.json` (SPA, `start_url`=`spa.html`) and root `manifest.json` (MPA, `start_url`=`portal.html`) are different files. Conflating them has broken `start_url` before. Check which manifest you mean before editing either.
- **Working with iller**: be terse — no preamble, no option menus. Don't unilaterally split work into stages or down-prioritize it with "is this worth the effort?" reasoning. If told to do something, do it. Don't slap a "low real-world impact" label on a bug on your own judgment.

## Reference

`README.md` is the authoritative spec for per-screen features, the Google Sheets schema (sheet + column names), and the Drive folder ID. Consult it before touching data shapes.
