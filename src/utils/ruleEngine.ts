import type {
  DriverHistoryItem,
  DriverOutcome,
  DriverTrack,
  Routing,
  VehicleSanction,
  ViolationCategory,
} from '../types'

// ---------------------------------------------------------------------------
// Sanction-matrix model. For each reported category we read the
// driver track and the vehicle sanction(s) from the matrix, then:
//   - driver sanction: resolved per category using the driver's prior history,
//     then the HEAVIEST outcome across categories is taken.
//   - vehicle sanctions: the UNION across all categories (they can stack).
//   - approval: any outcome that ends in BLACKLIST needs EHFS approval.
// Reasoning is returned as Indonesian strings so the UI can show the "why".
// ---------------------------------------------------------------------------

export const DRIVER_TRACK_LABEL: Record<DriverTrack, string> = {
  BLACKLIST_LANGSUNG: 'Blacklist langsung',
  BERTAHAP_3X: 'Bertahap (SP-1 → SP-2 → Blacklist)',
  BERTAHAP_2X: 'Bertahap (SP → Blacklist)',
  BERSYARAT: 'Bersyarat (SP, blacklist bila berulang)',
  NONE: 'Tanpa sanksi supir',
}

export const DRIVER_TRACK_SHORT: Record<DriverTrack, string> = {
  BLACKLIST_LANGSUNG: 'blacklist langsung',
  BERTAHAP_3X: 'bertahap 3×',
  BERTAHAP_2X: 'bertahap 2×',
  BERSYARAT: 'bersyarat',
  NONE: 'tanpa sanksi supir',
}

export const DRIVER_OUTCOME_LABEL: Record<DriverOutcome, string> = {
  NONE: 'Tanpa sanksi supir',
  SP1: 'SP-1',
  SP2: 'SP-2',
  SP_CONDITIONAL: 'SP-1 (bersyarat)',
  BLACKLIST: 'Blacklist permanen',
}

export const VEHICLE_SANCTION_LABEL: Record<VehicleSanction, string> = {
  BLACKLIST_TRUK: 'Blacklist truk (sampai diperbaiki)',
  PENALTI_SUSUT: 'Penalti susut ×2 (detail Franco/Loco)',
  DENDA_500K: 'Denda Rp 500.000',
  GANTI_RUGI: 'Ganti rugi / klaim asuransi',
}

const OUTCOME_RANK: Record<DriverOutcome, number> = {
  NONE: 0,
  SP_CONDITIONAL: 1,
  SP1: 2,
  SP2: 3,
  BLACKLIST: 4,
}

/** Vendor incident count at/above this is escalated to Procurement. */
export const VENDOR_FLAG_THRESHOLD = 5

/** Resolve a single category's driver outcome given prior incident count. */
export function outcomeForCategory(track: DriverTrack, priorCount: number): DriverOutcome {
  const occurrence = priorCount + 1
  switch (track) {
    case 'BLACKLIST_LANGSUNG':
      return 'BLACKLIST'
    case 'BERTAHAP_3X':
      if (occurrence >= 3) return 'BLACKLIST'
      if (occurrence === 2) return 'SP2'
      return 'SP1'
    case 'BERTAHAP_2X':
      if (occurrence >= 2) return 'BLACKLIST'
      return 'SP1'
    case 'BERSYARAT':
      return 'SP_CONDITIONAL'
    case 'NONE':
      return 'NONE'
  }
}

export interface CategoryEval {
  categoryId: string
  group: string
  name: string
  track: DriverTrack
  outcome: DriverOutcome
  occurrence: number | null
}

export interface RuleResult {
  driverOutcome: DriverOutcome
  driverLabel: string
  vehicleSanctions: VehicleSanction[]
  routing: Routing
  reasoning: string[]
  perCategory: CategoryEval[]
}

/** Count prior incidents per category id from a driver's history. */
export function priorCountsFromHistory(history: DriverHistoryItem[]): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const h of history) counts[h.categoryId] = (counts[h.categoryId] ?? 0) + 1
  return counts
}

