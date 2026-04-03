# Execution OS — remote MCP server (Vercel)

Minimal **read-only** MCP server that exposes **`fetch_logs(start_date, end_date)`** and proxies to your existing Google Apps Script **`get_logs`** endpoint.

**Architecture:** ChatGPT (remote MCP) → this server on Vercel → Apps Script → Google Sheet.

---

## 1. Transport choice and rationale

| Choice | **Streamable HTTP** (MCP 2025-03-26), via Vercel’s official **`mcp-handler`** + **`@modelcontextprotocol/sdk`**. |
|--------|---------------------------------------------------------------------------------------------------------------------|
| **Why** | Remote ChatGPT MCP expects HTTP-based MCP, not stdio. Streamable HTTP maps cleanly to **stateless serverless** `GET`/`POST` handlers—no long-lived WebSocket. SSE is optional and **disabled** here (`disableSse: true`) to match current spec emphasis and keep Vercel behavior predictable. |
| **Assumptions** | Node **18+** on Vercel. Each MCP request is a short request/response (Apps Script + sheet read). **Stateful session resumption** across invocations is not supported (normal for serverless). |

---

## 2. Project structure

| Path | Role |
|------|------|
| `app/api/[transport]/route.ts` | Next.js route; **`transport=mcp`** → Streamable HTTP MCP endpoint URL **`/api/mcp`**. |
| `src/lib/env.ts` | Validates `APPS_SCRIPT_BASE_URL` / `APPS_SCRIPT_TOKEN`. |
| `src/lib/dates.ts` | Strict `YYYY-MM-DD` validation. |
| `src/lib/apps-script.ts` | HTTP GET to Apps Script `action=get_logs`. |
| `src/lib/register-tools.ts` | Registers MCP tools (extend here for `fetch_recent_logs`, etc.). |
| `vercel.json` | `maxDuration: 60` for API routes. |

**Why Next.js:** Vercel’s **`mcp-handler`** targets Next (and Nuxt). A bare serverless function would re-implement the MCP HTTP framing by hand; this stack is the most reliable default for “remote MCP on Vercel” today.

---

## 3. Environment variables

Copy `.env.example` → `.env.local` for local dev.

| Variable | Description |
|----------|-------------|
| `APPS_SCRIPT_BASE_URL` | Full web app URL ending in `/exec` (no query string). |
| `APPS_SCRIPT_TOKEN` | Same secret as Google Script `EXECUTION_OS_SECRET` (query param `token`). |
| `VERBOSE_MCP_LOGS` | Optional. Set to `1` to enable verbose `mcp-handler` logging. |

---

## 4. GitHub setup (exact commands)

From this folder (`mcp-server/`):

```bash
git init
git add .
git commit -m "feat: Vercel MCP server with fetch_logs tool"
```

Create an empty repo on GitHub (no README), then:

```bash
git remote add origin https://github.com/YOUR_USER/YOUR_REPO.git
git branch -M main
git push -u origin main
```

To track this folder **inside** the monorepo instead, add `mcp-server/` from the repo root and commit there (no `git init` inside `mcp-server`).

---

## 5. Vercel deployment

### Dashboard

1. **Import** the GitHub repo (or connect the monorepo and set **Root Directory** to `mcp-server`).
2. **Framework preset:** Next.js (auto-detected).
3. **Environment variables** (Production + Preview as needed):
   - `APPS_SCRIPT_BASE_URL`
   - `APPS_SCRIPT_TOKEN`
4. **Deploy.**

### Settings

- **Node.js:** 18.x or 20.x (matches `engines` in `package.json`).
- **Function duration:** `vercel.json` sets **60s** for `app/api/**` (adjust if Apps Script is slow).

### Verify

- Open `https://YOUR_PROJECT.vercel.app/` — you should see the short landing text.
- MCP URL for clients: **`https://YOUR_PROJECT.vercel.app/api/mcp`**

### Manual test (sanity)

MCP uses JSON-RPC over HTTP; a full handshake is verbose. Quick checks:

```bash
# Should not 404 (exact body depends on MCP protocol)
curl -sS -o /dev/null -w "%{http_code}\n" "https://YOUR_PROJECT.vercel.app/api/mcp"
```

For a full client test, use **ChatGPT developer MCP** or a local MCP inspector pointed at the same URL.

### Serverless caveats

- **Cold starts** add latency on first request after idle.
- **No in-memory sessions** between requests; stateless mode is intentional.
- **Timeouts:** keep date ranges reasonable so Apps Script finishes within `maxDuration`.

---

## 6. Connecting this MCP server to ChatGPT later

| Topic | Guidance |
|-------|-----------|
| **URL** | In ChatGPT **developer / connector** UI, use the **MCP endpoint**: `https://YOUR_PROJECT.vercel.app/api/mcp` (Streamable HTTP). |
| **Prerequisites** | Vercel env vars set; Apps Script **deployed** and `get_logs` working when called manually with `token`, `start`, `end`. |
| **Auth (v1)** | **No extra MCP auth** in this repo: security is **Vercel URL obscurity + Apps Script token** inside server env. Anyone who can call your MCP URL triggers server-side calls **only** with your stored token. For stricter setups, add **`experimental_withMcpAuth`** from `mcp-handler` later (Bearer JWT, etc.). |
| **First test prompt** | After the connector is connected: *“Use fetch_logs with start_date 2026-04-01 and end_date 2026-04-03 and summarize how many log rows came back.”* |

---

## 7. Future extension notes

- Add **`fetch_recent_logs(days)`** in `src/lib/register-tools.ts`: validate `days` (e.g. 1–366), compute `end = today`, `start = end - (days-1)` in **IST or UTC** (pick one and document), then call `fetchLogsFromAppsScript`.
- Add **`fetch_week_summary(week_start)`**: derive `[start,end]` for that ISO week, call the same helper, aggregate in the tool handler (or a new `src/lib/summary.ts`).

Keeping **one Apps Script client** (`fetchLogsFromAppsScript`) avoids duplication.

---

## Local development

```bash
cd mcp-server
cp .env.example .env.local
# fill APPS_SCRIPT_BASE_URL and APPS_SCRIPT_TOKEN
npm install
npm run dev
```

MCP endpoint: `http://localhost:3000/api/mcp`

---

## Tool: `fetch_logs`

| Input | Type | Rule |
|-------|------|------|
| `start_date` | string | Required, `YYYY-MM-DD`, valid calendar date. |
| `end_date` | string | Required, `YYYY-MM-DD`, valid calendar date. |

**Behavior:** Validates dates, ensures `start_date <= end_date`, calls Apps Script with `action=get_logs&start=&end=&token=`. Returns the **JSON payload as text** on success. On Apps Script `success: false` or misconfiguration, returns **`isError: true`** with a JSON `{ "error": "..." }` body.

Normalization of row fields is done **in Apps Script** (already implemented in your `Code.gs`).
