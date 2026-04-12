import { useEffect, useState } from 'react'

const PHASE_MS = 4000

type Phase = 'in' | 'out'

type Props = {
  /** e.g. formatted date line under the cue */
  detail: string
}

export function BreathingLoadScreen({ detail }: Props) {
  const [phase, setPhase] = useState<Phase>('in')

  useEffect(() => {
    const id = window.setInterval(() => {
      setPhase((p) => (p === 'in' ? 'out' : 'in'))
    }, PHASE_MS)
    return () => window.clearInterval(id)
  }, [])

  const label = phase === 'in' ? 'Breathe In' : 'Breathe Out'

  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-6 text-slate-400">
      <div
        className={`flex flex-col items-center gap-3 transition-transform duration-[4000ms] ease-in-out will-change-transform ${
          phase === 'in' ? 'scale-110' : 'scale-95'
        }`}
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
