import { MEDICATION_TABLETS } from '../constants/medicationTablets'
import {
  parseMedicationTabletsJson,
  stringifyMedicationTabletsJson,
} from '../lib/medicationTabletsJson'
import type { LogRecord } from '../types/log'

type Props = {
  log: LogRecord
  onField: <K extends keyof LogRecord>(
    field: K,
    value: LogRecord[K],
  ) => void | Promise<void>
}

export function MedicationTabletsSection({ log, onField }: Props) {
  const state = parseMedicationTabletsJson(log.medication_tablets_json)

  const toggle = (id: string) => {
    const next = { ...state, [id]: !state[id] }
    void onField('medication_tablets_json', stringifyMedicationTabletsJson(next))
  }

  const takenCount = MEDICATION_TABLETS.filter((t) => state[t.id]).length

  return (
    <details className="rounded-xl bg-slate-900/40 ring-1 ring-slate-800">
      <summary className="cursor-pointer list-none px-4 py-3 [&::-webkit-details-marker]:hidden">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-slate-200">
            Tablets <span className="font-normal text-slate-500">(medication)</span>
          </span>
          <span className="text-xs text-slate-500">
            {takenCount}/{MEDICATION_TABLETS.length} · Tap to expand
          </span>
        </div>
      </summary>
      <div className="border-t border-slate-800 px-4 pb-4 pt-2">
        <fieldset>
          <legend className="sr-only">Medication tablets taken today</legend>
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {MEDICATION_TABLETS.map((t, i) => (
              <li key={t.id} className="flex items-start gap-3">
                <input
                  id={`med-tablet-${t.id}`}
                  type="checkbox"
                  checked={state[t.id]}
                  onChange={() => toggle(t.id)}
                  className="mt-1 size-4 shrink-0 rounded border-slate-600 bg-slate-950 text-violet-500 focus:ring-violet-500"
                />
                <label
                  htmlFor={`med-tablet-${t.id}`}
                  className="cursor-pointer text-sm leading-snug text-slate-200"
                >
                  <span className="text-slate-500">{i}. </span>
                  {t.label}
                </label>
              </li>
            ))}
          </ul>
        </fieldset>
      </div>
    </details>
  )
}
