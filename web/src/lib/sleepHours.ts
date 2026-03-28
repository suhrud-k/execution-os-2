/**
 * Sleep from previous calendar evening → wake this calendar morning.
 * Uses previous row's sleep_time and today's wake_time (ISO strings).
 */
export function computeSleepHours(
  wakeTimeISO: string,
  previousEveningSleepISO: string,
): number | '' {
  if (!wakeTimeISO?.trim() || !previousEveningSleepISO?.trim()) return ''
  const wake = Date.parse(wakeTimeISO)
  const sleep = Date.parse(previousEveningSleepISO)
  if (Number.isNaN(wake) || Number.isNaN(sleep)) return ''
  const ms = wake - sleep
  if (ms <= 0) return ''
  const hours = ms / (1000 * 60 * 60)
  return Math.round(hours * 10) / 10
}

/**
 * Prefer previous day's `sleep_time`. If missing, use **this** row's `sleep_time`
 * only when it parses strictly before `wake_time` (single-row logging: last night
 * on today's card).
 */
export function resolvePreviousEveningSleepAnchor(
  log: { wake_time: string; sleep_time: string },
  previousDaySleepISO: string,
): string {
  const fromPrev = previousDaySleepISO?.trim() ?? ''
  if (fromPrev) return fromPrev
  const own = log.sleep_time?.trim() ?? ''
  const wake = log.wake_time?.trim() ?? ''
  if (!own || !wake) return ''
  const w = Date.parse(wake)
  const s = Date.parse(own)
  if (Number.isNaN(w) || Number.isNaN(s) || s >= w) return ''
  return own
}

export function computeSleepHoursForLog(
  log: { wake_time: string; sleep_time: string },
  previousDaySleepISO: string,
): number | '' {
  const anchor = resolvePreviousEveningSleepAnchor(log, previousDaySleepISO)
  return computeSleepHours(log.wake_time, anchor)
}
