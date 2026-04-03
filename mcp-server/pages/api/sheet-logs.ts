/**
 * TEMP: browser-friendly passthrough to Apps Script get_logs (same as MCP fetch_logs).
 * Pages Router — see verify-deployment.ts header.
 */
import type { NextApiRequest, NextApiResponse } from 'next'
import { fetchGetLogsRawFromAppsScript } from '@/lib/apps-script'
import { getAppsScriptEnv } from '@/lib/env'
import { isValidIsoDate } from '@/lib/dates'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const start = typeof req.query.start === 'string' ? req.query.start : null
  const end = typeof req.query.end === 'string' ? req.query.end : null

  if (!start || !end) {
    return res.status(400).json({ error: 'start and end are required (YYYY-MM-DD)' })
  }
  if (!isValidIsoDate(start) || !isValidIsoDate(end)) {
    return res.status(400).json({ error: 'Invalid date format (expected YYYY-MM-DD)' })
  }
  if (start > end) {
    return res.status(400).json({ error: 'start must be on or before end' })
  }

  let env: ReturnType<typeof getAppsScriptEnv>
  try {
    env = getAppsScriptEnv()
  } catch (e) {
    const details = e instanceof Error ? e.message : String(e)
    console.error('[sheet-logs] env error:', details)
    return res.status(500).json({
      success: false,
      error: 'Sheet logs proxy failed',
      details,
    })
  }

  console.info(`[sheet-logs] range=${start}..${end}`)

  const result = await fetchGetLogsRawFromAppsScript(start, end, env.baseUrl, env.token)

  if (!result.ok) {
    console.warn('[sheet-logs] upstream:', result.message)
    return res.status(502).json({
      success: false,
      error: 'Sheet logs proxy failed',
      details: result.message,
    })
  }

  return res.status(200).json(result.body)
}

export const config = {
  maxDuration: 60,
}
