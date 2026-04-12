import type { LogRecord } from '../types/log'
import { computeAdditionalProteinG } from './additionalProtein'

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
    medication_tablets_json: '{}',
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
    evening_meal_type: '',
    evening_egg_count: '',
    evening_protein_scoops: '',
    evening_meal_notes: '',
    key_insight: '',
    improvement_note: '',
    coffee_cups: '',
    soft_drinks_ml: '',
    packaged_and_outside_foods_notes: '',
    daily_steps: '',
    additional_protein_g: 0,
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
  delete raw.focus_score
  delete raw.discipline_score
  if (
    raw.packaged_and_outside_foods_notes === undefined &&
    raw.packaged_foods_notes != null
  ) {
    raw.packaged_and_outside_foods_notes = String(raw.packaged_foods_notes)
  }
  delete raw.packaged_foods_notes
  let next = raw as unknown as LogRecord
  if (next.focus_work_minutes === undefined) {
    next = { ...next, focus_work_minutes: '' }
  }
  if (next.focus_work_description === undefined) {
    next = { ...next, focus_work_description: '' }
  }
  if (next.medication_tablets_json === undefined) {
    const legacy = raw.meditation_tablets_json
    if (legacy !== undefined && legacy !== null && String(legacy).trim() !== '') {
      next = { ...next, medication_tablets_json: String(legacy) }
    } else {
      next = { ...next, medication_tablets_json: '{}' }
    }
  }
  delete raw.meditation_tablets_json
  delete (next as unknown as Record<string, unknown>).meditation_tablets_json
  if (next.workout_type === 'Back') {
    next = { ...next, workout_type: 'BB' }
  }
  const bt = String(next.breakfast_type || '').toLowerCase()
  if (bt === 'protein' || bt === 'protein shake') {
    next = { ...next, breakfast_type: 'protein_shake' }
  }
  const em = String(next.evening_meal_type || '').toLowerCase()
  if (em === 'protein' || em === 'protein shake') {
    next = { ...next, evening_meal_type: 'protein_shake' }
  }
  if (next.evening_meal_type === undefined) {
    next = { ...next, evening_meal_type: '' }
  }
  if (next.evening_egg_count === undefined) {
    next = { ...next, evening_egg_count: '' }
  }
  if (next.evening_protein_scoops === undefined) {
    next = { ...next, evening_protein_scoops: '' }
  }
  if (next.evening_meal_notes === undefined) {
    next = { ...next, evening_meal_notes: '' }
  }
  next = { ...next, additional_protein_g: computeAdditionalProteinG(next) }
  return next
}
