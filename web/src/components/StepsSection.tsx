import { SectionCard } from './ui/SectionCard'
import type { LogRecord } from '../types/log'

type Props = {
  log: LogRecord
  onField: <K extends keyof LogRecord>(
    field: K,
    value: LogRecord[K],
  ) => void | Promise<void>
}

export function StepsSection({ log, onField }: Props) {
  return (
    <SectionCard title="Steps">
      <p className="mb-3 text-xs text-slate-500">
        Enter your step count for the day (e.g. before bed).
      </p>
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-slate-500">
          Step count
        </span>
        <input
          type="number"
          inputMode="numeric"
          min={0}
          max={200000}
          value={log.daily_steps === '' ? '' : String(log.daily_steps)}
          onChange={(e) => {
            const raw = e.target.value
            if (raw === '') {
              void onField('daily_steps', '')
              return
            }
            const v = Number(raw)
            if (!Number.isFinite(v) || v < 0) return
            void onField('daily_steps', Math.min(200000, Math.floor(v)))
          }}
          placeholder=""
          className="w-full rounded-xl bg-slate-950 px-3 py-3 text-lg font-semibold tabular-nums text-white ring-1 ring-slate-700 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
      </label>
    </SectionCard>
  )
}
