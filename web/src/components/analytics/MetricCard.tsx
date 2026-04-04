type Props = {
  label: string
  value: string
  sub?: string
}

export function MetricCard({ label, value, sub }: Props) {
  return (
    <div className="rounded-xl bg-slate-900/70 px-3 py-3 ring-1 ring-slate-800">
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-xl font-semibold tabular-nums text-white">{value}</p>
      {sub ? <p className="mt-0.5 text-xs text-slate-500">{sub}</p> : null}
    </div>
  )
}
