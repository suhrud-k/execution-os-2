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

export function SinsSection({ log, onField }: Props) {
  return (
    <SectionCard title="Sins">
      <div className="space-y-4">
        <Stepper
          label="Coffee (cups)"
          value={log.coffee_cups}
          max={24}
          onChange={(n) => void onField('coffee_cups', n)}
        />
        <Stepper
          label="Soft drinks (ml)"
          value={log.soft_drinks_ml}
          max={5000}
          step={50}
          onChange={(n) => void onField('soft_drinks_ml', n)}
        />
        <label className="block">
          <span className="mb-1 block text-xs text-slate-500">
            Packaged foods
          </span>
          <textarea
            value={log.packaged_foods_notes}
            onChange={(e) =>
              void onField('packaged_foods_notes', e.target.value)
            }
            rows={2}
            className="w-full rounded-xl bg-slate-950 px-3 py-2 text-sm text-white ring-1 ring-slate-700 placeholder:text-slate-600"
            placeholder="What did you have?"
          />
        </label>
      </div>
    </SectionCard>
  )
}
