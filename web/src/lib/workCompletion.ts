import type { PriorityStatus } from '../types/log'

function weight(s: PriorityStatus): number {
  if (s === 'Done') return 1
  if (s === 'Partial') return 0.5
  if (s === 'Not Done') return 0
  return 0
}

/** Average of three priorities × 100. Empty statuses count as 0. */
export function workCompletionPercent(
  a: PriorityStatus,
  b: PriorityStatus,
  c: PriorityStatus,
): number {
  const sum = weight(a) + weight(b) + weight(c)
  return Math.round((sum / 3) * 100)
}
