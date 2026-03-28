import type { LogRecord } from '../types/log'
import { getAllLogEnvelopes } from './db'
import { apiGetRecentLogs, isApiConfigured } from './api'

export async function loadMergedHistory(): Promise<LogRecord[]> {
  const localEnvelopes = await getAllLogEnvelopes()
  const map = new Map<string, LogRecord>()
  for (const e of localEnvelopes) {
    map.set(e.date, e.data)
  }

  if (isApiConfigured() && typeof navigator !== 'undefined' && navigator.onLine) {
    try {
      const remote = await apiGetRecentLogs()
      for (const r of remote) {
        const existing = map.get(r.date)
        const rt = r.last_updated_at ? Date.parse(r.last_updated_at) : 0
        const lt = existing?.last_updated_at
          ? Date.parse(existing.last_updated_at)
          : 0
        if (!existing || rt >= lt) map.set(r.date, r)
      }
    } catch {
      /* offline or error — local only */
    }
  }

  return Array.from(map.values()).sort((a, b) => b.date.localeCompare(a.date))
}
