type Props = {
  label: string
  done: number
  total: number
  /** true = done, false = not */
  flags: boolean[]
}

export function AdherenceRow({ label, done, total, flags }: Props) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-slate-300">{label}</span>
        <span className="tabular-nums text-slate-500">
          {done}/{total}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {flags.map((ok, i) => (
          <div
            key={i}
            title={ok ? 'Done' : 'Not done'}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-700 bg-slate-900/80 text-sm"
          >
            {ok ? (
              <span className="text-emerald-400" aria-hidden>
                ✓
              </span>
            ) : (
              <span className="text-slate-600" aria-hidden>
                —
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
