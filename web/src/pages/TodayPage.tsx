import { useEffect } from 'react'
import { useLogStore } from '../store/useLogStore'
import { addDaysISO, formatDisplayDate, todayLocalISODate } from '../lib/dates'
import { formatTimestamp } from '../lib/formatTime'
import { QuickActions } from '../components/QuickActions'
import { MorningSection } from '../components/MorningSection'
import { WorkoutSection } from '../components/WorkoutSection'
import { MeditationSection } from '../components/MeditationSection'
import { WorkPlanningSection } from '../components/WorkPlanningSection'
import { WorkTrackingSection } from '../components/WorkTrackingSection'
import { WorkReflectionSection } from '../components/WorkReflectionSection'
import { ScoresSection } from '../components/ScoresSection'
import { PersonalReflectionSection } from '../components/PersonalReflectionSection'
import { SinsSection } from '../components/SinsSection'
import { StepsSection } from '../components/StepsSection'

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

  useEffect(() => {
    void loadLogForDate(currentDate)
  }, [currentDate, loadLogForDate])

  if (!hydrated || !currentLog) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-slate-500">
        Loading…
      </div>
    )
  }

  const isToday = currentDate === todayLocalISODate()

  return (
    <div className="space-y-4 pb-6">
      <header className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            className="rounded-xl bg-slate-800 px-3 py-2 text-lg text-slate-200 ring-1 ring-slate-700"
            aria-label="Previous day"
            onClick={() => setCurrentDate(addDaysISO(currentDate, -1))}
          >
            ‹
          </button>
          <div className="flex-1 text-center">
            <h1 className="text-lg font-bold text-white">
              {formatDisplayDate(currentDate)}
            </h1>
            <p className="text-xs text-slate-500">{currentDate}</p>
          </div>
          <button
            type="button"
            className="rounded-xl bg-slate-800 px-3 py-2 text-lg text-slate-200 ring-1 ring-slate-700"
            aria-label="Next day"
            onClick={() => setCurrentDate(addDaysISO(currentDate, 1))}
          >
            ›
          </button>
        </div>
        {!isToday ? (
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => void loadTodayLog()}
              className="rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white"
            >
              Today
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

      <QuickActions log={currentLog} onField={updateField} />
      <MorningSection log={currentLog} onField={updateField} />
      <WorkoutSection log={currentLog} onField={updateField} />
      <MeditationSection log={currentLog} onField={updateField} />
      <WorkPlanningSection log={currentLog} onField={updateField} />
      <WorkTrackingSection log={currentLog} onField={updateField} />
      <WorkReflectionSection log={currentLog} onField={updateField} />
      <ScoresSection log={currentLog} onField={updateField} />
      <SinsSection log={currentLog} onField={updateField} />
      <StepsSection log={currentLog} onField={updateField} />
      <PersonalReflectionSection log={currentLog} onField={updateField} />
    </div>
  )
}
