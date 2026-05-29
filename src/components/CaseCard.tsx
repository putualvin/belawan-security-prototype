import { Link } from 'react-router-dom'
import { ChevronRight, MapPin, Tag, Truck } from 'lucide-react'
import type { ViolationCase } from '../types'
import { driverById, locationById, vendorById } from '../data/mockData'
import { formatDate } from '../utils/format'
import { DriverOutcomeBadge, StatusBadge, VehicleSanctionBadge } from './Badges'

export function CaseCard({ c }: { c: ViolationCase }) {
  const driver = driverById(c.driverId)
  const vendor = vendorById(driver.vendorId)
  const loc = locationById(c.locationId)

  return (
    <Link
      to={`/case/${c.id}`}
      className="block rounded-2xl border border-slate-200 bg-white p-3.5 shadow-card transition hover:border-brand-300 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-slate-400">{c.id} · {formatDate(c.reportedAt)}</p>
          <p className="truncate font-bold text-slate-800">{driver.name}</p>
          <p className="truncate text-xs text-slate-500">{c.vehiclePlate} · {vendor.name}</p>
        </div>
        <ChevronRight size={18} className="mt-1 shrink-0 text-slate-300" />
      </div>

      <p className="mt-2 line-clamp-2 text-sm text-slate-600">{c.description}</p>

      <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1"><MapPin size={13} /> {loc.name}</span>
        <span className="inline-flex items-center gap-1"><Tag size={13} /> {c.categoryIds.length} kategori</span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <StatusBadge status={c.status} />
        <DriverOutcomeBadge outcome={c.driverOutcome} />
        {c.vehicleSanctions.map((v) => (
          <VehicleSanctionBadge key={v} sanction={v} />
        ))}
        {c.vendorFlagged && (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
            <Truck size={12} /> Vendor flagged
          </span>
        )}
      </div>
    </Link>
  )
}
