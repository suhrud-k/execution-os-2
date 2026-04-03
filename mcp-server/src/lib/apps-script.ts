export type GetLogsSuccess = {
  success: true
  source?: string
  action?: string
  start: string
  end: string
  count: number
  skipped_rows: number
  logs: unknown[]
}

export type GetLogsFailure = {
  success: false
  error: string
}

export type GetLogsResponse = GetLogsSuccess | GetLogsFailure

/**
 * GET Apps Script action=get_logs with token auth.
 */
export async function fetchLogsFromAppsScript(
  start: string,
  end: string,
  baseUrl: string,
  token: string,
): Promise<GetLogsResponse> {
  let url: URL
  try {
    url = new URL(baseUrl)
  } catch {
    return { success: false, error: 'APPS_SCRIPT_BASE_URL is not a valid URL' }
  }

  url.searchParams.set('action', 'get_logs')
  url.searchParams.set('start', start)
  url.searchParams.set('end', end)
  url.searchParams.set('token', token)

  let res: Response
  try {
    res = await fetch(url.toString(), {
      method: 'GET',
      headers: { Accept: 'application/json' },
      redirect: 'follow',
    })
  } catch (e) {
    return {
      success: false,
      error: `Network error calling Apps Script: ${e instanceof Error ? e.message : String(e)}`,
    }
  }

  const text = await res.text()
  let data: unknown
  try {
    data = JSON.parse(text) as unknown
  } catch {
    return {
      success: false,
      error: `Apps Script returned non-JSON (HTTP ${res.status})`,
    }
  }

  if (!data || typeof data !== 'object') {
    return { success: false, error: 'Apps Script JSON root is not an object' }
  }

  const o = data as Record<string, unknown>

  if (o.success === false) {
    return {
      success: false,
      error: String(o.error ?? 'Apps Script returned success=false without error message'),
    }
  }

  if (o.success !== true) {
    return { success: false, error: 'Apps Script response missing success:true' }
  }

  if (!Array.isArray(o.logs)) {
    return { success: false, error: 'Apps Script success response missing logs array' }
  }

  const out: GetLogsSuccess = {
    success: true,
    source: typeof o.source === 'string' ? o.source : undefined,
    action: typeof o.action === 'string' ? o.action : undefined,
    start: String(o.start ?? start),
    end: String(o.end ?? end),
    count: typeof o.count === 'number' ? o.count : o.logs.length,
    skipped_rows: typeof o.skipped_rows === 'number' ? o.skipped_rows : 0,
    logs: o.logs,
  }

  return out
}
