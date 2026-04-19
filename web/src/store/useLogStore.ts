import { create } from 'zustand'
import type { ActivityEntry, ActivityLevel } from '../types/activity'
import type { LogRecord } from '../types/log'
import {
  createDefaultLog,
  mergeWithDefaults,
  normalizeLegacyLog,
} from '../lib/defaultLog'
import { deleteLogLocal, getLogEnvelope, saveLogLocal } from '../lib/db'
import {
  todayLocalISODate,
  addDaysISO,
  nowIndiaISOString,
  normalizeCalendarISODate,
} from '../lib/dates'
import {
  fetchPreviousDaySleepTimeISO,
  previousDaySleepFromOutcome,
  safeApiGetLog,
  type ApiGetLogOutcome,
} from '../lib/prevEveningSleep'
import { computeSleepHoursForLog } from '../lib/sleepHours'
import { apiUpsertLog, isApiConfigured } from '../lib/api'

const MAX_ACTIVITY = 50

let fieldActivityTimer: ReturnType<typeof setTimeout> | null = null

async function withSleepHours(
  date: string,
  log: LogRecord,
  prevDayOutcome?: ApiGetLogOutcome,
): Promise<LogRecord> {
  const prevDate = addDaysISO(date, -1)
  const prevSleep =
    prevDayOutcome !== undefined
      ? await previousDaySleepFromOutcome(prevDate, prevDayOutcome)
      : await fetchPreviousDaySleepTimeISO(prevDate)
  const sh = computeSleepHoursForLog(log, prevSleep)
  if (sh === log.sleep_hours) return log
  return { ...log, sleep_hours: sh }
}

/** Align local log with sheet: when workout_done is false, those columns are blank on upload. */
function persistLogAfterSheetSync(log: LogRecord): LogRecord {
  if (log.workout_done) return { ...log }
  return {
    ...log,
    workout_type: '',
    workout_log_json: '',
  }
}

type LogStore = {
  hydrated: boolean
  currentDate: string
  currentLog: LogRecord | null
  currentSyncStatus: 'pending' | 'synced'
  syncError: string | null
  lastSyncedAt: string | null
  activityLog: ActivityEntry[]
  pushActivity: (level: ActivityLevel, message: string) => void
  clearActivityLog: () => void
  loadTodayLog: () => void
  loadLogForDate: (date: string) => Promise<void>
  /** Pull this calendar day from the sheet; drop local row if the sheet has no row. */
  refreshFromSheet: () => Promise<void>
  updateField: <K extends keyof LogRecord>(
    field: K,
    value: LogRecord[K],
  ) => Promise<void>
  saveLocally: () => Promise<void>
  syncWithServer: () => Promise<void>
  setCurrentDate: (date: string) => void
}

