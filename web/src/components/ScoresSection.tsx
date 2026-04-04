import { SectionCard } from './ui/SectionCard'
import { FiveScale } from './ui/FiveScale'
import type { LogRecord } from '../types/log'

type Props = {
  log: LogRecord
  onField: <K extends keyof LogRecord>(
    field: K,
    value: LogRecord[K],
  ) => void | Promise<void>
}

export function ScoresSection({ log, onField }: Props) {
  return (
    <SectionCard title="Scores">
      <div className="space-y-4">
        <FiveScale
          value={log.evening_energy}
          onChange={(v) => void onField('evening_energy', v)}
          labels="Evening energy"
        />
      </div>
    </SectionCard>
  )
}
