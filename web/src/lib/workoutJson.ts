import type { Exercise, WorkoutLogData } from '../types/log'

const empty: WorkoutLogData = { exercises: [] }

function parseSetField(v: unknown): number | '' {
  if (v === '' || v === undefined || v === null) return ''
  const n = Number(v)
  return Number.isFinite(n) ? n : ''
}

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
              reps: parseSetField(s.reps),
              weight: parseSetField(s.weight),
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

export function newExercise(): Exercise {
  return {
    id: `ex-${crypto.randomUUID()}`,
    name: '',
    sets: [{ reps: '', weight: '' }],
  }
}

export function newRunExercise(): Exercise {
  return {
    id: `ex-${crypto.randomUUID()}`,
    name: 'Run',
    sets: [],
  }
}
