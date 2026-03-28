import type { ReactNode } from 'react'

export function SectionCard({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <section className="rounded-2xl bg-slate-900/60 p-4 ring-1 ring-slate-800">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </h2>
      {children}
    </section>
  )
}