export function evaluate(
  categories: ViolationCategory[],
  priorByCategory: Record<string, number> = {},
): RuleResult {
  if (categories.length === 0) {
    return {
      driverOutcome: 'NONE',
      driverLabel: DRIVER_OUTCOME_LABEL.NONE,
      vehicleSanctions: [],
      routing: 'PIC_DIRECT',
      reasoning: ['Belum ada kategori pelanggaran dipilih.'],
      perCategory: [],
    }
  }

  const perCategory: CategoryEval[] = categories.map((c) => {
    const prior = priorByCategory[c.id] ?? 0
    const outcome = outcomeForCategory(c.driverTrack, prior)
    return {
      categoryId: c.id,
      group: c.group,
      name: c.name,
      track: c.driverTrack,
      outcome,
      occurrence: c.driverTrack === 'NONE' ? null : prior + 1,
    }
  })

  const driverOutcome = perCategory.reduce<DriverOutcome>(
    (best, e) => (OUTCOME_RANK[e.outcome] > OUTCOME_RANK[best] ? e.outcome : best),
    'NONE',
  )

  // Union of vehicle sanctions, de-duplicated, order preserved.
  const seen = new Set<VehicleSanction>()
  const vehicleSanctions: VehicleSanction[] = []
  for (const c of categories) {
    for (const v of c.vehicleSanctions) {
      if (!seen.has(v)) {
        seen.add(v)
        vehicleSanctions.push(v)
      }
    }
  }

  const routing: Routing = driverOutcome === 'BLACKLIST' ? 'APPROVAL' : 'PIC_DIRECT'

  // ---- Reasoning ----------------------------------------------------------
  const reasoning: string[] = []
  reasoning.push(
    `Kategori dilaporkan: ${categories.map((c) => `${c.name} (${DRIVER_TRACK_SHORT[c.driverTrack]})`).join(' + ')}`,
  )

  for (const e of perCategory) {
    if (e.track === 'NONE') {
      reasoning.push(`• ${e.name}: tanpa sanksi supir (hanya sanksi angkutan).`)
    } else if (e.track === 'BLACKLIST_LANGSUNG') {
      reasoning.push(`• ${e.name}: blacklist langsung → ${DRIVER_OUTCOME_LABEL[e.outcome]}.`)
    } else if (e.track === 'BERSYARAT') {
      reasoning.push(`• ${e.name}: bersyarat → SP-1 (blacklist bila berulang).`)
    } else {
      reasoning.push(`• ${e.name}: kejadian ke-${e.occurrence} → ${DRIVER_OUTCOME_LABEL[e.outcome]}.`)
    }
  }

  if (categories.length >= 2) {
    reasoning.push(`Sanksi supir terberat di antara kategori: ${DRIVER_OUTCOME_LABEL[driverOutcome]}.`)
  } else {
    reasoning.push(`Sanksi supir: ${DRIVER_OUTCOME_LABEL[driverOutcome]}.`)
  }

  reasoning.push(
    vehicleSanctions.length
      ? `Sanksi angkutan: ${vehicleSanctions.map((v) => VEHICLE_SANCTION_LABEL[v]).join(' + ')}.`
      : 'Sanksi angkutan: tidak ada.',
  )

  if (routing === 'APPROVAL') {
    reasoning.push('Berujung blacklist → wajib persetujuan EHFS sebelum final.')
  } else if (driverOutcome === 'SP1' || driverOutcome === 'SP2' || driverOutcome === 'SP_CONDITIONAL') {
    reasoning.push('Sanksi SP → dapat dieksekusi langsung oleh PIC.')
  } else {
    reasoning.push('Tidak ada sanksi supir → hanya sanksi angkutan yang tercatat.')
  }
  if (vehicleSanctions.some((v) => v === 'DENDA_500K' || v === 'PENALTI_SUSUT' || v === 'GANTI_RUGI')) {
    reasoning.push('Sanksi finansial tercatat otomatis untuk ditagih.')
  }

  return {
    driverOutcome,
    driverLabel: DRIVER_OUTCOME_LABEL[driverOutcome],
    vehicleSanctions,
    routing,
    reasoning,
    perCategory,
  }
}

export interface VendorFlagResult {
  shouldFlag: boolean
  totalIncidents: number
  message?: string
}

/** Whether reporting against this vendor pushes it over the Procurement flag line. */
export function evaluateVendorFlag(totalIncidents: number): VendorFlagResult {
  const projected = totalIncidents + 1
  if (projected >= VENDOR_FLAG_THRESHOLD) {
    return {
      shouldFlag: true,
      totalIncidents: projected,
      message: `Vendor ini akan di-flag ke Procurement (sudah ${projected} kejadian tercatat).`,
    }
  }
  return { shouldFlag: false, totalIncidents: projected }
}
