import type { BreakfastType, LogRecord } from '../types/log'
import { computeAdditionalProteinG } from './additionalProtein'
import { normalizeLegacyLog } from './defaultLog'
import { nowIndiaISOString } from './dates'

function baseUrl(): string | null {
  const u = import.meta.env.VITE_APPS_SCRIPT_URL?.trim()
  return u || null
}

function secret(): string {
  return import.meta.env.VITE_SCRIPT_SECRET?.trim() ?? ''
}

export function isApiConfigured(): boolean {
  return Boolean(baseUrl() && secret())
}

async function parseJson(res: Response): Promise<unknown> {
  const text = await res.text()
  try {
    return JSON.parse(text) as unknown
  } catch {
    throw new Error(text || res.statusText)
  }
}

export async function apiUpsertLog(log: LogRecord): Promise<void> {
  const url = baseUrl()
  if (!url) throw new Error('API URL not configured')
  const body = {
    action: 'upsertLog',
    secret: secret(),
    log: serializeForSheet(log),
  }
  // text/plain avoids CORS preflight on many browsers when calling Apps Script.
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(body),
  })
  const data = (await parseJson(res)) as { ok?: boolean; error?: string }
  if (!res.ok || data?.error) {
    throw new Error(data?.error || res.statusText)
  }
}

export async function apiGetLog(date: string): Promise<LogRecord | null> {
  const url = baseUrl()
  if (!url) throw new Error('API URL not configured')
  const q = new URLSearchParams({
    action: 'getLog',
    date,
    secret: secret(),
  })
  const res = await fetch(`${url}?${q.toString()}`, { method: 'GET' })
  const data = (await parseJson(res)) as {
    ok?: boolean
    log?: Record<string, string | number | boolean>
    error?: string
  }
  if (!res.ok || data?.error) {
    throw new Error(data?.error || res.statusText)
  }
  if (!data.log) return null
  return deserializeFromSheet(data.log)
}

export async function apiGetRecentLogs(): Promise<LogRecord[]> {
  const url = baseUrl()
  if (!url) throw new Error('API URL not configured')
  const q = new URLSearchParams({
    action: 'getRecentLogs',
    secret: secret(),
  })
  const res = await fetch(`${url}?${q.toString()}`, { method: 'GET' })
  const data = (await parseJson(res)) as {
    ok?: boolean
    logs?: Record<string, string | number | boolean>[]
    error?: string
  }
  if (!res.ok || data?.error) {
    throw new Error(data?.error || res.statusText)
  }
  const rows = data.logs ?? []
  return rows.map((row) => deserializeFromSheet(row))
}

/** Coerce sheet row to LogRecord (strings from Sheets). */
function deserializeFromSheet(
  row: Record<string, string | number | boolean>,
): LogRecord {
  const g = (k: string): string =>
    row[k] === undefined || row[k] === null ? '' : String(row[k])
  const gn = (k: string): number | '' => {
    const v = row[k]
    if (v === '' || v === undefined || v === null) return ''
    const n = Number(v)
    return Number.isFinite(n) ? n : ''
  }
  const gb = (k: string): boolean =>
    String(row[k]).toLowerCase() === 'true' || row[k] === true

  const date = g('date')
  const workoutTypeRaw = g('workout_type')
  const workoutType =
    workoutTypeRaw === 'Back' ? 'BB' : workoutTypeRaw
  const breakfastRaw = g('breakfast_type').trim()
  const breakfastLower = breakfastRaw.toLowerCase()
  const breakfastType: BreakfastType =
    breakfastLower === 'protein' || breakfastLower === 'protein shake'
      ? 'protein_shake'
      : (breakfastRaw as BreakfastType)
  const eveningMealRaw = g('evening_meal_type').trim()
  const eveningMealLower = eveningMealRaw.toLowerCase()
  const eveningMealType: BreakfastType =
    eveningMealLower === 'protein' || eveningMealLower === 'protein shake'
      ? 'protein_shake'
      : (eveningMealRaw as BreakfastType)
  return normalizeLegacyLog({
    date,
    wake_time: g('wake_time'),
    morning_energy: gn('morning_energy'),
    reach_office_time: g('reach_office_time'),
    leave_office_time: g('leave_office_time'),
    sleep_time: g('sleep_time'),
    sleep_hours: gn('sleep_hours'),
    breakfast_type: breakfastType,
    egg_count: gn('egg_count') as LogRecord['egg_count'],
    protein_scoops: gn('protein_scoops') as LogRecord['protein_scoops'],
    breakfast_notes: g('breakfast_notes'),
    workout_done: gb('workout_done'),
    workout_type: workoutType,
    warmup_done: gb('warmup_done'),
    workout_log_json: g('workout_log_json').trim(),
    meditation_done: gb('meditation_done'),
    meditation_minutes: gn('meditation_minutes') as LogRecord['meditation_minutes'],
    medication_tablets_json:
      g('medication_tablets_json').trim() ||
      g('meditation_tablets_json').trim() ||
      '{}',
    priority_1: g('priority_1'),
    priority_2: g('priority_2'),
    priority_3: g('priority_3'),
    priority_1_status: g('priority_1_status') as LogRecord['priority_1_status'],
    priority_2_status: g('priority_2_status') as LogRecord['priority_2_status'],
    priority_3_status: g('priority_3_status') as LogRecord['priority_3_status'],
    focus_work_minutes: gn('focus_work_minutes') as LogRecord['focus_work_minutes'],
    focus_work_description: g('focus_work_description'),
    work_completed_notes: g('work_completed_notes'),
    evening_energy: gn('evening_energy'),
    evening_meal_type: eveningMealType,
    evening_egg_count: gn('evening_egg_count') as LogRecord['evening_egg_count'],
    evening_protein_scoops: gn('evening_protein_scoops') as LogRecord['evening_protein_scoops'],
    evening_meal_notes: g('evening_meal_notes'),
    key_insight: g('key_insight'),
    improvement_note: g('improvement_note'),
    coffee_cups: gn('coffee_cups') as LogRecord['coffee_cups'],
    soft_drinks_ml: gn('soft_drinks_ml') as LogRecord['soft_drinks_ml'],
    packaged_and_outside_foods_notes:
      g('packaged_and_outside_foods_notes') || g('packaged_foods_notes'),
    daily_steps: gn('daily_steps') as LogRecord['daily_steps'],
    additional_protein_g: 0,
    last_updated_at: g('last_updated_at'),
    sync_status: g('sync_status'),
  })
}

