import type { CaseStatus, DriverOutcome, DriverStatus, VehicleSanction, VendorStatus } from '../types'
import { DRIVER_OUTCOME_LABEL, VEHICLE_SANCTION_LABEL } from '../utils/ruleEngine'

// --- Driver outcome (sanksi supir) ----------------------------------------
const OUTCOME_STYLES: Record<DriverOutcome, string> = {
  BLACKLIST: 'bg-red-100 text-red-700 ring-red-200',
  SP2: 'bg-orange-100 text-orange-700 ring-orange-200',
  SP1: 'bg-yellow-100 text-yellow-800 ring-yellow-200',
  SP_CONDITIONAL: 'bg-yellow-100 text-yellow-800 ring-yellow-200',
  NONE: 'bg-slate-100 text-slate-500 ring-slate-200',
}

export function DriverOutcomeBadge({ outcome }: { outcome: DriverOutcome }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ${OUTCOME_STYLES[outcome]}`}>
      {DRIVER_OUTCOME_LABEL[outcome]}
    </span>
  )
}

// --- Vehicle sanction (sanksi angkutan) -----------------------------------
// Financial sanctions -> blue; truck blacklist -> red.
const VEHICLE_STYLES: Record<VehicleSanction, string> = {
  BLACKLIST_TRUK: 'bg-red-100 text-red-700 ring-red-200',
  PENALTI_SUSUT: 'bg-blue-100 text-blue-700 ring-blue-200',
  DENDA_500K: 'bg-blue-100 text-blue-700 ring-blue-200',
  GANTI_RUGI: 'bg-blue-100 text-blue-700 ring-blue-200',
}

export function VehicleSanctionBadge({ sanction }: { sanction: VehicleSanction }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${VEHICLE_STYLES[sanction]}`}>
      {VEHICLE_SANCTION_LABEL[sanction]}
    </span>
  )
}

// --- Case status -----------------------------------------------------------
const STATUS_META: Record<CaseStatus, { label: string; cls: string }> = {
  open: { label: 'Open', cls: 'bg-slate-100 text-slate-600 ring-slate-200' },
  in_review: { label: 'In Review', cls: 'bg-blue-100 text-blue-700 ring-blue-200' },
  sanctioned: { label: 'Tersanksi', cls: 'bg-red-100 text-red-700 ring-red-200' },
  closed: { label: 'Closed', cls: 'bg-green-100 text-green-700 ring-green-200' },
  rejected: { label: 'Ditolak', cls: 'bg-slate-200 text-slate-700 ring-slate-300' },
}

export function StatusBadge({ status }: { status: CaseStatus }) {
  const m = STATUS_META[status]
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${m.cls}`}>
      {m.label}
    </span>
  )
}

// --- Driver standing -------------------------------------------------------
const DRIVER_META: Record<DriverStatus, { label: string; cls: string }> = {
  clear: { label: 'CLEAR', cls: 'bg-green-100 text-green-700 ring-green-200' },
  sp1: { label: 'SP-1', cls: 'bg-yellow-100 text-yellow-800 ring-yellow-200' },
  sp2: { label: 'SP-2', cls: 'bg-orange-100 text-orange-700 ring-orange-200' },
  blacklisted: { label: 'BLACKLISTED', cls: 'bg-red-100 text-red-700 ring-red-200' },
}

export function DriverStatusBadge({ status }: { status: DriverStatus }) {
  const m = DRIVER_META[status]
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ${m.cls}`}>
      {m.label}
    </span>
  )
}

// --- Vendor status ---------------------------------------------------------
const VENDOR_META: Record<VendorStatus, { label: string; cls: string }> = {
  active: { label: 'Aktif', cls: 'bg-green-100 text-green-700 ring-green-200' },
  flagged: { label: 'Flagged', cls: 'bg-orange-100 text-orange-700 ring-orange-200' },
  review: { label: 'Review Kontrak', cls: 'bg-yellow-100 text-yellow-800 ring-yellow-200' },
  terminated: { label: 'Terminasi', cls: 'bg-red-100 text-red-700 ring-red-200' },
}

export function VendorStatusBadge({ status }: { status: VendorStatus }) {
  const m = VENDOR_META[status]
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${m.cls}`}>
      {m.label}
    </span>
  )
}
