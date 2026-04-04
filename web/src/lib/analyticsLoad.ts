import { getAllLogEnvelopes } from './db'
import { apiGetLog, isApiConfigured } from './api'
import { normalizeCalendarISODate } from './dates'
import { buildLogMapFromEnvelopes, type LogByDate } from './analytics'
import { enumerateDatesInclusive } from './analyticsWeek'

/**
 * Loads logs for each day in [start, end]: start from IndexedDB, then when online
 * fetch each day from the sheet. **Remote row wins** when `getLog` returns a row
 * (so sheet edits — including focus minutes typed in the sheet — show in Analytics).
 * If `getLog` returns null (no row), keep any local copy for unsynced offline work.
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
        try {
          const remote = await apiGetLog(d)
          if (remote !== null) {
            map.set(normalizeCalendarISODate(remote.date), remote)
          }
        } catch {
          /* keep local */
        }
      }),
    )
  }

  return map
}