function serializeForSheet(log: LogRecord): Record<string, string | number | boolean> {
  const workoutDone = log.workout_done === true
  return {
    date: log.date,
    wake_time: log.wake_time,
    morning_energy: log.morning_energy === '' ? '' : log.morning_energy,
    reach_office_time: log.reach_office_time,
    leave_office_time: log.leave_office_time,
    sleep_time: log.sleep_time,
    sleep_hours: log.sleep_hours === '' ? '' : log.sleep_hours,
    breakfast_type: log.breakfast_type,
    egg_count: log.egg_count === '' ? '' : log.egg_count,
    protein_scoops: log.protein_scoops === '' ? '' : log.protein_scoops,
    breakfast_notes: log.breakfast_notes,
    workout_done: log.workout_done,
    workout_type: workoutDone ? log.workout_type : '',
    warmup_done: log.warmup_done,
    workout_log_json: workoutDone
      ? log.workout_log_json.trim() !== ''
        ? log.workout_log_json
        : '{"exercises":[]}'
      : '',
    meditation_done: log.meditation_done,
    meditation_minutes:
      log.meditation_minutes === '' ? '' : log.meditation_minutes,
    medication_tablets_json: log.medication_tablets_json?.trim() || '{}',
    focus_work_minutes:
      log.focus_work_minutes === '' ? '' : log.focus_work_minutes,
    focus_work_description: log.focus_work_description,
    priority_1: log.priority_1,
    priority_2: log.priority_2,
    priority_3: log.priority_3,
    priority_1_status: log.priority_1_status,
    priority_2_status: log.priority_2_status,
    priority_3_status: log.priority_3_status,
    work_completed_notes: log.work_completed_notes,
    evening_energy: log.evening_energy === '' ? '' : log.evening_energy,
    evening_meal_type: log.evening_meal_type,
    evening_egg_count: log.evening_egg_count === '' ? '' : log.evening_egg_count,
    evening_protein_scoops:
      log.evening_protein_scoops === '' ? '' : log.evening_protein_scoops,
    evening_meal_notes: log.evening_meal_notes,
    key_insight: log.key_insight,
    improvement_note: log.improvement_note,
    coffee_cups: log.coffee_cups === '' ? '' : log.coffee_cups,
    soft_drinks_ml: log.soft_drinks_ml === '' ? '' : log.soft_drinks_ml,
    packaged_and_outside_foods_notes: log.packaged_and_outside_foods_notes,
    daily_steps: log.daily_steps === '' ? '' : log.daily_steps,
    additional_protein_g: computeAdditionalProteinG(log),
    last_updated_at: log.last_updated_at || nowIndiaISOString(),
    sync_status: log.sync_status || 'synced',
  }
}
