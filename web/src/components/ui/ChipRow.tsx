type ChipRowProps<T extends string> = {
  options: readonly T[] | T[]
  value: T | ''
  onChange: (v: T | '') => void
  className?: string
}

export function ChipRow<T extends string>({
  options,
  value,
  onChange,
  className = '',
}: ChipRowProps<T>) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {options.map((opt) => {
        const active = value === opt
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(active ? ('' as T | '') : opt)}
            className={`min-h-11 min-w-11 rounded-full px-3 py-2 text-sm font-medium transition active:scale-[0.98] ${
              active
                ? 'bg-sky-500 text-slate-950'
                : 'bg-slate-800 text-slate-200 ring-1 ring-slate-700'
            }`}
          >
            {opt}
          </button>
        )
      })}
    </div>
  )
}
