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
        Ops (temp): <a href="/api/verify-deployment"><code>/api/verify-deployment</code></a>
        {' · '}
        <a href="/api/sheet-logs?start=2026-03-30&end=2026-04-02">
          <code>/api/sheet-logs</code>
        </a>{' '}
        (Apps Script passthrough; not MCP)
      </p>
    </main>
  )
}
