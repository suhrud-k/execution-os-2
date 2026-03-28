import type { Exercise, WorkoutLogData } from '../types/log'

const empty: WorkoutLogData = { exercises: [] }

export function parseWorkoutLogJson(raw: string): WorkoutLogData {
  if (!raw?.trim()) return structuredClone(empty)
  try {
    const o = JSON.parse(raw) as WorkoutLogData
    if (!o || !Array.isArray(o.exercises)) return structuredClone(empty)
    return {
      exercises: o.exercises.map((e, i) => ({
        id: e.id || `ex-${i}-${Date.now()}`,
        name: typeof e.name === 'string' ? e.name : '',
        sets: Array.isArray(e.sets)
          ? e.sets.map((s) => ({
              reps: Number(s.reps) || 0,
              weight: Number(s.weight) || 0,
            }))
          : [],
        runDistanceKm:
          e.runDistanceKm !== undefined && e.runDistanceKm !== null
            ? Number(e.runDistanceKm) || 0
            : undefined,
        runDurationMin:
          e.runDurationMin !== undefined && e.runDurationMin !== null
            ? Number(e.runDurationMin) || 0
            : undefined,
      })),
    }
  } catch {
    return structuredClone(empty)
  }
}

export function stringifyWorkoutLog(data: WorkoutLogData): string {
  return JSON.stringify(data)
}

/** Default reps for a newly added set or exercise in the log UI. */
export const DEFAULT_SET_REPS = 8

export function newExercise(): Exercise {
  return {
    id: `ex-${crypto.randomUUID()}`,
    name: '',
    sets: [{ reps: DEFAULT_SET_REPS, weight: 0 }],
  }
}

export function newRunExercise(): Exercise {
  return {
    id: `ex-${crypto.randomUUID()}`,
    name: 'Run',
    sets: [],
    runDistanceKm: 0,
    runDurationMin: 0,
  }
}
