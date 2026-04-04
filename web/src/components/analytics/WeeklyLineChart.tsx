import { formatDisplayDate } from '../../lib/dates'

export type LinePoint = { date: string; value: number | null }

type Props = {
  title: string
  points: LinePoint[]
  formatY: (v: number) => string
  yAxisHint?: string
}

const W = 320
const H = 120
const PAD_L = 8
const PAD_R = 8
const PAD_T = 8
const PAD_B = 22

export function WeeklyLineChart({ title, points, formatY, yAxisHint }: Props) {
  const innerW = W - PAD_L - PAD_R
  const innerH = H - PAD_T - PAD_B
  const vals = points.map((p) => p.value).filter((v): v is number => v !== null)
  const hasData = vals.length > 0

  let minV = vals.length ? Math.min(...vals) : 0
  let maxV = vals.length ? Math.max(...vals) : 1
  if (minV === maxV) {
    minV -= 1
    maxV += 1
  }
  const span = maxV - minV || 1

  const n = points.length
  const xAt = (i: number) =>
    n <= 1 ? PAD_L + innerW / 2 : PAD_L + (i / (n - 1)) * innerW
  const yAt = (v: number) =>
    PAD_T + ((maxV - v) / span) * innerH

  const pathParts: string[] = []
  let needMove = true
  for (let i = 0; i < n; i++) {
    const v = points[i].value
    if (v === null) {
      needMove = true
      continue
    }
    const x = xAt(i)
    const y = yAt(v)
    if (needMove) {
      pathParts.push(`M ${x} ${y}`)
      needMove = false
    } else {
      pathParts.push(`L ${x} ${y}`)
    }
  }

  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-slate-400">{title}</p>
      {!hasData ? (
        <div className="rounded-xl bg-slate-900/50 py-8 text-center text-xs text-slate-500 ring-1 ring-slate-800">
          No data
        </div>
      ) : (
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-auto w-full max-w-full text-emerald-400"
          aria-label={title}
        >
          <rect
            x={PAD_L}
            y={PAD_T}
            width={innerW}
            height={innerH}
            fill="none"
            className="stroke-slate-800"
            strokeWidth={1}
            rx={4}
          />
          <text
            x={PAD_L}
            y={PAD_T - 1}
            className="fill-[9px] text-[9px] text-slate-500"
          >
            {formatY(maxV)}
          </text>
          <text
            x={PAD_L}
            y={PAD_T + innerH + 2}
            className="fill-[9px] text-[9px] text-slate-500"
          >
            {formatY(minV)}
          </text>
          {yAxisHint ? (
            <text
              x={2}
              y={PAD_T + 10}
              className="fill-[8px] text-[8px] text-slate-600"
            >
              {yAxisHint}
            </text>
          ) : null}
          {pathParts.length > 0 ? (
            <path
              d={pathParts.join(' ')}
              fill="none"
              className="stroke-emerald-400"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : null}
          {points.map((p, i) => {
            if (p.value === null) return null
            return (
              <circle
                key={p.date}
                cx={xAt(i)}
                cy={yAt(p.value)}
                r={3}
                className="fill-emerald-400"
              />
            )
          })}
          {points.map((p, i) => (
            <text
              key={`lbl-${p.date}`}
              x={xAt(i)}
              y={H - 4}
              textAnchor="middle"
              className="fill-[9px] text-[8px] text-slate-500"
            >
              {formatDisplayDate(p.date).split(',')[0]?.slice(0, 3) ?? ''}
            </text>
          ))}
        </svg>
      )}
    </div>
  )
}
