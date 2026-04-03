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
    egg_count: '',
    protein_scoops: '',
    breakfast_notes: '',
    workout_done: false,
    workout_type: '',
    warmup_done: false,
    workout_log_json: '',
    meditation_done: false,
    meditation_minutes: '',
    priority_1: '',
    priority_2: '',
    priority_3: '',
    priority_1_status: '',
    priority_2_status: '',
    priority_3_status: '',
    focus_work_minutes: '',
    focus_work_description: '',
    work_completed_notes: '',
    evening_energy: '',
    focus_score: '',
    discipline_score: '',
    key_insight: '',
    improvement_note: '',
    coffee_cups: '',
    soft_drinks_ml: '',
    packaged_foods_notes: '',
    daily_steps: '',
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

/** Sheet / older clients may still have "Back" instead of "BB", or "protein" vs protein_shake. */
export function normalizeLegacyLog(log: LogRecord): LogRecord {
  const raw = { ...(log as unknown as Record<string, unknown>) }
  delete raw.work_blockers
  let next = raw as unknown as LogRecord
  if (next.focus_work_minutes === undefined) {
    next = { ...next, focus_work_minutes: '' }
  }
  if (next.focus_work_description === undefined) {
    next = { ...next, focus_work_description: '' }
  }
  if (next.workout_type === 'Back') {
    next = { ...next, workout_type: 'BB' }
  }
  const bt = String(next.breakfast_type || '').toLowerCase()
  if (bt === 'protein' || bt === 'protein shake') {
    next = { ...next, breakfast_type: 'protein_shake' }
  }
  return next
}
