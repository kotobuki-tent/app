# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

寿テント（Kotobuki Tent）の業務管理アプリ **SEQUENCE LAB** — a tent/event-staging company's internal operations app covering 案件・工程管理・在庫・時間外・車両・日報・工数・点呼(アルコール)・リフト点検 across 12 screens. Live at https://kotobuki-tent.github.io/app/spa/spa.html

Pure static site: HTML/CSS/JavaScript, **no framework, no build step, no package manager, no tests, no linter**. Backed by a Google Apps Script endpoint over Google Sheets, hosted on GitHub Pages.

## Workflow / "commands"

There is no build or test tooling. To work here:

- **Edit** the relevant `.html` / `.js` file directly.
- **Preview** by opening the file in a browser (or serve the dir, e.g. `python3 -m http.server`). Note: a Service Worker is active — see caching rules below.
- **Deploy** = commit + `git push origin main`. GitHub Pages serves `main` directly. The remote is SSH (`git@github.com:kotobuki-tent/app.git`).
- **Caching**: editing `register.html` (the only HTML still in `PRECACHE_URLS`) requires a `CACHE_VERSION` bump in `sw.js` — but **iller does this manually; never touch `sw.js`** (see Operational rules). The SPA (`spa/spa.html`) is exempt anyway — it's in `NO_CACHE_PATTERNS` and always fetched fresh.

## Architecture

### Codebase layout — pure SPA

1. **`spa/spa.html`** — the **live product** and essentially the whole app. A single ~470KB file containing all 12 screens. Almost every change targets this file.
2. **`register.html`** — the only other live page: an independent mobile-only product-add tool (`dept=inventory`). Kept deliberately; not part of the SPA, distributed by its own URL/home-screen icon.

The legacy standalone MPA pages (`index/project/sales/inventory/vehicle/overtime/labor/daily/portal.html`) and the old standalone `alcohol.html` / `forklift.html` / `safety.html` were **deleted** — the app is now pure-SPA. アルコールチェック (`dept=alcohol`, sheet `alcohol_checks`, nav 点呼), フォークリフト点検 (`dept=forklift`, sheet `forklift_checks`, nav リフト), and いないカード＝ホームセンター売掛カードの持ち出し/返却 (`dept=card`, sheet `card_loans`, nav カード, IIFE `Card`) are now SPA screens (IIFEs `Alc`/`Fork`/`Card`). Kiosk tablets (事務所前の27インチMegPad・縦置き運用) open them via `spa/spa.html?go=alcohol|forklift|card&mode=kiosk` (点検モード). `sw.js` `PRECACHE_URLS` now lists only `register.html`/`manifest.json`/icons.

### SPA structure (`spa/spa.html`)

Each screen is a **self-contained IIFE namespace** (`Prod`, `Proj`, `Inv`, `Veh`, `Sales`, `Labor`, `Daily`, `Ot`, `Portal`, `Cases`, `Alc`, `Fork`, `Card`) with private state and a uniform public surface: **`loadAll()`, `render()`, `init()`** plus whatever `onclick` handlers it exposes.

The **`App` registry** (search `const App = {`) is the orchestrator:
- `App.REG` lists every app as `{key, ns:()=>Namespace, section:'view-x', nav:'navX', zone}`. Registering a new screen = add one row here. `zone` (`field`/`shared`/`office`) drives 端末モード: `App.mode` (`floor`/`full`/`kiosk`, from localStorage or URL `?mode=`) — `floor` hides `office` zones, `kiosk` (点検モード, 事務所前タブレット用) shows only `KIOSK_KEYS`=日報/点呼/リフト/カード via the `data-kiosk` attribute. `?go=<key>` deep-links a screen on load.
- `App.nav(name)` toggles section `display` and nav `.on` state — **no page reload, ~0s switching**. Lazy-loads data on first visit only (`_loaded`/`_loading` guards).
- Auto-refresh: `setInterval` every 5 min, guarded by `document.visibilityState==='visible'` and `_bgBusy`; **only the currently-visible app's `loadAll()` runs** (never hits GAS for background apps).

### Backend: one GAS endpoint, `?dept=` routing

Single endpoint `API` (`script.google.com/.../exec`, search `const API=`). Every request carries a `dept` param routing to a department handler (`production`/`project`/`sales`/`inventory`/`overtime`/`vehicle`/`daily`/`labor`/`attendance`/`drive`/`factory`/`alcohol`/`forklift`/`cases`/`card`). Each IIFE has its **own** `apiGet`/`apiPost`/`fireAndForget` with its `dept` baked in — they are intentionally duplicated per-namespace, not shared.

