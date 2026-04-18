import { SectionCard } from './ui/SectionCard'
import { DAY_TYPE_SEGMENTS } from '../constants/dayType'
import type { LogRecord } from '../types/log'

type Props = {
  log: LogRecord
  onField: <K extends keyof LogRecord>(
    field: K,
    value: LogRecord[K],
  ) => void | Promise<void>
}

export function DayTypeSection({ log, onField }: Props) {
  const dt = log.day_type

  return (
    <SectionCard title="Day type">
      <p className="mb-3 text-xs text-slate-500">
        How you framed this day. Office times apply only when{' '}
        <span className="text-slate-400">Office</span> is selected.
      </p>
      <div
        className="flex flex-wrap gap-2"
        role="group"
        aria-label="Day type"
      >
        {DAY_TYPE_SEGMENTS.map(({ value, label }) => {
          const active = dt === value
          return (
            <button
              key={value}
              type="button"
              onClick={() => void onField('day_type', value)}
              className={`rounded-full px-3 py-2 text-left text-sm font-medium leading-snug ${
                active
                  ? 'bg-sky-600 text-white'
                  : 'bg-slate-800 text-slate-200 ring-1 ring-slate-700'
              }`}
            >
              {label}
            </button>
          )
        })}
      </div>
      {dt !== 'office' ? (
        <p className="mt-3 text-xs text-amber-200/90">
          Reach and leave times were cleared for this day type. If you switch back to
          Office, enter those times again.
        </p>
      ) : null}
    </SectionCard>
  )
}
