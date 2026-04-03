# Execution OS — MCP server (Vercel)

Next.js app that exposes **Streamable HTTP MCP** at **`/api/mcp`** with tool **`fetch_logs`** → Google Apps Script **`get_logs`**.

**[→ Full project documentation (PWA + Apps Script + MCP)](../docs/PROJECT_DOCUMENTATION.md)**

---

## Quick reference

| Item | Detail |
|------|--------|
| **MCP URL** | `https://<mcp-deployment-host>/api/mcp` |
| **Root directory (Vercel)** | `mcp-server` (separate project from PWA `web/`) |
| **Env** | `APPS_SCRIPT_BASE_URL`, `APPS_SCRIPT_TOKEN` — see [`.env.example`](.env.example) |
| **Key files** | [`app/api/mcp/route.ts`](app/api/mcp/route.ts), [`src/lib/register-tools.ts`](src/lib/register-tools.ts) |
| **Temp browser checks** | `GET /api/verify-deployment`, `GET /api/sheet-logs?start=&end=` |
| **ChatGPT** | No extra connector auth; disable Vercel Deployment Protection so MCP is reachable |

Local dev: `cp .env.example .env.local`, `npm install`, `npm run dev` → `http://localhost:3000/api/mcp`.
