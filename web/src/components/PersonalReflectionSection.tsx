import { SectionCard } from './ui/SectionCard'
import type { LogRecord } from '../types/log'

type Props = {
  log: LogRecord
  onField: <K extends keyof LogRecord>(
    field: K,
    value: LogRecord[K],
  ) => void | Promise<void>
}

export function PersonalReflectionSection({ log, onField }: Props) {
  return (
    <SectionCard title="Personal reflection">
      <div className="space-y-3">
        <label className="block">
          <span className="mb-1 block text-xs text-slate-500">Key insight</span>
          <textarea
            value={log.key_insight}
            onChange={(e) => void onField('key_insight', e.target.value)}
            rows={2}
            className="w-full rounded-xl bg-slate-950 px-3 py-2 text-sm text-white ring-1 ring-slate-700 placeholder:text-slate-600"
            placeholder="One thing that stood out"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-slate-500">
            What to improve | Plan for tomorrow
          </span>
          <textarea
            value={log.improvement_note}
            onChange={(e) => void onField('improvement_note', e.target.value)}
            rows={2}
            className="w-full rounded-xl bg-slate-950 px-3 py-2 text-sm text-white ring-1 ring-slate-700 placeholder:text-slate-600"
            placeholder="Tomorrow’s tweak"
          />
        </label>
      </div>
    </SectionCard>
  )
}
