type StepperProps = {
  label: string
  value: number | ''
  min?: number
  max?: number
  step?: number
  /** When false, show the numeric value without snapping to step (for derived display values). */
  snapDisplay?: boolean
  onChange: (n: number | '') => void
  disabled?: boolean
}

export function Stepper({
  label,
  value,
  min = 0,
  max = 999,
  step = 1,
  snapDisplay = true,
  onChange,
  disabled,
}: StepperProps) {
  const snap = (n: number) => {
    if (step >= 1) return Math.round(n)
    const f = Math.round(1 / step)
    return Math.round(n * f) / f
  }

  const inc = () => {
    if (value === '') {
      const first = min > 0 ? min : step
      onChange(snap(Math.min(max, first)))
      return
    }
    onChange(snap(Math.min(max, value + step)))
  }

  const dec = () => {
    if (value === '') return
    const v = snap(value)
    if (v <= min) {
      onChange('')
      return
    }
    const next = snap(v - step)
    if (next < min) onChange('')
    else onChange(next)
  }

  const atMax = typeof value === 'number' && snap(value) >= max

  const formatUnsnappedDecimal = (n: number) => {
    const r = Math.round(n * 10_000) / 10_000
    if (Number.isInteger(r)) return String(r)
    return r.toFixed(4).replace(/\.?0+$/, '')
  }

  const display =
    value === ''
      ? '—'
      : !snapDisplay && step % 1 !== 0
        ? formatUnsnappedDecimal(value as number)
        : step % 1 !== 0
          ? snap(value).toFixed(String(step).split('.')[1]?.length ?? 1)
          : String(value)

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-900/80 px-3 py-2 ring-1 ring-slate-800">
      <span className="text-sm text-slate-300">{label}</span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={disabled || value === ''}
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
          disabled={disabled || atMax}
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
