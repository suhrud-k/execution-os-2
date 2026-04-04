import {
  addDaysISO,
  calendarDayDiff,
  normalizeCalendarISODate,
  todayLocalISODate,
} from './dates'

/** Monday 00:00 UTC calendar day of the week containing `isoDate` (week = Mon–Sun). */
export function getMondayOfWeekISO(isoDate: string): string {
  const d = normalizeCalendarISODate(isoDate)
  const [y, m, day] = d.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, day))
  const wd = dt.getUTCDay()
  const diff = wd === 0 ? -6 : 1 - wd
  return addDaysISO(d, diff)
}

export type AnalyticsWeekBounds = { start: string; end: string }

/**
 * @param weekOffset 0 = week containing today; -1 = previous week, etc.
 * Current week: Mon → today. Past weeks: Mon → Sun (full week).
 */
export function getAnalyticsWeekBounds(
  weekOffset: number,
  today: string = todayLocalISODate(),
): AnalyticsWeekBounds {
  const t = normalizeCalendarISODate(today)
  const mondayThisWeek = getMondayOfWeekISO(t)
  const monday = addDaysISO(mondayThisWeek, weekOffset * 7)
  const sunday = addDaysISO(monday, 6)
  if (weekOffset === 0) {
    return { start: monday, end: t }
  }
  return { start: monday, end: sunday }
}

/** Inclusive list of YYYY-MM-DD from start through end (calendar order). */
export function enumerateDatesInclusive(start: string, end: string): string[] {
  const a = normalizeCalendarISODate(start)
  const b = normalizeCalendarISODate(end)
  if (a > b) return []
  const out: string[] = []
  let cur = a
  while (cur <= b) {
    out.push(cur)
    cur = addDaysISO(cur, 1)
  }
  return out
}

export function weekLabelShort(start: string, end: string): string {
  const [sy, sm, sd] = start.split('-').map(Number)
  const [ey, em, ed] = end.split('-').map(Number)
  const s = new Date(Date.UTC(sy, sm - 1, sd))
  const e = new Date(Date.UTC(ey, em - 1, ed))
  const opts: Intl.DateTimeFormatOptions = {
    timeZone: 'UTC',
    month: 'short',
    day: 'numeric',
  }
  const sameMonth = sm === em && sy === ey
  const left = s.toLocaleDateString('en-IN', { ...opts, weekday: 'short' })
  const right = sameMonth
    ? e.toLocaleDateString('en-IN', { timeZone: 'UTC', day: 'numeric' })
    : e.toLocaleDateString('en-IN', { ...opts, weekday: 'short' })
  return `${left} – ${right}`
}

export function daysInBounds(start: string, end: string): number {
  return calendarDayDiff(start, end) + 1
}
