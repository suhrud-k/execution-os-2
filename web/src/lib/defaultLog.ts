import type { LogRecord } from '../types/log'

export function createDefaultLog(date: string): LogRecord {
  return {
    date,
    wake_time: '',
    morning_energy: '',
    reach_office_time: '',
    leave_office_time: '',
    sleep_time: '',
    sleep_hours: '',
    breakfast_type: '',
    egg_count: 0,
    protein_scoops: 0,
    breakfast_notes: '',
    workout_done: false,
    workout_type: '',
    warmup_done: false,
    workout_log_json: '{"exercises":[]}',
    meditation_done: false,
    meditation_minutes: 0,
    priority_1: '',
    priority_2: '',
    priority_3: '',
    priority_1_status: '',
    priority_2_status: '',
    priority_3_status: '',
    work_completed_notes: '',
    work_blockers: '',
    evening_energy: '',
    focus_score: '',
    discipline_score: '',
    key_insight: '',
    improvement_note: '',
    coffee_cups: 0,
    soft_drinks_ml: 0,
    packaged_foods_notes: '',
    daily_steps: 0,
    last_updated_at: '',
    sync_status: '',
  }
}

export function mergeWithDefaults(
  date: string,
  partial: Partial<LogRecord> | null | undefined,
): LogRecord {
  const base = createDefaultLog(date)
  if (!partial) return base
  return normalizeLegacyLog({ ...base, ...partial, date })
}

/** Sheet / older clients may still have "Back" instead of "BB". */
export function normalizeLegacyLog(log: LogRecord): LogRecord {
  let next = { ...log }
  if (next.workout_type === 'Back') {
    next = { ...next, workout_type: 'BB' }
  }
  return next
}
