import { SectionCard } from './ui/SectionCard'
import type { LogRecord } from '../types/log'

type Props = {
  log: LogRecord
  onField: <K extends keyof LogRecord>(
    field: K,
    value: LogRecord[K],
  ) => void | Promise<void>
}

export function WorkReflectionSection({ log, onField }: Props) {
  return (
    <SectionCard title="Work reflection">
      <div className="space-y-3">
        <label className="block">
          <span className="mb-1 block text-xs text-slate-500">
            What I completed
          </span>
          <textarea
            value={log.work_completed_notes}
            onChange={(e) =>
              void onField('work_completed_notes', e.target.value)
            }
            rows={3}
            className="w-full rounded-xl bg-slate-950 px-3 py-2 text-sm text-white ring-1 ring-slate-700 placeholder:text-slate-600"
            placeholder="Shipped, progress, wins…"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-slate-500">Blockers</span>
          <textarea
            value={log.work_blockers}
            onChange={(e) => void onField('work_blockers', e.target.value)}
            rows={2}
            className="w-full rounded-xl bg-slate-950 px-3 py-2 text-sm text-white ring-1 ring-slate-700 placeholder:text-slate-600"
            placeholder="What got in the way?"
          />
        </label>
      </div>
    </SectionCard>
  )
}
