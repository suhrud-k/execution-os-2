import { SectionCard } from './ui/SectionCard'
import { FiveScale } from './ui/FiveScale'
import { Stepper } from './ui/Stepper'
import { BREAKFAST_TYPES } from '../constants/reference'
import type { BreakfastType, LogRecord } from '../types/log'

type Props = {
  log: LogRecord
  onField: <K extends keyof LogRecord>(
    field: K,
    value: LogRecord[K],
  ) => void | Promise<void>
}

export function MorningSection({ log, onField }: Props) {
  const bt = log.breakfast_type

  return (
    <SectionCard title="Morning">
      <div className="space-y-4">
        <FiveScale
          value={log.morning_energy}
          onChange={(v) => void onField('morning_energy', v)}
          labels="Energy (1–5)"
        />
        <div>
          <p className="mb-2 text-xs text-slate-500">Breakfast</p>
          <div className="flex flex-wrap gap-2">
            {BREAKFAST_TYPES.map(({ value, label }) => {
              const active = bt === value
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() =>
                    void onField(
                      'breakfast_type',
                      active ? ('' as BreakfastType) : value,
                    )
                  }
                  className={`rounded-full px-3 py-2 text-sm font-medium ${
                    active
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-slate-800 text-slate-200 ring-1 ring-slate-700'
                  }`}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>
        {bt === 'eggs' ? (
          <Stepper
            label="Eggs"
            value={log.egg_count}
            max={24}
            onChange={(n) => void onField('egg_count', n)}
          />
        ) : null}
        {bt === 'protein' ? (
          <Stepper
            label="Scoops (shake)"
            value={log.protein_scoops}
            max={10}
            onChange={(n) => void onField('protein_scoops', n)}
          />
        ) : null}
        {bt === 'other' ? (
          <label className="block">
            <span className="mb-1 block text-xs text-slate-500">Notes</span>
            <textarea
              value={log.breakfast_notes}
              onChange={(e) => void onField('breakfast_notes', e.target.value)}
              rows={2}
              className="w-full rounded-xl bg-slate-950 px-3 py-2 text-sm text-white ring-1 ring-slate-700 placeholder:text-slate-600"
              placeholder="What did you eat?"
            />
          </label>
        ) : null}
      </div>
    </SectionCard>
  )
}
