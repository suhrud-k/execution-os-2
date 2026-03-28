import { useLogStore } from '../store/useLogStore'
import { formatTimestamp } from '../lib/formatTime'
import type { ActivityLevel } from '../types/activity'

function levelStyle(level: ActivityLevel): string {
  switch (level) {
    case 'success':
      return 'text-emerald-400'
    case 'error':
      return 'text-red-400'
    default:
      return 'text-slate-400'
  }
}

type Props = {
  /** Docked above bottom nav on Log tab */
  variant?: 'inline' | 'docked'
}

export function ActivityLogPanel({ variant = 'inline' }: Props) {
  const activityLog = useLogStore((s) => s.activityLog)
  const clearActivityLog = useLogStore((s) => s.clearActivityLog)

  const docked = variant === 'docked'
  const shell = docked
    ? 'border-t border-slate-800 bg-slate-950/98 px-3 py-2 backdrop-blur'
    : 'rounded-2xl bg-slate-900/50 p-3 ring-1 ring-slate-800'

  if (activityLog.length === 0) {
    return (
      <section className={shell}>
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Activity
          </h2>
        </div>
        <p className={`text-xs text-slate-600 ${docked ? 'mt-1' : 'mt-2'}`}>
          {`Load events and sheet uploads show here. Edits stay on this device until you tap Log (bottom bar).`}
        </p>
      </section>
    )
  }

  return (
    <section className={shell}>
      <div className={`flex items-center justify-between gap-2 ${docked ? '' : 'mb-2'}`}>
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Activity
        </h2>
        <button
          type="button"
          onClick={() => clearActivityLog()}
          className="text-xs font-medium text-slate-500 underline decoration-slate-600"
        >
          Clear
        </button>
      </div>
      <ul
        className={`space-y-2 overflow-y-auto overscroll-contain text-left ${
          docked ? 'max-h-32' : 'max-h-48'
        }`}
      >
        {activityLog.map((e) => (
          <li
            key={e.id}
            className="border-b border-slate-800/80 pb-2 text-xs last:border-0 last:pb-0"
          >
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span className="shrink-0 font-mono text-[10px] text-slate-600">
                {formatTimestamp(e.time)}
              </span>
              <span
                className={`shrink-0 font-semibold uppercase tracking-wide ${levelStyle(e.level)}`}
              >
                {e.level}
              </span>
            </div>
            <p className={`mt-0.5 leading-snug ${levelStyle(e.level)}`}>{e.message}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}
