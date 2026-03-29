import type { LogRecord } from '../types/log'
import { getAllLogEnvelopes } from './db'
import { apiGetRecentLogs, isApiConfigured } from './api'
import { todayLocalISODate, normalizeCalendarISODate } from './dates'

/** Past calendar days come from the sheet when online; today+ can include unsynced device rows. */
export async function loadMergedHistory(): Promise<LogRecord[]> {
  const today = todayLocalISODate()
  const localEnvelopes = await getAllLogEnvelopes()

  if (isApiConfigured() && typeof navigator !== 'undefined' && navigator.onLine) {
    try {
      const remote = await apiGetRecentLogs()
      const map = new Map<string, LogRecord>()
      for (const r of remote) {
        map.set(r.date, r)
      }
      for (const e of localEnvelopes) {
        if (normalizeCalendarISODate(e.date) < today) continue
        const existing = map.get(e.date)
        const rt = existing?.last_updated_at
          ? Date.parse(existing.last_updated_at)
          : 0
        const lt = e.data.last_updated_at
          ? Date.parse(e.data.last_updated_at)
          : 0
        if (!existing || lt >= rt) map.set(e.date, e.data)
      }
      return Array.from(map.values()).sort((a, b) =>
        b.date.localeCompare(a.date),
      )
    } catch {
      /* offline or error — local only */
    }
  }

  const map = new Map<string, LogRecord>()
  for (const e of localEnvelopes) {
    map.set(e.date, e.data)
  }
  return Array.from(map.values()).sort((a, b) => b.date.localeCompare(a.date))
}
