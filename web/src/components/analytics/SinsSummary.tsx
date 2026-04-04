import type { SinsSummary as SinsData } from '../../lib/analytics'

type Props = {
  summary: SinsData
}

export function SinsSummary({ summary }: Props) {
  const items: { label: string; value: string }[] = [
    {
      label: 'Coffee',
      value:
        summary.coffeeCups === 0
          ? '—'
          : `${summary.coffeeCups} cup${summary.coffeeCups === 1 ? '' : 's'}`,
    },
    {
      label: 'Soft drinks',
      value:
        summary.softDrinksMl === 0
          ? '—'
          : `${summary.softDrinksMl} ml`,
    },
    {
      label: 'Packaged & outside food',
      value:
        summary.packagedOutsideFoodDays === 0
          ? '—'
          : `${summary.packagedOutsideFoodDays} day${summary.packagedOutsideFoodDays === 1 ? '' : 's'}`,
    },
  ]

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-slate-400">Sins (week total)</p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {items.map((it) => (
          <div
            key={it.label}
            className="rounded-xl bg-slate-900/70 px-3 py-2 ring-1 ring-slate-800"
          >
            <p className="text-[11px] text-slate-500">{it.label}</p>
            <p className="mt-0.5 text-sm font-semibold text-slate-200">{it.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