export const useLogStore = create<LogStore>((set, get) => ({
  hydrated: false,
  currentDate: todayLocalISODate(),
  currentLog: null,
  currentSyncStatus: 'synced',
  syncError: null,
  lastSyncedAt: null,
  activityLog: [],

  pushActivity: (level, message) => {
    const entry: ActivityEntry = {
      id: crypto.randomUUID(),
      time: nowIndiaISOString(),
      level,
      message,
    }
    set((s) => ({
      activityLog: [entry, ...s.activityLog].slice(0, MAX_ACTIVITY),
    }))
  },

  clearActivityLog: () => set({ activityLog: [] }),

  setCurrentDate: (date) => {
    const d = normalizeCalendarISODate(date)
    const today = todayLocalISODate()
    const next = d > today ? today : d
    if (normalizeCalendarISODate(get().currentDate) === next) return
    set({
      currentDate: next,
      currentLog: null,
      hydrated: false,
      syncError: null,
    })
  },

  loadTodayLog: () => {
    set({
      currentDate: todayLocalISODate(),
      currentLog: null,
      hydrated: false,
      syncError: null,
    })
  },

  loadLogForDate: async (date) => {
    const { pushActivity } = get()
    let targetDate = normalizeCalendarISODate(date)
    const today = todayLocalISODate()
    if (targetDate > today) {
      set({
        currentDate: today,
        currentLog: null,
        hydrated: false,
        syncError: null,
      })
      targetDate = today
    }

    pushActivity('info', `Loading log for ${targetDate}…`)

    const local = await getLogEnvelope(targetDate)
    const isPastDay = targetDate < today
    const online =
      typeof navigator !== 'undefined' && navigator.onLine
    const canRemote = isApiConfigured() && online

    let log: LogRecord
    let remoteNote = ''
    let prevForSleep: ApiGetLogOutcome | undefined

    if (isPastDay && canRemote) {
      const prevDate = addDaysISO(targetDate, -1)
      const [todayO, prevO] = await Promise.all([
        safeApiGetLog(targetDate),
        safeApiGetLog(prevDate),
      ])
      prevForSleep = prevO
      if (!todayO.ok) {
        log = local
          ? mergeWithDefaults(targetDate, local.data)
          : createDefaultLog(targetDate)
        remoteNote = `Google GET failed: ${todayO.error instanceof Error ? todayO.error.message : String(todayO.error)} — using ${local ? 'device' : 'blank'}.`
      } else if (todayO.log) {
        log = mergeWithDefaults(targetDate, todayO.log)
        await saveLogLocal(log, 'synced')
        remoteNote = 'Loaded from Google Sheet.'
      } else {
        log = createDefaultLog(targetDate)
        remoteNote =
          'No row on Google Sheet for this date — showing blank (not device cache).'
      }
    } else {
      log = local
        ? mergeWithDefaults(targetDate, local.data)
        : createDefaultLog(targetDate)

      if (canRemote) {
        const prevDate = addDaysISO(targetDate, -1)
        const [todayO, prevO] = await Promise.all([
          safeApiGetLog(targetDate),
          safeApiGetLog(prevDate),
        ])
        prevForSleep = prevO
        if (!todayO.ok) {
          remoteNote = `Google GET failed: ${todayO.error instanceof Error ? todayO.error.message : String(todayO.error)} — using local.`
        } else if (todayO.log) {
          const localTs = local?.data.last_updated_at
            ? Date.parse(local.data.last_updated_at)
            : 0
          const remoteTs = todayO.log.last_updated_at
            ? Date.parse(todayO.log.last_updated_at)
            : 0
          if (!local || remoteTs >= localTs) {
            log = mergeWithDefaults(targetDate, todayO.log)
            await saveLogLocal(log, 'synced')
            remoteNote =
              'Merged with Google Sheet (remote newer or no local).'
          } else {
            remoteNote = 'Using local copy (newer than Google Sheet).'
          }
        } else {
          remoteNote =
            'No row on Google Sheet yet for this date — new log.'
        }
      } else {
        remoteNote = !isApiConfigured()
          ? 'API not configured — device only.'
          : 'Offline — device only.'
      }
    }

    const beforeSleep = log
    log = await withSleepHours(targetDate, log, prevForSleep)
    if (log.sleep_hours !== beforeSleep.sleep_hours) {
      await saveLogLocal(log, 'pending')
    }

    if (get().currentDate !== targetDate) {
      return
    }

    const env = await getLogEnvelope(targetDate)
    set({
      currentLog: log,
      hydrated: true,
      syncError: null,
      currentSyncStatus: env?.syncStatus ?? 'synced',
    })
    const loadLevel: ActivityLevel = remoteNote.includes('Google GET failed')
      ? 'error'
      : 'success'
    get().pushActivity(loadLevel, `Ready · ${targetDate}. ${remoteNote}`)
  },

  refreshFromSheet: async () => {
    const { pushActivity } = get()
    const targetDate = normalizeCalendarISODate(get().currentDate)

    if (!isApiConfigured()) {
      pushActivity(
        'info',
        'Sheet refresh skipped: add VITE_APPS_SCRIPT_URL and VITE_SCRIPT_SECRET in .env.',
      )
      return
    }
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      pushActivity('info', 'Sheet refresh skipped: offline.')
      return
    }

    pushActivity('info', `Refreshing from Google Sheet · ${targetDate}…`)

    try {
      const prevDate = addDaysISO(targetDate, -1)
      const [todayO, prevO] = await Promise.all([
        safeApiGetLog(targetDate),
        safeApiGetLog(prevDate),
      ])
      let log: LogRecord
      let note: string
      if (!todayO.ok) {
        throw todayO.error instanceof Error
          ? todayO.error
          : new Error(String(todayO.error))
      }
      if (todayO.log) {
        log = mergeWithDefaults(targetDate, todayO.log)
        await saveLogLocal(log, 'synced')
        note = 'Updated from sheet.'
      } else {
        await deleteLogLocal(targetDate)
        log = createDefaultLog(targetDate)
        note = 'No row on sheet — removed device copy for this date.'
      }

      const beforeSleep = log
      log = await withSleepHours(targetDate, log, prevO)
      if (log.sleep_hours !== beforeSleep.sleep_hours) {
        await saveLogLocal(log, 'pending')
      }

      if (get().currentDate !== targetDate) return

      const env = await getLogEnvelope(targetDate)
      set({
        currentLog: log,
        syncError: null,
        currentSyncStatus: env?.syncStatus ?? 'synced',
      })
      pushActivity('success', `Sheet refresh · ${targetDate}. ${note}`)
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      set({ syncError: msg })
      pushActivity('error', `Sheet refresh failed: ${msg}`)
    }
  },

  updateField: async (field, value) => {
    const { currentLog, currentDate } = get()
    if (!currentLog) return
    if (normalizeCalendarISODate(currentDate) > todayLocalISODate()) return
    let next: LogRecord = {
      ...currentLog,
      [field]: value,
      last_updated_at: nowIndiaISOString(),
    }
    if (
      field === 'day_type' &&
      String(value) !== String(currentLog.day_type)
    ) {
      next = {
        ...next,
        reach_office_time: '',
        leave_office_time: '',
      }
    }
    if (field === 'wake_time' || field === 'sleep_time') {
      const prevDate = addDaysISO(currentDate, -1)
      const prevSleep = await fetchPreviousDaySleepTimeISO(prevDate)
      next = {
        ...next,
        sleep_hours: computeSleepHoursForLog(next, prevSleep),
      }
    }
    next = normalizeLegacyLog(next)
    set({ currentLog: next, currentSyncStatus: 'pending' })
    await saveLogLocal(next, 'pending')
    if (fieldActivityTimer) clearTimeout(fieldActivityTimer)
    fieldActivityTimer = setTimeout(() => {
      fieldActivityTimer = null
      get().pushActivity(
        'success',
        `Saved on device · ${String(field)} · ${currentDate}. Tap Log (bottom bar) to upload.`,
      )
    }, 600)
  },

  saveLocally: async () => {
    const { currentLog } = get()
    if (!currentLog) return
    await saveLogLocal(currentLog, 'pending')
  },

  syncWithServer: async () => {
    const { pushActivity, currentLog } = get()
    if (!currentLog) {
      pushActivity('info', 'Log skipped: still loading this day — wait a moment and try again.')
      return
    }
    if (normalizeCalendarISODate(currentLog.date) > todayLocalISODate()) {
      pushActivity('info', 'Sync skipped: cannot log a future date.')
      return
    }
    if (!isApiConfigured()) {
      pushActivity(
        'info',
        'Sync skipped: add VITE_APPS_SCRIPT_URL and VITE_SCRIPT_SECRET to .env',
      )
      return
    }
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      pushActivity('info', 'Sync skipped: offline.')
      return
    }

    const date = currentLog.date
    pushActivity('info', `Logging to Google Sheet · ${date}…`)

    try {
      const payload = { ...currentLog, sync_status: 'synced' }
      await apiUpsertLog(payload)
      const persisted = persistLogAfterSheetSync(payload)
      await saveLogLocal(persisted, 'synced')
      set({
        currentLog: persisted,
        syncError: null,
        lastSyncedAt: nowIndiaISOString(),
        currentSyncStatus: 'synced',
      })
      pushActivity(
        'success',
        `Logged to Google Sheet · ${date} (upsert).`,
      )
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Sync failed'
      set({ syncError: msg })
      pushActivity('error', `Log failed · ${date}: ${msg}`)
    }
  },
}))
