// Domain types for the Belawan Security violation-reporting prototype.
// UI strings are Indonesian; identifiers stay English.
//
// Classification is sanction-based (per the official Trading/Transport/Security
// matrix): every violation carries TWO parallel sanction tracks — one for the
// DRIVER (supir) and one for the VEHICLE/VENDOR (angkutan).

export type RoleKey = 'PIC' | 'EHFS' | 'GATE' | 'PROCUREMENT' | 'MANAGEMENT'

export type DeviceMode = 'phone' | 'desktop'

export type CaseStatus =
  | 'open'
  | 'in_review'
  | 'sanctioned'
  | 'closed'
  | 'rejected'

/** Routing of the case once submitted. Blacklist outcomes need approval. */
export type Routing = 'PIC_DIRECT' | 'APPROVAL'

/** Driver sanction track defined by the matrix for a category. */
export type DriverTrack =
  | 'BLACKLIST_LANGSUNG' // one strike -> blacklist (no SP)
  | 'BERTAHAP_3X' // SP-1 -> SP-2 -> blacklist on 3rd
  | 'BERTAHAP_2X' // SP on 1st -> blacklist on 2nd
  | 'BERSYARAT' // SP; blacklist only if repeated (manual)
  | 'NONE' // no driver sanction

/** Vehicle / vendor sanctions (one or more may apply, can stack). */
export type VehicleSanction =
  | 'BLACKLIST_TRUK'
  | 'PENALTI_SUSUT'
  | 'DENDA_500K'
  | 'GANTI_RUGI'

/** Computed driver outcome for a specific case (after applying history). */
export type DriverOutcome = 'NONE' | 'SP1' | 'SP2' | 'SP_CONDITIONAL' | 'BLACKLIST'

export interface ViolationCategory {
  id: string
  group: string // e.g. "Manipulasi Muatan", "Locis", "Barang Terlarang"
  name: string // specific violation text
  driverTrack: DriverTrack
  vehicleSanctions: VehicleSanction[]
  note?: string
}

export interface Location {
  id: string
  name: string
  area: string
  hasCCTV: boolean
}

export type VendorStatus = 'active' | 'flagged' | 'review' | 'terminated'

export interface Vendor {
  id: string
  name: string
  contractNo: string
  status: VendorStatus
  /** Historical figures carried over from the old paper + Excel records. */
  historicalIncidents: number
  historicalSP: number
  historicalBlacklists: number
  note?: string
}

/** Driver current standing — worst active sanction. */
export type DriverStatus = 'clear' | 'sp1' | 'sp2' | 'blacklisted'

export interface DriverHistoryItem {
  date: string
  categoryId: string
  group: string
  description: string
  outcome: DriverOutcome
  caseId?: string
}

export interface Driver {
  id: string
  name: string
  ktp: string
  phone?: string
  vendorId: string
  plates: string[]
  status: DriverStatus
  statusReason?: string
  history: DriverHistoryItem[]
}

/** A gate event where an already-blacklisted party attempts to enter again. */
export interface GateAttempt {
  id: string
  attemptedAt: string
  reportedAt: string
  driverId: string
  vehiclePlate: string
  locationId: string
  reason: string
  description: string
  outcome: 'denied'
  reporterName: string
  reporterDept: string
  evidenceCount: number
}

export interface AuditEntry {
  at: string
  actor: string
  action: string
}

export interface CaseApproval {
  decision: 'approved' | 'rejected'
  decidedBy: string
  decidedAt: string
  comment?: string
  /** EHFS may adjust the categories before approving. */
  adjustedCategoryIds?: string[]
}

export interface Sanction {
  driverOutcome: DriverOutcome
  driverLabel: string
  vehicleSanctions: VehicleSanction[]
  issuedAt: string
  issuedBy: string
}

export interface ViolationCase {
  id: string
  reportedAt: string
  reporterName: string
  reporterDept: string
  locationId: string
  description: string
  driverId: string
  vehiclePlate: string
  categoryIds: string[]
  evidenceCount: number
  witnesses: string
  // Hasil perhitungan sanksi yang disimpan saat laporan dibuat
  driverOutcome: DriverOutcome
  driverOutcomeLabel: string
  vehicleSanctions: VehicleSanction[]
  reasoning: string[]
  routing: Routing
  status: CaseStatus
  slaDueAt?: string
  vendorFlagged: boolean
  approval?: CaseApproval
  sanction?: Sanction
  audit: AuditEntry[]
}

export interface RoleDef {
  key: RoleKey
  title: string
  person: string
  dept: string
  blurb: string
  defaultMode: DeviceMode
  home: string
}
