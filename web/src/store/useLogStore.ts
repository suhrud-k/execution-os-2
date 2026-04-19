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

/** Parse `last_updated_at` for LWW; missing or invalid → 0 (treated as oldest). */
function lastUpdatedMs(record: LogRecord | null | undefined): number {
  const raw = record?.last_updated_at?.trim()
  if (!raw) return 0
  const t = Date.parse(raw)
  return Number.isFinite(t) ? t : 0
}

function applySleepHoursFromPrevEnvelope(
  log: LogRecord,
  prevEnv: Awaited<ReturnType<typeof getLogEnvelope>>,
): LogRecord {
  const prevSleep = (prevEnv?.data.sleep_time ?? '').trim()
  const sh = computeSleepHoursForLog(log, prevSleep)
  if (sh === log.sleep_hours) return log
  return { ...log, sleep_hours: sh }
}

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

export type RemoteDivergence = {
  date: string
  reason: string
}

type LogStore = {
  /** IndexedDB read for current date finished; safe to render form (or blocking path completed). */
  hydrated: boolean
  isSyncing: boolean
  remoteDivergence: RemoteDivergence | null
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
  /** Re-read current date from IndexedDB into the form (after sheet sync wrote newer data). */
  refreshFromLocal: () => Promise<void>
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
  isSyncing: false,
  remoteDivergence: null,
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
      remoteDivergence: null,
    })
  },

  loadTodayLog: () => {
    set({
      currentDate: todayLocalISODate(),
      currentLog: null,
      hydrated: false,
      syncError: null,
      remoteDivergence: null,
    })
  },

  refreshFromLocal: async () => {
    const targetDate = normalizeCalendarISODate(get().currentDate)
    const env = await getLogEnvelope(targetDate)
    if (!env) return
    const prevDate = addDaysISO(targetDate, -1)
    const prevEnv = await getLogEnvelope(prevDate)
    let log = mergeWithDefaults(targetDate, env.data)
    log = applySleepHoursFromPrevEnvelope(log, prevEnv)
    set({
      currentLog: normalizeLegacyLog(log),
      remoteDivergence: null,
      currentSyncStatus: env.syncStatus,
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
        remoteDivergence: null,
      })
      targetDate = today
    }

    pushActivity('info', `Loading log for ${targetDate}…`)

    const prevDate = addDaysISO(targetDate, -1)
    const [localToday, localPrev] = await Promise.all([
      getLogEnvelope(targetDate),
      getLogEnvelope(prevDate),
    ])

    const isPastDay = targetDate < today
    const online =
      typeof navigator !== 'undefined' && navigator.onLine
    const canRemote = isApiConfigured() && online

    const runBlockingRemoteLoad = async () => {
      const [todayO, prevO] = await Promise.all([
        safeApiGetLog(targetDate),
        safeApiGetLog(prevDate),
      ])
      let log: LogRecord
      let remoteNote = ''
      if (!todayO.ok) {
        log = createDefaultLog(targetDate)
        remoteNote = `Google GET failed: ${todayO.error instanceof Error ? todayO.error.message : String(todayO.error)} — using blank.`
      } else if (todayO.log) {
        log = mergeWithDefaults(targetDate, todayO.log)
        await saveLogLocal(log, 'synced')
        remoteNote = isPastDay
          ? 'Loaded from Google Sheet.'
          : 'Merged with Google Sheet (remote newer or no local).'
      } else {
        log = createDefaultLog(targetDate)
        remoteNote = isPastDay
          ? 'No row on Google Sheet for this date — showing blank (not device cache).'
          : 'No row on Google Sheet yet for this date — new log.'
      }
      const beforeSleep = log
      log = await withSleepHours(targetDate, log, prevO)
      if (log.sleep_hours !== beforeSleep.sleep_hours) {
        await saveLogLocal(log, 'pending')
      }
      if (normalizeCalendarISODate(get().currentDate) !== targetDate) {
        return
      }
      const env = await getLogEnvelope(targetDate)
      set({
        currentLog: log,
        hydrated: true,
        syncError: null,
        currentSyncStatus: env?.syncStatus ?? 'synced',
        isSyncing: false,
        remoteDivergence: null,
      })
      const loadLevel: ActivityLevel = remoteNote.includes('Google GET failed')
        ? 'error'
        : 'success'
      get().pushActivity(loadLevel, `Ready · ${targetDate}. ${remoteNote}`)
    }

    const runBackgroundSheetSync = async () => {
      set({ isSyncing: true })
      let shouldDiverge = false
      let divergenceReason =
        'Newer data is available from your Google Sheet. Refresh to load it.'
      let divergedFromToday = false
      try {
        const [todayO, prevO] = await Promise.all([
          safeApiGetLog(targetDate),
          safeApiGetLog(prevDate),
        ])
        if (normalizeCalendarISODate(get().currentDate) !== targetDate) {
          return
        }

        if (todayO.ok && todayO.log) {
          const localEnv = await getLogEnvelope(targetDate)
          const localTs = lastUpdatedMs(localEnv?.data)
          const remoteTs = lastUpdatedMs(todayO.log)
          if (remoteTs > localTs) {
            try {
              const merged = mergeWithDefaults(targetDate, todayO.log)
              await saveLogLocal(merged, 'synced')
              shouldDiverge = true
              divergedFromToday = true
            } catch (e) {
              console.error('[loadLogForDate] saveLogLocal (remote today) failed', e)
            }
          }
        }

        if (
          prevO.ok &&
          prevO.log &&
          normalizeCalendarISODate(get().currentDate) === targetDate
        ) {
          const localPrevEnv = await getLogEnvelope(prevDate)
          const lpTs = lastUpdatedMs(localPrevEnv?.data)
          const rpTs = lastUpdatedMs(prevO.log)
          if (rpTs > lpTs) {
            try {
              await saveLogLocal(mergeWithDefaults(prevDate, prevO.log), 'synced')
              const todayE = await getLogEnvelope(targetDate)
              if (todayE) {
                let tlog = mergeWithDefaults(targetDate, todayE.data)
                const pE = await getLogEnvelope(prevDate)
                tlog = applySleepHoursFromPrevEnvelope(tlog, pE)
                if (tlog.sleep_hours !== todayE.data.sleep_hours) {
                  await saveLogLocal(tlog, todayE.syncStatus)
                }
                const cur = get().currentLog
                if (
                  cur &&
                  normalizeCalendarISODate(cur.date) === targetDate &&
                  tlog.sleep_hours !== cur.sleep_hours
                ) {
                  shouldDiverge = true
                  if (!divergedFromToday) {
                    divergenceReason =
                      'Sleep hours were updated from the sheet. Refresh to see them.'
                  }
                }
              }
            } catch (e) {
              console.error('[loadLogForDate] background prev save failed', e)
            }
          }
        }

        if (normalizeCalendarISODate(get().currentDate) !== targetDate) {
          return
        }

        set({
          remoteDivergence: shouldDiverge
            ? { date: targetDate, reason: divergenceReason }
            : null,
        })
      } catch (e) {
        console.error('[loadLogForDate] background sync failed', e)
      } finally {
        set({ isSyncing: false })
      }
    }

    if (!localToday) {
      if (!canRemote) {
        let log = createDefaultLog(targetDate)
        log = applySleepHoursFromPrevEnvelope(log, localPrev)
        log = normalizeLegacyLog(log)
        if (normalizeCalendarISODate(get().currentDate) !== targetDate) {
          return
        }
        set({
          currentLog: log,
          hydrated: true,
          syncError: null,
          currentSyncStatus: 'synced',
          isSyncing: false,
          remoteDivergence: null,
        })
        get().pushActivity(
          'success',
          `Ready · ${targetDate}. API not configured or offline — new blank log.`,
        )
        return
      }
      await runBlockingRemoteLoad()
      return
    }

    let log = mergeWithDefaults(targetDate, localToday.data)
    log = applySleepHoursFromPrevEnvelope(log, localPrev)
    if (log.sleep_hours !== localToday.data.sleep_hours) {
      await saveLogLocal(log, localToday.syncStatus)
    }
    log = normalizeLegacyLog(log)

    if (normalizeCalendarISODate(get().currentDate) !== targetDate) {
      return
    }

    set({
      currentLog: log,
      hydrated: true,
      syncError: null,
      currentSyncStatus: localToday.syncStatus,
      remoteDivergence: null,
    })
    get().pushActivity(
      'success',
      `Ready · ${targetDate}. Showing device copy; checking sheet in background…`,
    )

    if (canRemote) {
      void runBackgroundSheetSync()
    } else {
      set({ isSyncing: false })
    }
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

      if (normalizeCalendarISODate(get().currentDate) !== targetDate) return

      const env = await getLogEnvelope(targetDate)
      set({
        currentLog: log,
        syncError: null,
        currentSyncStatus: env?.syncStatus ?? 'synced',
        remoteDivergence: null,
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
        remoteDivergence: null,
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
