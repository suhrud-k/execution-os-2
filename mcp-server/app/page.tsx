export default function Home() {
  return (
    <main>
      <h1>Execution OS MCP server</h1>
      <p>
        MCP Streamable HTTP endpoint:{' '}
        <code>/api/mcp</code> (use your deployed origin as the base URL).
      </p>
      <p>Tool: <code>fetch_logs</code> — proxies to Google Apps Script <code>get_logs</code>.</p>
      <p>
        Debug (temp): <a href="/api/debug-ping"><code>/api/debug-ping</code></a>
        {' · '}
        <a href="/api/debug-fetch-logs?start=2026-03-30&end=2026-04-02">
          <code>/api/debug-fetch-logs</code>
        </a>
      </p>
    </main>
  )
}
