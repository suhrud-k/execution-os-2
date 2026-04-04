# Execution OS 2.0

Mobile-first PWA for daily logging: offline IndexedDB, optional sync to Google Sheets via Google Apps Script. Google Sign-In is intentionally deferred (see [`docs/project_plan.txt`](docs/project_plan.txt)).

**Full documentation (PWA + Apps Script + MCP, single guide):** [`docs/PROJECT_DOCUMENTATION.md`](docs/PROJECT_DOCUMENTATION.md)

## Repository layout

| Path | Purpose |
|------|---------|
| `web/` | React (Vite) + TypeScript + Tailwind + Zustand + React Router 6 |
| `google-apps-script/` | `Code.gs` REST layer and sheet bootstrap |
| `mcp-server/` | Optional **remote MCP** (Vercel + Next.js) — tool `fetch_logs` → Apps Script `get_logs` ([`mcp-server/README.md`](mcp-server/README.md), [full doc](docs/PROJECT_DOCUMENTATION.md)) |
| `docs/` | **[PROJECT_DOCUMENTATION.md](docs/PROJECT_DOCUMENTATION.md)** — end-to-end guide; [`project_plan.txt`](docs/project_plan.txt) — product spec |

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
- `GET ?action=get_logs&start=YYYY-MM-DD&end=YYYY-MM-DD&token=...` — normalized JSON for tooling / MCP ([`google-apps-script/MCP_LOGS_API.md`](google-apps-script/MCP_LOGS_API.md), [full doc §6](docs/PROJECT_DOCUMENTATION.md#6-get_logs--machine-readable-logs-mcp--tooling)). Same secret as `EXECUTION_OS_SECRET`; `secret=` is accepted as an alias for `token`.
- `POST` body JSON: `{ "action": "upsertLog", "secret": "...", "log": { ... } }`  
  The web client sends this as **`Content-Type: text/plain`** with a JSON string body to reduce CORS preflight issues.

If the browser still blocks cross-origin calls to `script.google.com`, use a small serverless proxy on Vercel or temporarily test sync from the same machine with relaxed browser policies—this is a known Apps Script limitation for some clients.

## Sleep hours

**Previous calendar evening’s `sleep_time` → this day’s `wake_time`**, both stored as ISO timestamps. If yesterday’s row is missing sleep, hours stay blank until data exists.

## Work completion % (History)

`(Done=1, Partial=0.5, Not Done=0)` averaged across the three priorities, times 100.

## Auth (later)

Replace or supplement `EXECUTION_OS_SECRET` with Google Sign-In and a token check in `Code.gs` when you are ready; the frontend currently has no OAuth.
