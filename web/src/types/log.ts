export type BreakfastType = 'eggs' | 'protein_shake' | 'other' | 'missed' | ''

export type PriorityStatus = 'Done' | 'Partial' | 'Not Done' | ''

export interface ExerciseSet {
  reps: number | ''
  weight: number | ''
}

export interface Exercise {
  id: string
  name: string
  sets: ExerciseSet[]
  /** Cardio (Run): distance in km */
  runDistanceKm?: number
  /** Cardio (Run): duration in minutes */
  runDurationMin?: number
}

export interface WorkoutLogData {
  exercises: Exercise[]
}

export interface LogRecord {
  date: string
  wake_time: string
  morning_energy: number | ''
  reach_office_time: string
  leave_office_time: string
  sleep_time: string
  sleep_hours: number | ''
  breakfast_type: BreakfastType
  egg_count: number | ''
  protein_scoops: number | ''
  breakfast_notes: string
  workout_done: boolean
  workout_type: string
  warmup_done: boolean
  workout_log_json: string
  meditation_done: boolean
  meditation_minutes: number | ''
  priority_1: string
  priority_2: string
  priority_3: string
  priority_1_status: PriorityStatus
  priority_2_status: PriorityStatus
  priority_3_status: PriorityStatus
  /** Deep work / focus block (minutes). */
  focus_work_minutes: number | ''
  focus_work_description: string
  work_completed_notes: string
  evening_energy: number | ''
  focus_score: number | ''
  discipline_score: number | ''
  key_insight: string
  improvement_note: string
  coffee_cups: number | ''
  soft_drinks_ml: number | ''
  packaged_foods_notes: string
  daily_steps: number | ''
  last_updated_at: string
  sync_status: string
}

export interface StoredLogEnvelope {
  date: string
  data: LogRecord
  syncStatus: 'pending' | 'synced'
}
