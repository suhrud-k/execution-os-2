/** Ordered list of medication tablets. Add entries here to extend the UI + stored JSON keys. */
export const MEDICATION_TABLETS = [
  { id: 'magnesium', label: 'Magnesium' },
  { id: 'omega_3', label: 'Omega-3' },
  { id: 'b12', label: 'B12' },
  { id: 'pan_d', label: 'PAN-D' },
  { id: 'eno', label: 'ENO' },
  { id: 'gelusil', label: 'Gelusil' },
  { id: 'montair_lc', label: 'Montair LC' },
  { id: 'crocin', label: 'Crocin' },
  { id: 'wickoryl', label: 'Wickoryl' },
  { id: 'benadryl', label: 'Benadryl' },
] as const

export type MedicationTabletId = (typeof MEDICATION_TABLETS)[number]['id']
