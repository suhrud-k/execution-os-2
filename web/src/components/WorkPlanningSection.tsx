import { SectionCard } from './ui/SectionCard'
import type { LogRecord } from '../types/log'

type Props = {
  log: LogRecord
  onField: <K extends keyof LogRecord>(
    field: K,
    value: LogRecord[K],
  ) => void | Promise<void>
}

const fields: { key: keyof LogRecord; label: string; placeholder: string }[] =
  [
    { key: 'priority_1', label: 'Priority 1', placeholder: 'Top priority today' },
    { key: 'priority_2', label: 'Priority 2', placeholder: 'Second focus' },
    { key: 'priority_3', label: 'Priority 3', placeholder: 'Third focus' },
  ]

export function WorkPlanningSection({ log, onField }: Props) {
  return (
    <SectionCard title="Work plan">
      <div className="space-y-3">
        {fields.map(({ key, label, placeholder }) => (
          <label key={key} className="block">
            <span className="mb-1 block text-xs text-slate-500">{label}</span>
            <input
              type="text"
              value={String(log[key] ?? '')}
              onChange={(e) =>
                void onField(key, e.target.value as LogRecord[typeof key])
              }
              placeholder={placeholder}
              className="w-full rounded-xl bg-slate-950 px-3 py-3 text-sm text-white ring-1 ring-slate-700 placeholder:text-slate-600"
            />
          </label>
        ))}
      </div>
    </SectionCard>
  )
}
