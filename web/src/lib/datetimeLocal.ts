/**
 * Quick-action timestamps are stored as India wall clock with +05:30.
 * Picker defaults and parsing both use Asia/Kolkata.
 */

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
