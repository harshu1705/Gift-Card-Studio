# File-level analysis

Where things live, in one sentence each, then file by file.

**Coordinate logic** is in 3 files: `config/templates.js` (the numbers), `config/coords.js` (percent <-> pixel math), `components/CardCanvas.jsx` (draws using them).
**Backend logic** is in 4 files: `server.js` (start), `routes.js` (URLs), `validation.js` (input rules), `storage.js` (files on disk).

## How a download flows

1. Studio page shows the form built from `templates.js` blocks.
2. Typing changes `values`; `CardCanvas` redraws (text from `cardText.blockText`, position from `coords.boxLeftPx`).
3. Download pressed: `checkBlock` makes sure every text fits.
4. `api.createActivity` -> `POST /api/activities` -> `routes.js` -> `validation.js` -> `storage.createActivity` -> `activities.json`. Status `export_started`.
5. `exportPng` redraws the card at full original size and `downloadDataUrl` starts the browser download.
6. `api.updateActivityStatus` -> `PATCH` -> status `download_triggered` (or `failed`).

## Root

| File | Job |
|---|---|
| `package.json` | `setup`, `dev` (runs both apps), `test` |
| `.gitignore` | ignores node_modules, `.env`, `activities.json` (layout-overrides.json is kept) |
| `README.md` | run, add a design, coordinates, API, limits |

## Client (browser)

### Config - the coordinate logic

| File | What is inside |
|---|---|
| `src/config/templates.js` | **All card positions.** Three templates, each with `image`, `width`, `height`, `mode`, `fixedContent`, `safeArea` and `blocks`. A block = `id, label, kind (input/static), required, default, prefix/suffix, maxLength, maxLines, x, y, width, fontSize, fontFamily, fontWeight, color, align, lineHeight`. Also `FONTS`, `STYLE_FIELDS` and `applyLayout()` which lays saved changes over a template. No imports, so the server reads it too. |
| `src/config/coords.js` | Pure math. `toPx`, `toPercent`, `boxLeftPx` (x anchor -> Konva left edge, depends on align), `anchorPercentFromLeft` (reverse, used after dragging), `insideSafeArea`. |
| `src/config/cardText.js` | `blockText` (what a block prints; empty input prints nothing, nothing is invented), `checkBlock` (too many lines? outside safe area? returns a sentence), `loadFonts` (waits for fonts). Uses Konva only to measure. |
| `src/config/coords.test.js` | 7 tests: conversions, alignment, drag round trip, safe area, `applyLayout`, template sanity. |

### Services

| File | Job |
|---|---|
| `src/services/api.js` | Every `fetch` to the server: templates, activities, status, layout. Turns failures into readable messages. |
| `src/services/exportPng.js` | `exportPng` (stage to full-size PNG, restores the preview after), `makeFileName` (unicode-safe), `downloadDataUrl`. |

### Components (reusable pieces)

| File | Job |
|---|---|
| `components/CardCanvas.jsx` | The only drawing code. Draws the image, then each text block at `boxLeftPx` / `y%`. In layout mode text is draggable and shows the safe area and selected box. Preview, layout and export share it. |
| `components/TemplateGallery.jsx` | Thumbnails list, or the empty-state steps when there are no templates. |
| `components/LayoutControls.jsx` | X/Y sliders, width, size, font, weight, alignment, color, reset for one block. Reports changes only. |
| `components/ActivityTable.jsx` | The table plus loading, error (with retry) and empty states. |

### Pages (one file each)

| File | Job |
|---|---|
| `pages/StudioPage.jsx` | Pick design, form from blocks, live checks, Download PNG. Keeps typed names when switching designs. |
| `pages/ActivityPage.jsx` | Search, template and date filters, page buttons. Calls `GET /activities` after a short pause in typing. |
| `pages/LayoutPage.jsx` | Layer list, drag-to-move (pixels -> percent), numeric controls, `draft` of unsaved changes, Save / Discard. A failed save keeps the draft. |

### App shell

| File | Job |
|---|---|
| `src/App.jsx` | Top navigation, loads templates once (falls back to built-in ones if the server is down), shows the three pages. |
| `src/main.jsx` | Mounts React. |
| `src/styles.css` | All styling, one file. Three columns on desktop, stacked on phones with a fixed Download bar. |
| `index.html`, `vite.config.js`, `package.json` | Fonts, dev proxy `/api` -> port 3001, dependencies. |
| `public/cards/` | The three card images. |

## Server (backend)

| File | Job |
|---|---|
| `src/server.js` | Express setup: CORS for one origin, 20 kb JSON limit, `/api` routes, one error handler. |
| `src/routes.js` | The endpoints. Each does: validate -> call storage -> reply. Merges default template + saved layout. `requireLayoutAccess` guards the layout PUT. Knows nothing about JSON files. |
| `src/validation.js` | zod rules for every request, the `HttpError` class and `parse()`. Fonts are limited to a list, colors to `#rrggbb`, numbers to ranges. |
| `src/storage.js` | **Only file that touches disk.** `listActivities`, `createActivity`, `updateActivityStatus`, `getTemplateLayout`, `saveTemplateLayout`. Writes go through a one-at-a-time queue and a temp-file-then-rename; damaged JSON is reported and never overwritten; success is returned only after the write worked. |
| `data/activities.json` | History. |
| `data/layout-overrides.json` | Saved positions: `{ templateId: { version, blocks: { blockId: {...} } } }`. |
| `test/storage.test.js` | Create, newest-first, search, 20 parallel writes, status update, layout versions, damaged JSON. |
| `test/validation.test.js` | Good and bad requests. |

## Moving to a database later

Rewrite `storage.js` only, keeping the five function names and return shapes. Routes, validation, the React app and the API stay the same.
