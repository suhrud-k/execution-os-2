/**
 * Strict calendar validation for YYYY-MM-DD (UTC date parts, no timezone shift).
 */
export function parseIsoDateStrict(raw: string): string | null {
  const s = raw.trim()
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!m) return null
  const y = Number(m[1])
  const mo = Number(m[2])
  const d = Number(m[3])
  const t = new Date(Date.UTC(y, mo - 1, d))
  if (
    t.getUTCFullYear() !== y ||
    t.getUTCMonth() !== mo - 1 ||
    t.getUTCDate() !== d
  ) {
    return null
  }
  return `${m[1]}-${m[2]}-${m[3]}`
}

export function isValidIsoDate(raw: string): boolean {
  return parseIsoDateStrict(raw) !== null
}
