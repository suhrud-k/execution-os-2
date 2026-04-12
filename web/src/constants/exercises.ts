export type ExerciseCategory = 'BB' | 'CST' | 'Legs' | 'Arms' | 'Universal'

/** No external weight; reps / sets only. */
export const BODYWEIGHT_EXERCISE_NAMES = new Set([
  'Pushups',
  'Squats',
  'Lunges',
  'Suryanamaskar',
  'Deadhang',
  'Skipping',
])

export function isBodyweightExerciseName(name: string): boolean {
  return BODYWEIGHT_EXERCISE_NAMES.has(name)
}

/** Cardio: only this exercise, distance + time instead of reps/weight. */
export const CARDIO_RUN_NAME = 'Run' as const

export const EXERCISE_LIBRARY: readonly {
  name: string
  category: ExerciseCategory
}[] = [
  { name: 'Pushups', category: 'CST' },
  { name: 'Chest fly', category: 'CST' },
  { name: 'Shoulder press', category: 'CST' },
  { name: 'Tricep pushdowns', category: 'CST' },
  { name: 'Lat pull downs', category: 'BB' },
  { name: 'Bent over rows', category: 'BB' },
  { name: 'Rear deltoid', category: 'BB' },
  { name: 'Shoulder press', category: 'Arms' },
  { name: 'Tricep pushdowns', category: 'Arms' },
  { name: 'Bicep curls', category: 'Arms' },
  { name: 'Squats', category: 'Legs' },
  { name: 'Lunges', category: 'Legs' },
  { name: 'Suryanamaskar', category: 'Universal' },
  { name: 'Deadhang', category: 'Universal' },
  { name: 'Skipping', category: 'Universal' },
]

/** Exercises shown for the selected workout type; Full body = all; Rest / empty = none. */
export function exercisesForWorkoutType(
  workoutType: string,
): readonly { name: string; category: ExerciseCategory }[] {
  const all = EXERCISE_LIBRARY
  if (!workoutType || workoutType === 'Rest') return []
  if (workoutType === 'Cardio') return []
  if (workoutType === 'Full body') return all
  if (workoutType === 'BB')
    return all.filter((e) => e.category === 'BB' || e.category === 'Universal')
  if (workoutType === 'CST')
    return all.filter((e) => e.category === 'CST' || e.category === 'Universal')
  if (workoutType === 'Legs')
    return all.filter((e) => e.category === 'Legs' || e.category === 'Universal')
  if (workoutType === 'Arms')
    return all.filter((e) => e.category === 'Arms' || e.category === 'Universal')
  // Warmup, Other — full library
  return all
}
