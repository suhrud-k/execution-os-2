/**
 * Quick-action timestamps are stored as India wall clock with +05:30.
 * Picker defaults and parsing both use Asia/Kolkata.
 */

import { addDaysISO, normalizeCalendarISODate } from './dates'

/** Stored `...+05:30` string → `YYYY-MM-DDTHH:mm` for `datetime-local` (IST wall time). */
export function indiaISOToDatetimeLocalValue(iso: string): string {
  const t = iso?.trim() ?? ''
  if (!t) return ''
  const m = t.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/)
  if (!m) return ''
  return `${m[1]}T${m[2]}:${m[3]}`
}

/** Stored IST instant → `HH:mm` for `<input type="time">` (24h wall clock from string). */
export function indiaISOToTimeInputValue(iso: string): string {
  const t = iso?.trim() ?? ''
  if (!t) return ''
  const m = t.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})/)
  if (!m) return ''
  return `${m[2]}:${m[3]}`
}

/**
 * Calendar date (YYYY-MM-DD) + `HH:mm` as IST wall clock → stored `...+05:30` string.
 */
export function combineCalendarDateAndTimeToIndiaISO(
  calendarDateYYYYMMDD: string,
  timeHHmm: string,
): string | null {
  const d = calendarDateYYYYMMDD?.trim() ?? ''
  const time = timeHHmm?.trim() ?? ''
  if (!d || !time) return null
  const dm = d.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  const tm = time.match(/^(\d{2}):(\d{2})(?::(\d{2}))?$/)
  if (!dm || !tm) return null
  const sec = tm[3] != null && tm[3] !== '' ? String(tm[3]).padStart(2, '0') : '00'
  return `${dm[1]}-${dm[2]}-${dm[3]}T${tm[1]}:${tm[2]}:${sec}+05:30`
}

/**
 * Sleep time for this log row: evening/night on the log day uses that calendar date;
 * post-midnight (00:00–06:59 IST) is stored on the **next** calendar day (early morning after midnight).
 * No separate date picker — only the time control.
 */
export function combineLogDayAndSleepTimeToIndiaISO(
  logCalendarDateYYYYMMDD: string,
  timeHHmm: string,
): string | null {
  const d = normalizeCalendarISODate(logCalendarDateYYYYMMDD?.trim() ?? '')
  const time = timeHHmm?.trim() ?? ''
  if (!d || !time) return null
  const tm = time.match(/^(\d{2}):(\d{2})(?::(\d{2}))?$/)
  if (!tm) return null
  const hour = Number(tm[1])
  const dateForInstant = hour >= 0 && hour < 7 ? addDaysISO(d, 1) : d
  return combineCalendarDateAndTimeToIndiaISO(dateForInstant, time)
}

/** Current instant as `datetime-local` value in Asia/Kolkata (picker default). */
export function toDatetimeLocalValueIndiaNow(): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date())
  const p = (type: Intl.DateTimeFormatPart['type']) =>
    parts.find((x) => x.type === type)?.value ?? '00'
  return `${p('year')}-${p('month')}-${p('day')}T${p('hour')}:${p('minute')}`
}

/** Current clock time in Asia/Kolkata as `HH:mm` for `<input type="time">`. */
export function currentIndiaTimeHHmm(): string {
  const full = toDatetimeLocalValueIndiaNow()
  const i = full.indexOf('T')
  return i >= 0 ? full.slice(i + 1) : '00:00'
}

/**
 * Interpret naive `YYYY-MM-DDTHH:mm` (and optional `:ss`) as IST → `...+05:30`.
 * Does not depend on the device timezone.
 */
export function parseDatetimeLocalToIndiaISO(local: string): string | null {
  if (!local?.trim()) return null
  const m = local
    .trim()
    .match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/)
  if (!m) return null
  const sec = m[6] != null && m[6] !== '' ? String(m[6]).padStart(2, '0') : '00'
  return `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${sec}+05:30`
}
