import { useEffect, useState } from 'react'
import { useLogStore } from '../store/useLogStore'
import { isApiConfigured } from '../lib/api'
import {
  addDaysISO,
  calendarDayDiff,
  formatDisplayDate,
  normalizeCalendarISODate,
  todayLocalISODate,
} from '../lib/dates'
import { formatTimestamp } from '../lib/formatTime'
import { QuickActions } from '../components/QuickActions'
import { DayTypeSection } from '../components/DayTypeSection'
import { MorningSection } from '../components/MorningSection'
import { WorkoutSection } from '../components/WorkoutSection'
import { MeditationSection } from '../components/MeditationSection'
import { MedicationTabletsSection } from '../components/MedicationTabletsSection'
import { FocusWorkSection } from '../components/FocusWorkSection'
import { WorkPlanningSection } from '../components/WorkPlanningSection'
import { WorkTrackingSection } from '../components/WorkTrackingSection'
import { WorkReflectionSection } from '../components/WorkReflectionSection'
import { ScoresSection } from '../components/ScoresSection'
import { PersonalReflectionSection } from '../components/PersonalReflectionSection'
import { EveningProteinSection } from '../components/EveningProteinSection'
import { BreathingLoadScreen } from '../components/BreathingLoadScreen'
import { SinsSection } from '../components/SinsSection'
import { StepsSection } from '../components/StepsSection'
import { dayTypeBadgeLabel } from '../constants/dayType'

export function TodayPage() {
  const currentDate = useLogStore((s) => s.currentDate)
  const currentLog = useLogStore((s) => s.currentLog)
  const hydrated = useLogStore((s) => s.hydrated)
  const loadLogForDate = useLogStore((s) => s.loadLogForDate)
  const loadTodayLog = useLogStore((s) => s.loadTodayLog)
  const setCurrentDate = useLogStore((s) => s.setCurrentDate)
  const updateField = useLogStore((s) => s.updateField)
  const currentSyncStatus = useLogStore((s) => s.currentSyncStatus)
  const syncError = useLogStore((s) => s.syncError)
  const lastSyncedAt = useLogStore((s) => s.lastSyncedAt)
  const refreshFromSheet = useLogStore((s) => s.refreshFromSheet)
  const [sheetRefreshing, setSheetRefreshing] = useState(false)

  useEffect(() => {
    void loadLogForDate(currentDate)
  }, [currentDate, loadLogForDate])

  if (!hydrated || !currentLog) {
    const d = normalizeCalendarISODate(currentDate)
    return <BreathingLoadScreen detail={`${formatDisplayDate(d)} · ${d}`} />
  }

  const today = todayLocalISODate()
  const normCurrent = normalizeCalendarISODate(currentDate)
  const isToday = normCurrent === today
  const canGoNext = addDaysISO(normCurrent, 1) <= today
  const showJumpToToday = calendarDayDiff(normCurrent, today) >= 2
  const dayBadge = dayTypeBadgeLabel(currentLog.day_type)

  return (
    <div className="space-y-4 pb-6">
      <header className="flex flex-col gap-2">
        {isApiConfigured() ? (
          <div className="flex justify-end">
            <button
              type="button"
              disabled={sheetRefreshing}
              onClick={() => {
                setSheetRefreshing(true)
                void refreshFromSheet().finally(() => setSheetRefreshing(false))
              }}
              className="text-xs font-medium text-sky-400 underline-offset-2 hover:underline disabled:cursor-wait disabled:opacity-50"
            >
              {sheetRefreshing ? 'Syncing from sheet…' : 'Sync from sheet'}
            </button>
          </div>
        ) : null}
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            className="rounded-xl bg-slate-800 px-3 py-2 text-lg text-slate-200 ring-1 ring-slate-700"
            aria-label="Previous day"
            onClick={() => setCurrentDate(addDaysISO(normCurrent, -1))}
          >
            ‹
          </button>
          <div className="flex-1 text-center">
            <h1 className="flex flex-wrap items-center justify-center gap-2 text-lg font-bold text-white">
              <span>{formatDisplayDate(normCurrent)}</span>
              {dayBadge ? (
                <span className="rounded-full bg-violet-500/25 px-2 py-0.5 text-xs font-semibold text-violet-200 ring-1 ring-violet-500/40">
                  {dayBadge}
                </span>
              ) : null}
              {isToday ? (
                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-semibold text-emerald-400">
                  Today
                </span>
              ) : null}
            </h1>
            <p className="text-xs text-slate-500">{normCurrent}</p>
          </div>
          <button
            type="button"
            className="rounded-xl bg-slate-800 px-3 py-2 text-lg text-slate-200 ring-1 ring-slate-700 disabled:cursor-not-allowed disabled:opacity-35"
            aria-label="Next day"
            disabled={!canGoNext}
            onClick={() => {
              if (!canGoNext) return
              setCurrentDate(addDaysISO(normCurrent, 1))
            }}
          >
            ›
          </button>
        </div>
        {showJumpToToday ? (
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => void loadTodayLog()}
              className="text-sm font-medium text-sky-400 underline-offset-2 hover:underline"
            >
              Jump to today
            </button>
          </div>
        ) : null}
        <div className="flex flex-wrap items-center justify-center gap-2 text-center text-xs text-slate-500">
          <span
            className={
              currentSyncStatus === 'pending' ? 'text-amber-400' : 'text-emerald-500'
            }
          >
            {currentSyncStatus === 'pending' ? 'Local · pending sync' : 'Local · synced'}
          </span>
          {lastSyncedAt ? (
            <span>
              · Last push{' '}
              {formatTimestamp(lastSyncedAt)}
            </span>
          ) : null}
        </div>
        {syncError ? (
          <p className="text-center text-xs text-red-400">{syncError}</p>
        ) : null}
        <p className="text-center text-sm text-slate-400">
          Sleep (prev evening → this wake):{' '}
          <span className="font-semibold text-slate-200">
            {currentLog.sleep_hours === '' ? '—' : `${currentLog.sleep_hours} h`}
          </span>
        </p>
      </header>

      <DayTypeSection log={currentLog} onField={updateField} />
      <QuickActions log={currentLog} onField={updateField} />
      <MorningSection log={currentLog} onField={updateField} />
      <WorkoutSection log={currentLog} onField={updateField} />
      <MeditationSection log={currentLog} onField={updateField} />
      <MedicationTabletsSection log={currentLog} onField={updateField} />
      <FocusWorkSection log={currentLog} onField={updateField} />
      <WorkPlanningSection log={currentLog} onField={updateField} />
      <WorkTrackingSection log={currentLog} onField={updateField} />
      <WorkReflectionSection log={currentLog} onField={updateField} />
      <ScoresSection log={currentLog} onField={updateField} />
      <EveningProteinSection log={currentLog} onField={updateField} />
      <SinsSection log={currentLog} onField={updateField} />
      <StepsSection log={currentLog} onField={updateField} />
      <PersonalReflectionSection log={currentLog} onField={updateField} />
    </div>
  )
}
