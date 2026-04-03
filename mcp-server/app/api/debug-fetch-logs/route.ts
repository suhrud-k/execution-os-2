/**
 * TEMP debug: browser-friendly passthrough to Apps Script get_logs.
 * Remove this route (and optionally fetchGetLogsRawFromAppsScript) before production hardening.
 */
import { NextResponse } from 'next/server'
import { fetchGetLogsRawFromAppsScript } from '@/lib/apps-script'
import { getAppsScriptEnv } from '@/lib/env'
import { isValidIsoDate } from '@/lib/dates'

export const maxDuration = 60

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 })
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const start = searchParams.get('start')
  const end = searchParams.get('end')

  if (!start || !end) {
    return badRequest('start and end are required (YYYY-MM-DD)')
  }
  if (!isValidIsoDate(start) || !isValidIsoDate(end)) {
    return badRequest('Invalid date format (expected YYYY-MM-DD)')
  }
  if (start > end) {
    return badRequest('start must be on or before end')
  }

  let env: ReturnType<typeof getAppsScriptEnv>
  try {
    env = getAppsScriptEnv()
  } catch (e) {
    const details = e instanceof Error ? e.message : String(e)
    console.error('[debug-fetch-logs] env error:', details)
    return NextResponse.json(
      {
        success: false,
        error: 'Debug endpoint failed',
        details,
      },
      { status: 500 },
    )
  }

  console.info(`[debug-fetch-logs] range=${start}..${end}`)

  const result = await fetchGetLogsRawFromAppsScript(start, end, env.baseUrl, env.token)

  if (!result.ok) {
    console.warn('[debug-fetch-logs] upstream:', result.message)
    return NextResponse.json(
      {
        success: false,
        error: 'Debug endpoint failed',
        details: result.message,
      },
      { status: 502 },
    )
  }

  return NextResponse.json(result.body)
}
