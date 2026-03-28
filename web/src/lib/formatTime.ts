const INDIA_TZ = 'Asia/Kolkata'

/** Format an ISO or epoch-parseable instant for display in India (IST). */
export function formatTimestamp(iso: string): string {
  if (!iso?.trim()) return '—'
  const t = Date.parse(iso)
  if (Number.isNaN(t)) return iso
  return new Date(t).toLocaleTimeString('en-IN', {
    timeZone: INDIA_TZ,
    hour: '2-digit',
    minute: '2-digit',
  })
}
