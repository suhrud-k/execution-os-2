type FiveScaleProps = {
  value: number | ''
  onChange: (v: number | '') => void
  labels?: string
}

export function FiveScale({ value, onChange, labels }: FiveScaleProps) {
  return (
    <div>
      {labels ? (
        <p className="mb-2 text-xs text-slate-500">{labels}</p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {([1, 2, 3, 4, 5] as const).map((n) => {
          const active = value === n
          return (
            <button
              key={n}
              type="button"
              onClick={() => onChange(active ? '' : n)}
              className={`h-12 min-w-12 rounded-xl text-base font-semibold tabular-nums ${
                active
                  ? 'bg-sky-500 text-slate-950'
                  : 'bg-slate-800 text-slate-200 ring-1 ring-slate-700'
              }`}
            >
              {n}
            </button>
          )
        })}
      </div>
    </div>
  )
}
