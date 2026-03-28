import { SectionCard } from './ui/SectionCard'
import { ChipRow } from './ui/ChipRow'
import { PRIORITY_STATUSES } from '../constants/reference'
import type { LogRecord, PriorityStatus } from '../types/log'

type Props = {
  log: LogRecord
  onField: <K extends keyof LogRecord>(
    field: K,
    value: LogRecord[K],
  ) => void | Promise<void>
}

const rows: { key: keyof LogRecord; label: string }[] = [
  { key: 'priority_1_status', label: 'Priority 1' },
  { key: 'priority_2_status', label: 'Priority 2' },
  { key: 'priority_3_status', label: 'Priority 3' },
]

export function WorkTrackingSection({ log, onField }: Props) {
  return (
    <SectionCard title="Work tracking">
      <div className="space-y-4">
        {rows.map(({ key, label }) => (
          <div key={key}>
            <p className="mb-2 text-xs text-slate-500">{label}</p>
            <ChipRow<PriorityStatus>
              options={[...PRIORITY_STATUSES]}
              value={log[key] as PriorityStatus}
              onChange={(v) => void onField(key, v as LogRecord[typeof key])}
            />
          </div>
        ))}
      </div>
    </SectionCard>
  )
}
