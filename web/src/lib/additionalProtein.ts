import type { LogRecord } from '../types/log'

/** Grams of protein per egg (breakfast + evening). */
export const PROTEIN_G_PER_EGG = 6

/** Grams of protein per scoop (breakfast + evening). */
export const PROTEIN_G_PER_SCOOP = 8

/** 6× total eggs + 8× total scoops (morning + evening fields). */
export function computeAdditionalProteinG(
  log: Pick<
    LogRecord,
    'egg_count' | 'protein_scoops' | 'evening_egg_count' | 'evening_protein_scoops'
  >,
): number {
  const egg =
    (typeof log.egg_count === 'number' && Number.isFinite(log.egg_count)
      ? log.egg_count
      : 0) +
    (typeof log.evening_egg_count === 'number' && Number.isFinite(log.evening_egg_count)
      ? log.evening_egg_count
      : 0)
  const scoop =
    (typeof log.protein_scoops === 'number' && Number.isFinite(log.protein_scoops)
      ? log.protein_scoops
      : 0) +
    (typeof log.evening_protein_scoops === 'number' &&
    Number.isFinite(log.evening_protein_scoops)
      ? log.evening_protein_scoops
      : 0)
  return PROTEIN_G_PER_EGG * egg + PROTEIN_G_PER_SCOOP * scoop
}
