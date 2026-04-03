export const WORKOUT_TYPES = [
  'BB',
  'CST',
  'Legs',
  'Arms',
  'Full body',
  'Cardio',
  'Warmup',
  'Rest',
  'Other',
] as const

export type WorkoutTypeChip = (typeof WORKOUT_TYPES)[number]

export const PRIORITY_STATUSES = ['Done', 'Partial', 'Not Done'] as const

export const BREAKFAST_TYPES = [
  { value: 'eggs' as const, label: 'Eggs' },
  { value: 'protein_shake' as const, label: 'Protein shake' },
  { value: 'other' as const, label: 'Other' },
  { value: 'missed' as const, label: 'Missed' },
]
