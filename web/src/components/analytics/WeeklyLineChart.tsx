import { formatDisplayDate } from '../../lib/dates'

export type LinePoint = { date: string; value: number | null }

type Props = {
  title: string
  /** Short line under the title (e.g. what the Y-axis measures). */
  subtitle?: string
  points: LinePoint[]
  formatY: (v: number) => string
  /** Left-side Y-axis unit label (e.g. "Time (IST)", "Hours", "Steps"). */
  yAxisLabel: string
  /** Label under the X-axis (e.g. "Day of week"). */
  xAxisLabel: string
  /** When true, show formatted value above each point (extra top padding avoids clipping). */
  showValueAbovePoints?: boolean
}

const W = 320
const H = 132
const H_WITH_POINT_LABELS = 146
const PAD_L = 34
const PAD_R = 8
const PAD_T = 10
const PAD_T_WITH_POINT_LABELS = 24
const PAD_B = 28

export function WeeklyLineChart({
  title,
  subtitle,
  points,
  formatY,
  yAxisLabel,
  xAxisLabel,
  showValueAbovePoints = false,
}: Props) {
  const padTop = showValueAbovePoints ? PAD_T_WITH_POINT_LABELS : PAD_T
  const svgH = showValueAbovePoints ? H_WITH_POINT_LABELS : H
  const innerW = W - PAD_L - PAD_R
  const innerH = svgH - padTop - PAD_B
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
    padTop + ((maxV - v) / span) * innerH

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
      <div>
        <p className="text-xs font-medium text-slate-400">{title}</p>
        {subtitle ? (
          <p className="text-[11px] text-slate-500">{subtitle}</p>
        ) : null}
      </div>
      {!hasData ? (
        <div className="rounded-xl bg-slate-900/50 py-8 text-center text-xs text-slate-500 ring-1 ring-slate-800">
          No data
        </div>
      ) : (
        <div className="relative">
          <svg
            viewBox={`0 0 ${W} ${svgH}`}
            className="h-auto w-full max-w-full text-emerald-400"
            aria-label={`${title}: ${subtitle ?? ''}`}
          >
            <text
              x={12}
              y={padTop + innerH / 2}
              textAnchor="middle"
              className="fill-slate-500 text-[5px]"
              transform={`rotate(-90 12 ${padTop + innerH / 2})`}
            >
              {yAxisLabel}
            </text>
            <rect
              x={PAD_L}
              y={padTop}
              width={innerW}
              height={innerH}
              fill="none"
              className="stroke-slate-800"
              strokeWidth={1}
              rx={4}
            />
            <text
              x={PAD_L}
              y={padTop - 1}
              className="fill-slate-500 text-[5px]"
            >
              {formatY(maxV)}
            </text>
            <text
              x={PAD_L}
              y={padTop + innerH + 2}
              className="fill-slate-500 text-[5px]"
            >
              {formatY(minV)}
            </text>
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
            {showValueAbovePoints
              ? points.map((p, i) => {
                  if (p.value === null) return null
                  const cy = yAt(p.value)
                  const labelY = Math.max(8, cy - 5)
                  return (
                    <text
                      key={`ptval-${p.date}`}
                      x={xAt(i)}
                      y={labelY}
                      textAnchor="middle"
                      className="fill-emerald-200 text-[6px] font-medium"
                    >
                      {formatY(p.value)}
                    </text>
                  )
                })
              : null}
            {points.map((p, i) => (
              <text
                key={`lbl-${p.date}`}
                x={xAt(i)}
                y={svgH - 14}
                textAnchor="middle"
                className="fill-slate-500 text-[5px]"
              >
                {formatDisplayDate(p.date).split(',')[0]?.slice(0, 3) ?? ''}
              </text>
            ))}
            <text
              x={PAD_L + innerW / 2}
              y={svgH - 2}
              textAnchor="middle"
              className="fill-slate-500 text-[5px]"
            >
              {xAxisLabel}
            </text>
          </svg>
        </div>
      )}
    </div>
  )
}
