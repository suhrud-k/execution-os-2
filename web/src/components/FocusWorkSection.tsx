import { SectionCard } from './ui/SectionCard'
import { Stepper } from './ui/Stepper'
import type { LogRecord } from '../types/log'

type Props = {
  log: LogRecord
  onField: <K extends keyof LogRecord>(
    field: K,
    value: LogRecord[K],
  ) => void | Promise<void>
}

export function FocusWorkSection({ log, onField }: Props) {
  return (
    <SectionCard title="Focus work">
      <div className="space-y-4">
        <Stepper
          label="Time (hours)"
          value={
            log.focus_work_minutes === ''
              ? ''
              : log.focus_work_minutes / 60
          }
          min={0}
          max={10}
          step={0.5}
          snapDisplay={false}
          onChange={(h) =>
            void onField(
              'focus_work_minutes',
              h === '' ? '' : Math.round(h * 2) * 30,
            )
          }
        />
        <label className="block">
          <span className="mb-1 block text-xs text-slate-500">Description</span>
          <textarea
            value={log.focus_work_description}
            onChange={(e) =>
              void onField('focus_work_description', e.target.value)
            }
            rows={3}
            className="w-full rounded-xl bg-slate-950 px-3 py-2 text-sm text-white ring-1 ring-slate-700 placeholder:text-slate-600"
            placeholder="What did you focus on?"
          />
        </label>
      </div>
    </SectionCard>
  )
}
