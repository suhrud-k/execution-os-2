/**
 * Calendar “today” for the log (YYYY-MM-DD) using the device’s local date.
 * (IST-only “today” was wrong for users in other timezones: e.g. still Mar 29 locally
 * while Kolkata was already Mar 30, so the wrong day looked like “Today”.)
 */
export function todayLocalISODate(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Pad YYYY-M-D from sheets/API so lexicographic compare matches calendar order. */
export function normalizeCalendarISODate(iso: string): string {
  const s = iso.trim()
  const m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
  if (!m) return s
  const y = m[1]
  const mo = String(Number(m[2])).padStart(2, '0')
  const d = String(Number(m[3])).padStart(2, '0')
  return `${y}-${mo}-${d}`
}

/** Signed calendar-day difference: `toISO` minus `fromISO` (UTC midnight math). */
export function calendarDayDiff(fromISO: string, toISO: string): number {
  const a = normalizeCalendarISODate(fromISO)
  const b = normalizeCalendarISODate(toISO)
  const [y, m, d] = a.split('-').map(Number)
  const [y2, m2, d2] = b.split('-').map(Number)
  const t1 = Date.UTC(y, m - 1, d)
  const t2 = Date.UTC(y2, m2 - 1, d2)
  return Math.round((t2 - t1) / 86400000)
}

export function addDaysISO(isoDate: string, delta: number): string {
  const [y, m, d] = isoDate.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  dt.setUTCDate(dt.getUTCDate() + delta)
  const yy = dt.getUTCFullYear()
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(dt.getUTCDate()).padStart(2, '0')
  return `${yy}-${mm}-${dd}`
}

/** Pretty label for a calendar YYYY-MM-DD (stable day, shown for India locale). */
export function formatDisplayDate(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  return dt.toLocaleDateString('en-IN', {
    timeZone: 'UTC',
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

/** Wall time in Asia/Kolkata (IST), ISO-like string with +05:30 — for `last_updated_at` in sheet and app. */
export function nowIndiaISOString(date: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(date)
  const p = (type: Intl.DateTimeFormatPart['type']) =>
    parts.find((x) => x.type === type)?.value ?? '00'
  return `${p('year')}-${p('month')}-${p('day')}T${p('hour')}:${p('minute')}:${p('second')}+05:30`
}
