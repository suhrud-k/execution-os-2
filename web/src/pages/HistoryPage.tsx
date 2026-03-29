import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loadMergedHistory } from '../lib/history'
import { workCompletionPercent } from '../lib/workCompletion'
import { formatDisplayDate } from '../lib/dates'
import type { LogRecord } from '../types/log'
import { useLogStore } from '../store/useLogStore'

export function HistoryPage() {
  const navigate = useNavigate()
  const setCurrentDate = useLogStore((s) => s.setCurrentDate)
  const [rows, setRows] = useState<LogRecord[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const list = await loadMergedHistory()
      setRows(list)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const openDay = (date: string) => {
    setCurrentDate(date)
    navigate('/')
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-slate-500">
        Loading…
      </div>
    )
  }

  return (
    <div className="space-y-3 pb-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-white">History</h1>
        <button
          type="button"
          onClick={() => void refresh()}
          className="text-sm font-medium text-sky-400"
        >
          Refresh
        </button>
      </div>
      <p className="text-xs text-slate-500">
        Past days: from Google Sheet when online. Today: sheet rows plus any
        unsynced copy on this device. Server returns last ~14 days.
      </p>
      <ul className="space-y-2">
        {rows.length === 0 ? (
          <li className="rounded-xl bg-slate-900/60 p-4 text-sm text-slate-500 ring-1 ring-slate-800">
            No logs yet. Add entries on the Log tab.
          </li>
        ) : null}
        {rows.map((r) => {
          const pct = workCompletionPercent(
            r.priority_1_status,
            r.priority_2_status,
            r.priority_3_status,
          )
          return (
            <li key={r.date}>
              <button
                type="button"
                onClick={() => openDay(r.date)}
                className="w-full rounded-2xl bg-slate-900/80 p-4 text-left ring-1 ring-slate-800 active:bg-slate-800"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-semibold text-white">
                    {formatDisplayDate(r.date)}
                  </span>
                  <span className="text-xs text-slate-500">{r.date}</span>
                </div>
                <dl className="mt-2 grid grid-cols-2 gap-x-2 gap-y-1 text-xs text-slate-400">
                  <div>
                    <dt className="text-slate-600">Morning energy</dt>
                    <dd className="text-slate-300">
                      {r.morning_energy === '' ? '—' : r.morning_energy}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-600">Workout</dt>
                    <dd className="text-slate-300">
                      {r.workout_done ? 'Yes' : 'No'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-600">Meditation</dt>
                    <dd className="text-slate-300">
                      {r.meditation_done ? 'Yes' : 'No'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-600">Work %</dt>
                    <dd className="text-slate-300">{pct}%</dd>
                  </div>
                </dl>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
