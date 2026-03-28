# Execution OS 2.0

Mobile-first PWA for daily logging: offline IndexedDB, optional sync to Google Sheets via Google Apps Script. Google Sign-In is intentionally deferred (see `project_plan.txt`).

## Repository layout

| Path | Purpose |
|------|---------|
| `web/` | React (Vite) + TypeScript + Tailwind + Zustand + React Router 6 |
| `google-apps-script/` | `Code.gs` REST layer and sheet bootstrap |
| `project_plan.txt` | Product spec |

## Local development (frontend)

```bash
cd web
cp .env.example .env
# Leave URL/secret empty for offline-only, or set after Apps Script deploy.
npm install
npm run dev
```

Open the printed URL on your phone (same Wi‑Fi) for tap testing.

## PWA

Production build registers a service worker and serves a web app manifest. Install from the browser menu after deploy. Use **HTTPS** (e.g. Vercel) so install and SW work reliably.

```bash
cd web
npm run build
npm run preview
```

## Vercel

- Root directory: `web`
- Framework: Vite
- Add environment variables `VITE_APPS_SCRIPT_URL` and `VITE_SCRIPT_SECRET` in the project settings (same values as local `.env`).

`vercel.json` rewrites all routes to `index.html` for client-side routing.

## Google Sheets + Apps Script

1. Create a new **Google Sheet** owned by you.
2. **Extensions → Apps Script** → paste `google-apps-script/Code.gs` (and set timezone in Project Settings if you changed `appsscript.json`).
3. **Project Settings → Script properties**:
   - `SPREADSHEET_ID` — ID from the sheet URL (`/d/THIS_PART/edit`)
   - `EXECUTION_OS_SECRET` — long random string (same value as `VITE_SCRIPT_SECRET` in the web app)
4. Run **`setupExecutionOsSheets`** once from the script editor (select function, Run). Authorize when prompted. This creates **Logs**, **Reference**, and **Analytics** and writes column headers.
5. **Deploy → New deployment → Web app**
   - Execute as: **Me**
   - Who has access: **Anyone** (the secret in query/body is your gate until you add OAuth later; the sheet stays private to your Google account)

Copy the **Web app URL** (ends with `/exec`) into `VITE_APPS_SCRIPT_URL`.

### API contract

- `GET ?action=getLog&date=YYYY-MM-DD&secret=...`
- `GET ?action=getRecentLogs&secret=...` (last **14** calendar days, script timezone)
- `POST` body JSON: `{ "action": "upsertLog", "secret": "...", "log": { ... } }`  
  The web client sends this as **`Content-Type: text/plain`** with a JSON string body to reduce CORS preflight issues.

If the browser still blocks cross-origin calls to `script.google.com`, use a small serverless proxy on Vercel or temporarily test sync from the same machine with relaxed browser policies—this is a known Apps Script limitation for some clients.

## Sleep hours

**Previous calendar evening’s `sleep_time` → this day’s `wake_time`**, both stored as ISO timestamps. If yesterday’s row is missing sleep, hours stay blank until data exists.

## Work completion % (History)

`(Done=1, Partial=0.5, Not Done=0)` averaged across the three priorities, times 100.

## Auth (later)

Replace or supplement `EXECUTION_OS_SECRET` with Google Sign-In and a token check in `Code.gs` when you are ready; the frontend currently has no OAuth.
