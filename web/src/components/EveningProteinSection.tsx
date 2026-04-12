import { SectionCard } from './ui/SectionCard'
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

export function EveningProteinSection({ log, onField }: Props) {
  const bt = log.evening_meal_type

  const selectMeal = async (value: BreakfastType, active: boolean) => {
    if (active) {
      await onField('evening_meal_type', '' as BreakfastType)
      return
    }
    await onField('evening_meal_type', value)
    if (value === 'eggs' && log.evening_egg_count === '') {
      await onField('evening_egg_count', 4)
    }
    if (value === 'protein_shake' && log.evening_protein_scoops === '') {
      await onField('evening_protein_scoops', 3)
    }
  }

  return (
    <SectionCard title="Evening protein">
      <div className="space-y-4">
        <div>
          <p className="mb-2 text-xs text-slate-500">Meal</p>
          <div className="flex flex-wrap gap-2">
            {BREAKFAST_TYPES.map(({ value, label }) => {
              const active = bt === value
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => void selectMeal(value, active)}
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
            value={log.evening_egg_count}
            max={24}
            onChange={(n) => void onField('evening_egg_count', n)}
          />
        ) : null}
        {bt === 'protein_shake' ? (
          <Stepper
            label="Scoops (shake)"
            value={log.evening_protein_scoops}
            max={10}
            onChange={(n) => void onField('evening_protein_scoops', n)}
          />
        ) : null}
        {bt === 'other' ? (
          <label className="block">
            <span className="mb-1 block text-xs text-slate-500">Notes</span>
            <textarea
              value={log.evening_meal_notes}
              onChange={(e) => void onField('evening_meal_notes', e.target.value)}
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
