import { useEffect, useId, useState } from 'react'
import { SectionCard } from './ui/SectionCard'
import { formatTimestamp } from '../lib/formatTime'
import {
  combineCalendarDateAndTimeToIndiaISO,
  currentIndiaTimeHHmm,
  indiaISOToTimeInputValue,
} from '../lib/datetimeLocal'
import {
  isWeekendCalendarISODate,
  normalizeCalendarISODate,
  todayLocalISODate,
} from '../lib/dates'
import type { LogRecord } from '../types/log'

type QuickField = 'wake_time' | 'reach_office_time' | 'leave_office_time' | 'sleep_time'

/** Default wall times (IST) when opening the picker for a past day with no saved value. */
const PREVIOUS_DAY_QUICK_DEFAULTS: Record<QuickField, string> = {
  wake_time: '07:00',
  reach_office_time: '10:00',
  leave_office_time: '20:00',
  sleep_time: '22:30',
}

type Props = {
  log: LogRecord
  onField: <K extends keyof LogRecord>(
    field: K,
    value: LogRecord[K],
  ) => void | Promise<void>
}

export function QuickActions({ log, onField }: Props) {
  const titleId = useId()
  const [modal, setModal] = useState<null | { label: string; field: QuickField }>(
    null,
  )
  const [draftTime, setDraftTime] = useState('')

  useEffect(() => {
    if (!modal) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setModal(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [modal])

  const logDay = normalizeCalendarISODate(log.date)
  const isLogDayToday = logDay === todayLocalISODate()
  const weekend = isWeekendCalendarISODate(logDay)

  const allItems: {
    label: string
    field: QuickField
    current: string
    officeOnly?: boolean
  }[] = [
    { label: 'Wake up', field: 'wake_time', current: log.wake_time },
    {
      label: 'Reached office',
      field: 'reach_office_time',
      current: log.reach_office_time,
      officeOnly: true,
    },
    {
      label: 'Left office',
      field: 'leave_office_time',
      current: log.leave_office_time,
      officeOnly: true,
    },
    { label: 'Sleep', field: 'sleep_time', current: log.sleep_time },
  ]

  const items = weekend
    ? allItems.filter((x) => !x.officeOnly)
    : allItems

  const confirm = () => {
    if (!modal) return
    const iso = combineCalendarDateAndTimeToIndiaISO(
      normalizeCalendarISODate(log.date),
      draftTime,
    )
    if (!iso) return
    void onField(modal.field, iso as LogRecord[QuickField])
    setModal(null)
  }

  const canSaveTime = Boolean(
    combineCalendarDateAndTimeToIndiaISO(
      normalizeCalendarISODate(log.date),
      draftTime,
    ),
  )

  return (
    <SectionCard title="Quick actions">
      <div className="grid grid-cols-2 gap-2">
        {items.map(({ label, field, current }) => (
          <button
            key={field}
            type="button"
            onClick={() => {
              const existingTime = indiaISOToTimeInputValue(current)
              if (existingTime.trim() !== '') {
                setDraftTime(existingTime)
              } else if (isLogDayToday) {
                setDraftTime(currentIndiaTimeHHmm())
              } else {
                setDraftTime(PREVIOUS_DAY_QUICK_DEFAULTS[field])
              }
              setModal({ label, field })
            }}
            className="flex min-h-[4.5rem] flex-col items-start justify-center rounded-xl bg-slate-800 px-3 py-2 text-left ring-1 ring-slate-700 active:bg-slate-700"
          >
            <span className="text-sm font-semibold text-white">{label}</span>
            <span className="mt-1 text-xs text-slate-400">
              {formatTimestamp(current)}
            </span>
          </button>
        ))}
      </div>

      {modal ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center"
          role="presentation"
          onClick={() => setModal(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="w-full max-w-md rounded-2xl bg-slate-900 p-4 shadow-xl ring-1 ring-slate-700"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id={titleId} className="text-lg font-semibold text-white">
              {modal.label}
            </h3>
            <p className="mt-1 text-sm text-slate-400">
              Time only (IST), using this log day ({normalizeCalendarISODate(log.date)}).
            </p>
            <label className="mt-4 block">
              <span className="mb-2 block text-xs font-medium text-slate-500">
                Time (IST)
              </span>
              <input
                type="time"
                value={draftTime}
                onChange={(e) => setDraftTime(e.target.value)}
                className="w-full rounded-xl border-0 bg-slate-950 px-3 py-3 text-base text-white ring-1 ring-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </label>
            <div className="mt-6 flex gap-2">
              <button
                type="button"
                onClick={() => setModal(null)}
                className="min-h-12 flex-1 rounded-xl bg-slate-800 font-semibold text-slate-200 ring-1 ring-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirm}
                disabled={!canSaveTime}
                className="min-h-12 flex-1 rounded-xl bg-sky-600 font-semibold text-white disabled:opacity-40"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </SectionCard>
  )
}
