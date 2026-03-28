/** Calendar “today” for the log (YYYY-MM-DD) in Asia/Kolkata. */
export function todayLocalISODate(): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())
  const p = (type: Intl.DateTimeFormatPart['type']) =>
    parts.find((x) => x.type === type)?.value ?? '00'
  return `${p('year')}-${p('month')}-${p('day')}`
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
