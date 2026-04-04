import { useCallback, useEffect, useState } from 'react'
import {
  getAnalyticsWeekBounds,
  enumerateDatesInclusive,
  weekLabelShort,
  daysInBounds,
} from '../lib/analyticsWeek'
import { addDaysISO, normalizeCalendarISODate, todayLocalISODate } from '../lib/dates'
import { loadLogsForDateRange } from '../lib/analyticsLoad'
import type { LogByDate } from '../lib/analytics'
import {
  getWeekToDateLogs,
  getLogForDateOrDefault,
  wakeTimeToDecimalHoursIST,
  computeSleepHoursForDay,
  computeAdherenceCount,
  proteinDoneForDay,
  sumWeeklyFocusMinutes,
  computePriorityCompletionPercent,
  computeSinsSummary,
} from '../lib/analytics'
import { WeeklyLineChart } from '../components/analytics/WeeklyLineChart'
import { AdherenceRow } from '../components/analytics/AdherenceRow'
import { SinsSummary } from '../components/analytics/SinsSummary'
import { FocusHoursCard } from '../components/analytics/FocusHoursCard'
import { PriorityCompletionCards } from '../components/analytics/PriorityCompletionCards'

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-3 text-sm font-semibold tracking-wide text-slate-200">
      {children}
    </h2>
  )
}

export function AnalyticsPage() {
  const [weekOffset, setWeekOffset] = useState(0)
  const [map, setMap] = useState<LogByDate | null>(null)
  const [loading, setLoading] = useState(true)

  const bounds = getAnalyticsWeekBounds(weekOffset, todayLocalISODate())
  const dateList = enumerateDatesInclusive(bounds.start, bounds.end)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const b = getAnalyticsWeekBounds(weekOffset, todayLocalISODate())
      const loadStart = addDaysISO(normalizeCalendarISODate(b.start), -1)
      const m = await loadLogsForDateRange(loadStart, b.end)
      setMap(m)
    } finally {
      setLoading(false)
    }
  }, [weekOffset])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const weekLogs = map ? getWeekToDateLogs(map, bounds) : []

  const hasAnyData =
    weekLogs.length > 0 &&
    weekLogs.some((l) => (l.last_updated_at ?? '').trim().length > 0)

  const wakePoints = dateList.map((d) => ({
    date: d,
    value: map
      ? wakeTimeToDecimalHoursIST(getLogForDateOrDefault(map, d).wake_time)
      : null,
  }))

  const sleepPoints = dateList.map((d) => ({
    date: d,
    value: (() => {
      if (!map) return null
      const sh = computeSleepHoursForDay(map, d)
      return sh === '' ? null : sh
    })(),
  }))

  const stepsPoints = dateList.map((d) => ({
    date: d,
    value: (() => {
      if (!map) return null
      const s = getLogForDateOrDefault(map, d).daily_steps
      if (typeof s !== 'number' || !Number.isFinite(s)) return null
      return s
    })(),
  }))

  const workout = computeAdherenceCount(weekLogs, (l) => l.workout_done === true)
  const med = computeAdherenceCount(weekLogs, (l) => l.meditation_done === true)
  const prot = computeAdherenceCount(weekLogs, proteinDoneForDay)

  const workoutFlags = weekLogs.map((l) => l.workout_done === true)
  const medFlags = weekLogs.map((l) => l.meditation_done === true)
  const protFlags = weekLogs.map(proteinDoneForDay)

  const focusMinutes = sumWeeklyFocusMinutes(weekLogs)
  const focusHours = focusMinutes / 60

  const p1 = computePriorityCompletionPercent(weekLogs, 1)
  const p2 = computePriorityCompletionPercent(weekLogs, 2)
  const p3 = computePriorityCompletionPercent(weekLogs, 3)

  const sins = computeSinsSummary(weekLogs)

  const canGoNext = weekOffset < 0

  return (
    <div className="space-y-6 pb-6">
      <header className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            aria-label="Previous week"
            className="rounded-xl bg-slate-800 px-3 py-2 text-lg text-slate-200 ring-1 ring-slate-700"
            onClick={() => setWeekOffset((o) => o - 1)}
          >
            ‹
          </button>
          <div className="flex-1 text-center">
            <h1 className="text-lg font-bold text-white">Analytics</h1>
            <p className="text-xs text-slate-500">
              {weekLabelShort(bounds.start, bounds.end)} · {daysInBounds(bounds.start, bounds.end)}{' '}
              day{daysInBounds(bounds.start, bounds.end) === 1 ? '' : 's'}
            </p>
          </div>
          <button
            type="button"
            aria-label="Next week"
            disabled={!canGoNext}
            className="rounded-xl bg-slate-800 px-3 py-2 text-lg text-slate-200 ring-1 ring-slate-700 disabled:cursor-not-allowed disabled:opacity-35"
            onClick={() => {
              if (!canGoNext) return
              setWeekOffset((o) => Math.min(0, o + 1))
            }}
          >
            ›
          </button>
        </div>
      </header>

      {loading || !map ? (
        <p className="text-center text-sm text-slate-500">Loading…</p>
      ) : !hasAnyData ? (
        <p className="rounded-xl bg-slate-900/60 py-10 text-center text-sm text-slate-500 ring-1 ring-slate-800">
          No logs for this week yet
        </p>
      ) : (
        <>
          <section>
            <SectionHeader>Health</SectionHeader>
            <div className="space-y-6">
              <WeeklyLineChart
                title="Wake time"
                subtitle="When you woke up (from wake time field)"
                points={wakePoints}
                formatY={(v) => {
                  const h = Math.floor(v)
                  const m = Math.round((v - h) * 60)
                  const ap = h >= 12 ? 'PM' : 'AM'
                  const hr12 = h % 12 === 0 ? 12 : h % 12
                  return m === 0
                    ? `${hr12} ${ap}`
                    : `${hr12}:${String(m).padStart(2, '0')} ${ap}`
                }}
                yAxisLabel="Time (IST)"
                xAxisLabel="Day of week"
                showValueAbovePoints
              />
              <WeeklyLineChart
                title="Sleep hours"
                subtitle="Previous evening sleep → this day’s wake (derived)"
                points={sleepPoints}
                formatY={(v) => `${v} h`}
                yAxisLabel="Hours"
                xAxisLabel="Day of week"
                showValueAbovePoints
              />
              <AdherenceRow
                label="Workout"
                done={workout.done}
                total={workout.total}
                flags={workoutFlags}
              />
              <AdherenceRow
                label="Meditation"
                done={med.done}
                total={med.total}
                flags={medFlags}
              />
              <AdherenceRow
                label="Protein"
                done={prot.done}
                total={prot.total}
                flags={protFlags}
              />
              <WeeklyLineChart
                title="Steps"
                subtitle="Daily steps (from sheet / app)"
                points={stepsPoints}
                formatY={(v) => String(Math.round(v))}
                yAxisLabel="Steps"
                xAxisLabel="Day of week"
              />
              <SinsSummary summary={sins} />
            </div>
          </section>

          <section>
            <SectionHeader>Work</SectionHeader>
            <div className="space-y-4">
              <FocusHoursCard completedHours={focusHours} />
              <PriorityCompletionCards p1={p1} p2={p2} p3={p3} />
            </div>
          </section>
        </>
      )}
    </div>
  )
}
