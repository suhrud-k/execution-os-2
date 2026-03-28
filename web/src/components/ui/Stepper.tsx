type StepperProps = {
  label: string
  value: number
  min?: number
  max?: number
  step?: number
  onChange: (n: number) => void
  disabled?: boolean
}

export function Stepper({
  label,
  value,
  min = 0,
  max = 999,
  step = 1,
  onChange,
  disabled,
}: StepperProps) {
  const snap = (n: number) => {
    if (step >= 1) return Math.round(n)
    const f = Math.round(1 / step)
    return Math.round(n * f) / f
  }
  const dec = () => onChange(snap(Math.max(min, value - step)))
  const inc = () => onChange(snap(Math.min(max, value + step)))
  const display =
    step % 1 !== 0 ? snap(value).toFixed(String(step).split('.')[1]?.length ?? 1) : String(value)
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-900/80 px-3 py-2 ring-1 ring-slate-800">
      <span className="text-sm text-slate-300">{label}</span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={disabled || snap(value) <= min}
          onClick={dec}
          className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-800 text-lg font-semibold text-white disabled:opacity-30"
          aria-label={`Decrease ${label}`}
        >
          −
        </button>
        <span className="min-w-10 text-center text-base font-semibold tabular-nums">
          {display}
        </span>
        <button
          type="button"
          disabled={disabled || snap(value) >= max}
          onClick={inc}
          className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-800 text-lg font-semibold text-white disabled:opacity-30"
          aria-label={`Increase ${label}`}
        >
          +
        </button>
      </div>
    </div>
  )
}
