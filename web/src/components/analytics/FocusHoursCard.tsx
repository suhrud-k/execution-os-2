import { formatHoursNatural } from '../../lib/analytics'

type Props = {
  completedHours: number
  targetHours?: number
}

export function FocusHoursCard({
  completedHours,
  targetHours = 21,
}: Props) {
  const pct = Math.min(100, (completedHours / targetHours) * 100)
  const label = `${formatHoursNatural(completedHours)}/${targetHours}`

  return (
    <div className="rounded-xl bg-slate-900/70 px-3 py-3 ring-1 ring-slate-800">
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
        Focus hours (weekly target)
      </p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-white">{label}</p>
      <p className="mt-0.5 text-xs text-slate-500">Hours logged this week vs {targetHours} h goal</p>
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-800">
        <div
          className="h-full rounded-full bg-emerald-500/90 transition-[width]"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
