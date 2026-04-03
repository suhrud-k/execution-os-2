/**
 * TEMP: no auth, no env — confirms this deployment is the Next MCP app (not the Vite PWA).
 * Remove with debug-fetch-logs when hardening.
 */
import { NextResponse } from 'next/server'

export function GET() {
  return NextResponse.json({
    ok: true,
    service: 'execution-os-mcp',
    hint: 'If you see this JSON, routing works. Next try /api/debug-fetch-logs with start & end.',
  })
}
