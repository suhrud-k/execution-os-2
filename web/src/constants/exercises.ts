export type ExerciseCategory = 'CST' | 'BB' | 'Legs'

/** No external weight; reps / sets only. */
export const BODYWEIGHT_EXERCISE_NAMES = new Set([
  'Pushups',
  'Squats',
  'Lunges',
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
  { name: 'Lat pull downs', category: 'BB' },
  { name: 'Bent over rows', category: 'BB' },
  { name: 'Shoulder press', category: 'CST' },
  { name: 'Tricep pushdowns', category: 'CST' },
  { name: 'Bicep curls', category: 'BB' },
  { name: 'Squats', category: 'Legs' },
  { name: 'Lunges', category: 'Legs' },
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
    return all.filter((e) => e.category === 'BB')
  if (workoutType === 'CST')
    return all.filter((e) => e.category === 'CST')
  if (workoutType === 'Legs')
    return all.filter((e) => e.category === 'Legs')
  // Warmup, Other — full library
  return all
}