- **Reads**: `fetch(API+'?dept=...&action=...')` → JSON.
- **Writes**: `no-cors` POST (`fireAndForget`) — response is opaque, so writes use **optimistic update**: mutate the local array immediately, then `setTimeout(loadAll, 3000)` to reconcile with GAS's real ID assignment. `mergeWithTmp(...)` reconciles optimistic temp rows against server data by a composite key.
- Google Sheets are the DB; sheet/column layout is documented in `README.md`. Google Drive integration (`dept=drive`) links 製作図 files to 生産 orders.
- **GAS source of truth = `Code.gs`** (kept in iCloud `♿️SEQUENCE LAB/`, NOT in this git repo; ~1500 lines). To change GAS: edit `Code.gs`, syntax-check with JavaScriptCore (`/System/Library/Frameworks/JavaScriptCore.framework/Versions/A/Helpers/jsc` via `new Function(src)`), then in Apps Script do 全消し→貼る + save. Redeploy ("new version of the existing deployment") only when web handlers change — manual/trigger functions just need save. `dept=factory` (資材, front-end currently hidden) and the 工数 archive (`dept=labor` POST → `archive`/`unarchive` flips the `labor_archived` column on `orders`, independent of 生産's `archived`) both live here.

### GAS infrastructure & failure modes

- **`keepAlive` trigger**: a 5-min time-based GAS trigger calls a no-op (`getSpreadsheet().getName()`) to keep the script warm. **Never delete it** — without it the first request each morning hits a cold start and the whole app is very slow. If mornings are slow, check this trigger first (an auth lapse can disable all triggers → re-authorize).
- **API URL is hardcoded** in `spa/spa.html` (`const API=...exec`). All 12 screens depend on this single GAS endpoint, so if it dies everything dies at once. Update GAS via "deploy a new version of the **existing** deployment" only — recreating the deployment changes the URL. If the URL ever does change, rewrite the `API` constant in `spa/spa.html` to the new URL (top priority to restore service).
- **Failure triage**: slow only in the morning → cold start, suspect `keepAlive`. No response at all hours → suspect the GAS deployment / URL.
- **Backups & archive (GAS triggers — don't delete)**: `weeklyBackup` (Mon 4am) copies the whole spreadsheet to Drive `業務管理_backups` (keeps 8 generations). `emailBackupXlsx` (Mon 5am) emails an xlsx to `iller.sao@gmail.com` — an off-account copy = account-loss insurance. `archiveDailyReports` (manual, run after 決算 — fiscal year is Apr→Mar) moves one fiscal year of `daily_reports` into a `daily_reports_YYYY年度` sheet to keep the live sheet (and 工数 aggregation) fast. Restore = open the dated Drive copy or the archive sheet.

### Conventions baked into the code (preserve these)

- **Double-tap guard**: all write actions (save/delete/伝票check/status change — ~32 sites) set a 1.5s flag to prevent duplicate submissions. Match this when adding write buttons.
- **Error handling**: `apiGet` wraps `try/catch` and returns `null`/`[]` on GAS hiccups so the UI never freezes.
- **Mobile**: every screen has `max-width:768px` media queries; tables convert to cards via `:nth-of-type` + `::before` pseudo-elements. iOS pull-to-refresh suppressed via `overscroll-behavior-y:none`. The mobile blocks (`@media(max-width:480px){`) also fire on `(orientation:portrait)` — so a wide **portrait** screen (1F's 27" vertical tablet) gets the card layout (no horizontal-scroll tables); landscape (2F / office PC) stays tabular.
- **Search** is DOM-filter style (hides rows, keeps input focus), not a re-render.

## Operational rules (not inferable from the code)

- **Never edit `sw.js`.** `CACHE_VERSION` is managed manually by iller. Do not touch the file, do not bump the version, and do not ask whether it was pushed.
- **Edit by diff, not by rewrite.** Change only the affected lines. Never do a wholesale clear-and-paste of an entire file.
- **Two separate manifests — always confirm which one.** `spa/manifest.json` (SPA, `start_url`=`./spa.html`) and root `manifest.json` (now also points at the SPA, `start_url`=`./spa/spa.html`) are different files. Conflating them has broken `start_url` before. Check which manifest you mean before editing either. Both use a white `theme_color` (#ffffff).
- **Never touch in the Google Sheet**: row 1 (the header row) or column A (the `id` column) of any sheet — the GAS handlers key off these. Corrupting them breaks reads/writes app-wide.
- **Never delete the `.hidden` CSS rule** (`display:none!important`) — section switching and show/hide logic across the SPA depend on it.
- **Edit the GAS in the REAL project, not a backup copy.** `weeklyBackup` makes full spreadsheet copies, and each copy carries its own editable bound Apps Script. Always reach the live GAS via the 業務管理 spreadsheet → 拡張機能 → Apps Script. Tell-tale: if "デプロイを管理" shows *no deployments*, you've opened a backup copy — back out.
- **Working with iller**: be terse — no preamble, no option menus. Don't unilaterally split work into stages or down-prioritize it with "is this worth the effort?" reasoning. If told to do something, do it. Don't slap a "low real-world impact" label on a bug on your own judgment.

## Reference

`README.md` is the authoritative spec for per-screen features, the Google Sheets schema (sheet + column names), and the Drive folder ID. Consult it before touching data shapes.
