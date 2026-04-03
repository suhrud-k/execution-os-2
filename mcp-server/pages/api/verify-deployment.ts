/**
 * TEMP: confirms this deployment is the Next MCP app (no env / upstream).
 * Pages Router — avoids App-router + "debug" path issues on some Vercel setups.
 */
import type { NextApiRequest, NextApiResponse } from 'next'

export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({
    ok: true,
    service: 'execution-os-mcp',
    hint: 'Next try GET /api/sheet-logs?start=YYYY-MM-DD&end=YYYY-MM-DD',
  })
}

export const config = {
  maxDuration: 60,
}
