# Gift Card Studio

Pick a Diwali card design, type the recipient and sender names, preview, and download a PNG.
React + Vite + React Konva in the browser, Express on the server, JSON files for storage. No database.

## Run it

Needs Node.js 18 or newer.

```bash
npm run setup      # installs root, client and server packages
npm run dev        # server on :3001, client on :5173
```

Open http://localhost:5173.

Optional: set the values from `server/.env.example` in your shell
(`LAYOUT_TOKEN=secret npm run dev`). If `LAYOUT_TOKEN` is set, saving a layout needs that password.
When `NODE_ENV=production`, layout saving is refused unless `LAYOUT_TOKEN` is set.

Tests: run `npm test` from the project root. This runs the server and client test suites.

## The three pages

| Page | File | What it does |
|---|---|---|
| Studio | `client/src/pages/StudioPage.jsx` | choose design, fill form, download PNG |
| Activity history | `client/src/pages/ActivityPage.jsx` | search/filter/page through past downloads |
| Layout setup | `client/src/pages/LayoutPage.jsx` | drag text, change numbers, save positions |

Details of every file: see `FILE_ANALYSIS.md`.

## Your four images

| Image | Registered as | Why |
|---|---|---|
| Orange diyas (960x1600, empty bottom) | `diwali-blank` | blank: we add recipient, greeting, closing, sender |
| Golden diyas, greeting only | `diwali-gold` | partial: add recipient, closing, sender |
| Bells and lamps, greeting only | `diwali-bells` | partial: add recipient, closing, sender |
| Golden diyas with "Dear Vaikhari / Anand" already printed | NOT registered | names are baked into the pixels and cannot be removed by code. The clean golden card above is the same design without names, so it is used instead. The printed one is only the reference for where the text goes. |

## Add a new design

1. Copy the image to `client/public/cards/` (example: `diwali-new.jpg`).
2. Open `client/src/config/templates.js` and copy one of the three entries.
3. Change `id` (unique, no spaces), `name`, `image`, `width` and `height` (real pixel size of the image).
4. Pick the blocks:
   - Blank card: use `dearBlock`, a greeting block, `closingBlock`, `senderBlock`.
   - Greeting already printed: use `dearBlock`, `closingBlock`, `senderBlock` and list the printed text in `fixedContent`.
5. Set `x`, `y`, `width`, `fontSize`, `color` (use Layout Setup to find good numbers).
6. Restart the server (it reads the same file).

Always use the clean image (no names printed). Text already in the pixels cannot be replaced by changing a variable.

## Coordinates

- `x`, `y`, `width` are percent of the original image. `x: 50` = middle, `y: 80` = 80% down.
- `fontSize` is pixels on the original image (so 16 on a 600 px wide card is 16/600 of the width).
- `x` depends on `align`: left edge for `left`, middle for `center`, right edge for `right`.
- `y` is the top of the text box.
- Green dashed box in Layout Setup = `safeArea`. Text outside it blocks the download.

Layout Setup steps: open the page, pick the design, drag a layer or type numbers, press **Save layout**.
Saved values go to `server/data/layout-overrides.json`; `templates.js` is never edited by the app.
"Reset this layer" puts the values from `templates.js` back (then press Save to keep it).

## API

Base: `http://localhost:3001/api`. Errors are `{ "error": "message" }`.

| Method and path | Purpose |
|---|---|
| `GET /health` | `{ ok: true }` |
| `GET /templates` | all templates with saved layout applied |
| `GET /templates/:id` | one template |
| `PUT /templates/:id/layout` | body `{ "blocks": { "sender": { "x": 10, "y": 80 } } }`, header `x-layout-token` when `LAYOUT_TOKEN` is set |
| `GET /activities` | query: `search`, `templateId`, `from`, `to` (YYYY-MM-DD), `page`, `pageSize` |
| `POST /activities` | body: templateId, recipientName, senderName, greetingText?, exportWidth, exportHeight, exportFormat "png". Returns record with server ID and time, status `export_started` |
| `PATCH /activities/:id/status` | body `{ "status": "download_triggered" \| "failed", "errorMessage"? }` |

Status meanings: `export_started` (record made), `download_triggered` (the browser began the download), `failed` (export error).
The app cannot know if the file was really saved on the user's device.

## Known limitations

- JSON files suit one server and low traffic. Several servers or heavy parallel writes need a real database. Only `server/src/storage.js` would change.
- Layout password is a single shared token. Use proper login before a public deployment.
- Names already printed in an image cannot be removed; supply a clean image.
- Fonts come from Google Fonts. Offline, the canvas falls back to a system font and text widths change slightly.
- Date filters use UTC days.
