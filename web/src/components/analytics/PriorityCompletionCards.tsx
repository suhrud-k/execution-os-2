import { MetricCard } from './MetricCard'

type Props = {
  p1: number | null
  p2: number | null
  p3: number | null
}

function fmt(p: number | null): string {
  if (p === null) return '—'
  return `${p}%`
}

export function PriorityCompletionCards({ p1, p2, p3 }: Props) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
      <MetricCard label="Priority 1" value={fmt(p1)} />
      <MetricCard label="Priority 2" value={fmt(p2)} />
      <MetricCard label="Priority 3" value={fmt(p3)} />
    </div>
  )
}
