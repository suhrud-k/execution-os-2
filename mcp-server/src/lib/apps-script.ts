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
 * Build GET URL for Apps Script action=get_logs (token in query; do not log URL with token).
 */
export function buildGetLogsUrl(
  baseUrl: string,
  start: string,
  end: string,
  token: string,
): URL | null {
  try {
    const url = new URL(baseUrl)
    url.searchParams.set('action', 'get_logs')
    url.searchParams.set('start', start)
    url.searchParams.set('end', end)
    url.searchParams.set('token', token)
    return url
  } catch {
    return null
  }
}

export type RawGetLogsResult =
  | { ok: true; body: unknown }
  | { ok: false; message: string }

/**
 * GET Apps Script get_logs and return parsed JSON as-is (for debug / passthrough).
 * Does not validate success shape or logs array.
 */
export async function fetchGetLogsRawFromAppsScript(
  start: string,
  end: string,
  baseUrl: string,
  token: string,
): Promise<RawGetLogsResult> {
  const url = buildGetLogsUrl(baseUrl, start, end, token)
  if (!url) {
    return { ok: false, message: 'APPS_SCRIPT_BASE_URL is not a valid URL' }
  }

  let res: Response
  try {
    res = await fetch(url.toString(), {
      method: 'GET',
      headers: { Accept: 'application/json' },
      redirect: 'follow',
    })
  } catch (e) {
    return {
      ok: false,
      message: `Network error calling Apps Script: ${e instanceof Error ? e.message : String(e)}`,
    }
  }

  const text = await res.text()
  try {
    const body = JSON.parse(text) as unknown
    return { ok: true, body }
  } catch {
    return {
      ok: false,
      message: `Apps Script returned non-JSON (HTTP ${res.status})`,
    }
  }
}

/**
 * GET Apps Script action=get_logs with token auth.
 */
export async function fetchLogsFromAppsScript(
  start: string,
  end: string,
  baseUrl: string,
  token: string,
): Promise<GetLogsResponse> {
  const url = buildGetLogsUrl(baseUrl, start, end, token)
  if (!url) {
    return { success: false, error: 'APPS_SCRIPT_BASE_URL is not a valid URL' }
  }

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
