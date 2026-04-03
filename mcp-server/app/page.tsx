export default function Home() {
  return (
    <main>
      <h1>Execution OS MCP server</h1>
      <p>
        MCP Streamable HTTP endpoint:{' '}
        <code>/api/mcp</code> (use your deployed origin as the base URL).
      </p>
      <p>Tool: <code>fetch_logs</code> — proxies to Google Apps Script <code>get_logs</code>.</p>
    </main>
  )
}
