import { getAllLogEnvelopes } from './db'
import { apiGetLog, isApiConfigured } from './api'
import { normalizeCalendarISODate } from './dates'
import { buildLogMapFromEnvelopes, type LogByDate } from './analytics'
import { enumerateDatesInclusive } from './analyticsWeek'

/**
 * Loads logs for each day in [start, end]: local IndexedDB first, then per-day
 * GET when API is configured and online (for weeks not fully cached locally).
 */
export async function loadLogsForDateRange(
  start: string,
  end: string,
): Promise<LogByDate> {
  const dates = enumerateDatesInclusive(
    normalizeCalendarISODate(start),
    normalizeCalendarISODate(end),
  )
  const local = await getAllLogEnvelopes()
  const map = buildLogMapFromEnvelopes(
    local.map((e) => ({
      date: normalizeCalendarISODate(e.date),
      data: e.data,
    })),
  )

  const canRemote =
    isApiConfigured() &&
    typeof navigator !== 'undefined' &&
    navigator.onLine

  if (canRemote) {
    await Promise.all(
      dates.map(async (d) => {
        if (map.has(d)) return
        try {
          const remote = await apiGetLog(d)
          if (remote) map.set(normalizeCalendarISODate(remote.date), remote)
        } catch {
          /* ignore */
        }
      }),
    )
  }

  return map
}
