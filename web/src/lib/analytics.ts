import type { LogRecord, PriorityStatus } from '../types/log'
import { createDefaultLog, mergeWithDefaults } from './defaultLog'
import { addDaysISO, normalizeCalendarISODate } from './dates'
import { computeSleepHoursForLog } from './sleepHours'
import type { AnalyticsWeekBounds } from './analyticsWeek'
import { enumerateDatesInclusive } from './analyticsWeek'

export type LogByDate = Map<string, LogRecord>

export function buildLogMapFromEnvelopes(
  envelopes: { date: string; data: LogRecord }[],
): LogByDate {
  const m = new Map<string, LogRecord>()
  for (const e of envelopes) {
    m.set(normalizeCalendarISODate(e.date), e.data)
  }
  return m
}

export function getLogForDateOrDefault(
  map: LogByDate,
  date: string,
): LogRecord {
  const d = normalizeCalendarISODate(date)
  const existing = map.get(d)
  if (existing) return mergeWithDefaults(d, existing)
  return createDefaultLog(d)
}

/** Decimal hours in Asia/Kolkata for chart Y (wake time). */
export function wakeTimeToDecimalHoursIST(wakeISO: string): number | null {
  const t = Date.parse(wakeISO)
  if (Number.isNaN(t)) return null
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date(t))
  const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? '')
  const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? '')
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null
  return hour + minute / 60
}

export function computeSleepHoursForDay(
  map: LogByDate,
  date: string,
): number | '' {
  const log = getLogForDateOrDefault(map, date)
  const prev = addDaysISO(normalizeCalendarISODate(date), -1)
  const prevLog = getLogForDateOrDefault(map, prev)
  const prevSleep = (prevLog.sleep_time ?? '').trim()
  return computeSleepHoursForLog(log, prevSleep)
}

export function getWeekToDateLogs(
  map: LogByDate,
  bounds: AnalyticsWeekBounds,
): LogRecord[] {
  return enumerateDatesInclusive(bounds.start, bounds.end).map((d) =>
    getLogForDateOrDefault(map, d),
  )
}

function priorityWeight(s: PriorityStatus): number {
  if (s === 'Done') return 1
  if (s === 'Partial') return 0.5
  if (s === 'Not Done') return 0
  return 0
}

export function computePriorityCompletionPercent(
  logs: LogRecord[],
  priorityIndex: 1 | 2 | 3,
): number | null {
  if (logs.length === 0) return null
  const key =
    priorityIndex === 1
      ? 'priority_1_status'
      : priorityIndex === 2
        ? 'priority_2_status'
        : 'priority_3_status'
  let sum = 0
  for (const log of logs) {
    sum += priorityWeight(log[key] as PriorityStatus)
  }
  return Math.round((sum / logs.length) * 1000) / 10
}

export function computeAdherenceCount(
  logs: LogRecord[],
  predicate: (log: LogRecord) => boolean,
): { done: number; total: number } {
  let done = 0
  for (const log of logs) {
    if (predicate(log)) done++
  }
  return { done, total: logs.length }
}

export function proteinDoneForDay(log: LogRecord): boolean {
  const eggs = log.egg_count
  const scoops = log.protein_scoops
  const e = typeof eggs === 'number' && eggs > 0
  const p = typeof scoops === 'number' && scoops > 0
  return e || p
}

export function sumWeeklyFocusMinutes(logs: LogRecord[]): number {
  let sum = 0
  for (const log of logs) {
    const m = log.focus_work_minutes
    if (typeof m === 'number' && Number.isFinite(m)) sum += m
  }
  return sum
}

export function formatHoursNatural(hours: number): string {
  if (Number.isInteger(hours)) return String(hours)
  const t = Math.round(hours * 10) / 10
  return t % 1 === 0 ? String(Math.round(t)) : String(t)
}

export type SinsSummary = {
  coffeeCups: number
  softDrinksMl: number
  packagedOutsideFoodDays: number
}

export function computeSinsSummary(logs: LogRecord[]): SinsSummary {
  let coffeeCups = 0
  let softDrinksMl = 0
  let packagedOutsideFoodDays = 0
  for (const log of logs) {
    const c = log.coffee_cups
    if (typeof c === 'number' && Number.isFinite(c)) coffeeCups += c
    const s = log.soft_drinks_ml
    if (typeof s === 'number' && Number.isFinite(s)) softDrinksMl += s
    const notes = (log.packaged_and_outside_foods_notes ?? '').trim()
    if (notes.length > 0) packagedOutsideFoodDays++
  }
  return { coffeeCups, softDrinksMl, packagedOutsideFoodDays }
}
