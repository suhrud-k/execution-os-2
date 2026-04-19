import type { LogRecord } from '../types/log'
import { apiGetLog, isApiConfigured } from './api'
import { getLogEnvelope } from './db'

/** Result of a single `apiGetLog` attempt — avoids Promise.all failing on one rejection. */
export type ApiGetLogOutcome =
  | { ok: true; log: LogRecord | null }
  | { ok: false; error: unknown }

export async function safeApiGetLog(date: string): Promise<ApiGetLogOutcome> {
  try {
    const log = await apiGetLog(date)
    return { ok: true, log }
  } catch (e) {
    return { ok: false, error: e }
  }
}

/**
 * Derive previous-evening sleep time from an outcome produced in parallel with today's fetch.
 * Matches `fetchPreviousDaySleepTimeISO` semantics: remote null → ''; remote error → local envelope only.
 */
export async function previousDaySleepFromOutcome(
  prevDate: string,
  outcome: ApiGetLogOutcome,
): Promise<string> {
  if (outcome.ok) {
    if (outcome.log === null) return ''
    return (outcome.log.sleep_time ?? '').trim()
  }
  const local = await getLogEnvelope(prevDate)
  return (local?.data.sleep_time ?? '').trim()
}

/**
 * `sleep_time` on the previous calendar row (evening before this wake).
 * When online with the API: if there is **no** row for that date on the sheet,
 * returns '' even if IndexedDB still has a stale copy (fixes wrong sleep hours
 * after deleting yesterday or first-time sync).
 */
export async function fetchPreviousDaySleepTimeISO(
  prevDate: string,
): Promise<string> {
  const canUseRemote =
    typeof navigator !== 'undefined' &&
    navigator.onLine &&
    isApiConfigured()
  if (canUseRemote) {
    try {
      const remote = await apiGetLog(prevDate)
      if (remote === null) return ''
      return (remote.sleep_time ?? '').trim()
    } catch {
      // Use local copy if the request fails (offline blip, etc.).
    }
  }
  const local = await getLogEnvelope(prevDate)
  return (local?.data.sleep_time ?? '').trim()
}
