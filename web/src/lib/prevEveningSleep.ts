import { apiGetLog, isApiConfigured } from './api'
import { getLogEnvelope } from './db'

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
