import type { LogDayType } from '../types/log'

/** Sheet / API string enum — default when blank is `office`. */
export const DAY_TYPE_VALUES: readonly LogDayType[] = [
  'office',
  'wfh',
  'holiday',
  'travelling',
] as const

export const DAY_TYPE_SEGMENTS: {
  value: LogDayType
  label: string
}[] = [
  { value: 'office', label: 'Office' },
  { value: 'wfh', label: 'WFH' },
  { value: 'holiday', label: 'Holiday' },
  { value: 'travelling', label: 'Travelling for meetings' },
]

/** Short label for badges (not the full travelling string). */
export function dayTypeBadgeLabel(dt: LogDayType | '' | undefined): string | null {
  if (!dt || dt === 'office') return null
  switch (dt) {
    case 'wfh':
      return 'WFH'
    case 'holiday':
      return 'Holiday'
    case 'travelling':
      return 'Travelling'
    default:
      return null
  }
}

export function coerceLogDayType(raw: string | undefined | null): LogDayType {
  const s = String(raw ?? '').trim().toLowerCase()
  if (s === 'wfh' || s === 'holiday' || s === 'travelling' || s === 'office') {
    return s
  }
  return 'office'
}
