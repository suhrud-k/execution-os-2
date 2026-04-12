import { MEDICATION_TABLETS } from '../constants/medicationTablets'

function defaultState(): Record<string, boolean> {
  return Object.fromEntries(MEDICATION_TABLETS.map((t) => [t.id, false])) as Record<
    string,
    boolean
  >
}

/** Parse sheet/local JSON; unknown keys ignored; missing keys → false. */
export function parseMedicationTabletsJson(raw: string): Record<string, boolean> {
  const base = defaultState()
  const s = raw?.trim() ?? ''
  if (!s) return base
  try {
    const o = JSON.parse(s) as Record<string, unknown>
    for (const t of MEDICATION_TABLETS) {
      const v = o[t.id]
      if (typeof v === 'boolean') base[t.id] = v
    }
  } catch {
    /* keep base */
  }
  return base
}

/** Compact JSON: only `true` keys stored. */
export function stringifyMedicationTabletsJson(state: Record<string, boolean>): string {
  const o: Record<string, boolean> = {}
  for (const t of MEDICATION_TABLETS) {
    if (state[t.id] === true) o[t.id] = true
  }
  return Object.keys(o).length === 0 ? '{}' : JSON.stringify(o)
}
