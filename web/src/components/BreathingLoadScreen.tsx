import { useEffect, useState } from 'react'

const PHASE_MS = 4000

type Phase = 'in' | 'out'

type Props = {
  /** e.g. formatted date line under the cue */
  detail: string
}

export function BreathingLoadScreen({ detail }: Props) {
  const [phase, setPhase] = useState<Phase>('in')
  /** First paint at scale-95 so the initial inhale can transition to scale-110. */
  const [scalePrimed, setScalePrimed] = useState(false)

  useEffect(() => {
    let cancelled = false
    const id1 = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!cancelled) setScalePrimed(true)
      })
    })
    return () => {
      cancelled = true
      cancelAnimationFrame(id1)
    }
  }, [])

  useEffect(() => {
    const id = window.setInterval(() => {
      setPhase((p) => (p === 'in' ? 'out' : 'in'))
    }, PHASE_MS)
    return () => window.clearInterval(id)
  }, [])

  const label = phase === 'in' ? 'Breathe In' : 'Breathe Out'
  const scaleClass =
    !scalePrimed || phase === 'out' ? 'scale-95' : 'scale-110'

  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-6 text-slate-400">
      <div
        className={`flex flex-col items-center gap-3 transition-transform duration-[4000ms] ease-in-out will-change-transform ${scaleClass}`}
        aria-live="polite"
        aria-atomic="true"
      >
        <p className="text-xl font-medium tracking-wide text-slate-200">{label}</p>
        <p className="font-mono text-sm text-slate-500">·······</p>
      </div>
      <p className="text-xs text-slate-600">{detail}</p>
    </div>
  )
}
