import type { Driver, Vendor, ViolationCase } from '../types'

export interface VendorMetrics {
  cases: ViolationCase[]
  liveCount: number
  totalIncidents: number
  totalSP: number
  totalBlacklists: number
  blacklistedDrivers: Driver[]
  drivers: Driver[]
}

/** Combine historical (paper/Excel) figures with live cases for a vendor. */
export function vendorMetrics(
  vendor: Vendor,
  cases: ViolationCase[],
  drivers: Driver[],
): VendorMetrics {
  const vendorDrivers = drivers.filter((d) => d.vendorId === vendor.id)
  const driverIds = new Set(vendorDrivers.map((d) => d.id))
  const vCases = cases.filter((c) => driverIds.has(c.driverId))
  const isSP = (o?: string) => o === 'SP1' || o === 'SP2' || o === 'SP_CONDITIONAL'
  const liveSP = vCases.filter((c) => isSP(c.sanction?.driverOutcome)).length
  const liveBlacklist = vCases.filter((c) => c.sanction?.driverOutcome === 'BLACKLIST').length
  return {
    cases: vCases,
    liveCount: vCases.length,
    totalIncidents: vendor.historicalIncidents + vCases.length,
    totalSP: vendor.historicalSP + liveSP,
    totalBlacklists: vendor.historicalBlacklists + liveBlacklist,
    blacklistedDrivers: vendorDrivers.filter((d) => d.status === 'blacklisted'),
    drivers: vendorDrivers,
  }
}

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

/** Cases grouped by month label for the last `n` months ending at `now`. */
export function casesPerMonth(cases: ViolationCase[], now: Date, n = 6): { month: string; jumlah: number }[] {
  const buckets: { key: string; month: string; jumlah: number }[] = []
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    buckets.push({ key: `${d.getFullYear()}-${d.getMonth()}`, month: MONTHS_SHORT[d.getMonth()], jumlah: 0 })
  }
  const index = new Map(buckets.map((b) => [b.key, b]))
  for (const c of cases) {
    const d = new Date(c.reportedAt)
    const b = index.get(`${d.getFullYear()}-${d.getMonth()}`)
    if (b) b.jumlah += 1
  }
  return buckets.map(({ month, jumlah }) => ({ month, jumlah }))
}
