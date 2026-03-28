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

export function MeditationSection({ log, onField }: Props) {
  return (
    <SectionCard title="Meditation">
      <div className="space-y-3">
        <button
          type="button"
          role="switch"
          aria-checked={log.meditation_done}
          onClick={() => void onField('meditation_done', !log.meditation_done)}
          className={`w-full rounded-xl px-4 py-3 text-left text-sm font-semibold ${
            log.meditation_done
              ? 'bg-violet-600 text-white'
              : 'bg-slate-800 text-slate-200 ring-1 ring-slate-700'
          }`}
        >
          Meditation done
        </button>
        <Stepper
          label="Minutes"
          value={log.meditation_minutes}
          max={180}
          onChange={(n) => void onField('meditation_minutes', n)}
        />
      </div>
    </SectionCard>
  )
}
