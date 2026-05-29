import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowLeft,
  Ban,
  FileWarning,
  RotateCcw,
  XOctagon,
} from 'lucide-react'
import { useStore } from '../../store/useStore'
import { vendorMetrics } from '../../utils/analytics'
import { DriverOutcomeBadge, DriverStatusBadge, StatusBadge, VendorStatusBadge } from '../../components/Badges'
import { formatDate } from '../../utils/format'
import { locationById } from '../../data/mockData'

export function VendorDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const vendors = useStore((s) => s.vendors)
  const cases = useStore((s) => s.cases)
  const drivers = useStore((s) => s.drivers)
  const setVendorStatus = useStore((s) => s.setVendorStatus)
  const [confirmTerminate, setConfirmTerminate] = useState(false)

  const vendor = vendors.find((v) => v.id === id)
  if (!vendor) {
    return (
      <div className="p-6 text-center text-slate-500">
        Vendor tidak ditemukan.
        <button onClick={() => navigate('/procurement')} className="btn-secondary mt-4">Kembali</button>
      </div>
    )
  }

  const m = vendorMetrics(vendor, cases, drivers)
  const timeline = [...m.cases].sort((a, b) => +new Date(b.reportedAt) - +new Date(a.reportedAt))
  const recommendTermination = m.totalBlacklists >= 2

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <button onClick={() => navigate('/procurement')} className="flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-slate-700">
        <ArrowLeft size={16} /> Semua Vendor
      </button>

      {/* Header */}
      <div className="card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-800">{vendor.name}</h1>
            <p className="text-sm text-slate-500">Kontrak {vendor.contractNo}</p>
            {vendor.note && <p className="mt-1 text-sm text-slate-400">{vendor.note}</p>}
          </div>
          <VendorStatusBadge status={vendor.status} />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Metric label="Total Insiden" value={m.totalIncidents} />
          <Metric label="SP" value={m.totalSP} />
          <Metric label="Blacklist L1" value={m.totalBlacklists} />
          <Metric label="Jumlah Supir" value={m.drivers.length} />
        </div>

        {recommendTermination && (
          <div className="mt-4 flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700 ring-1 ring-red-100">
            <AlertTriangle size={18} className="mt-0.5 shrink-0" />
            <span><span className="font-semibold">Rekomendasi sistem: pertimbangkan terminasi kontrak.</span> Vendor memiliki ≥ 2 blacklist L1.</span>
          </div>
        )}

        {/* Contract actions */}
        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={() => setVendorStatus(vendor.id, 'review')} className="btn-secondary" disabled={vendor.status === 'review'}>
            <FileWarning size={16} /> Tandai Review Kontrak
          </button>
          {confirmTerminate ? (
            <span className="inline-flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-sm ring-1 ring-red-200">
              <span className="font-semibold text-red-700">Terminasi kontrak?</span>
              <button onClick={() => { setVendorStatus(vendor.id, 'terminated'); setConfirmTerminate(false) }} className="rounded-md bg-red-600 px-2 py-1 text-xs font-semibold text-white">Ya</button>
              <button onClick={() => setConfirmTerminate(false)} className="rounded-md border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-600">Batal</button>
            </span>
          ) : (
            <button onClick={() => setConfirmTerminate(true)} className="btn-danger" disabled={vendor.status === 'terminated'}>
              <XOctagon size={16} /> Tandai Terminasi
            </button>
          )}
          {vendor.status !== 'active' && (
            <button onClick={() => setVendorStatus(vendor.id, 'active')} className="btn-secondary">
              <RotateCcw size={16} /> Aktifkan Kembali
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Incident timeline */}
        <div className="card p-4">
          <h2 className="mb-3 font-bold text-slate-800">Timeline Insiden (sistem baru)</h2>
          {timeline.length === 0 ? (
            <p className="text-sm text-slate-400">
              Belum ada insiden tercatat di sistem baru. {vendor.historicalIncidents} insiden berasal dari arsip lama.
            </p>
          ) : (
            <ol className="space-y-3">
              {timeline.map((c) => {
                const driver = drivers.find((d) => d.id === c.driverId)!
                return (
                  <li key={c.id}>
                    <Link to={`/case/${c.id}`} className="block rounded-xl border border-slate-100 p-3 transition hover:border-brand-300 hover:bg-brand-50">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-slate-400">{c.id} · {formatDate(c.reportedAt)}</span>
                        <StatusBadge status={c.status} />
                      </div>
                      <p className="mt-0.5 font-semibold text-slate-700">{driver.name} · {c.vehiclePlate}</p>
                      <p className="text-xs text-slate-500">{locationById(c.locationId).name}</p>
                      <div className="mt-1.5"><DriverOutcomeBadge outcome={c.driverOutcome} /></div>
                    </Link>
                  </li>
                )
              })}
            </ol>
          )}
        </div>

        {/* Drivers */}
        <div className="card p-4">
          <h2 className="mb-3 font-bold text-slate-800">Daftar Supir ({m.drivers.length})</h2>
          {m.drivers.length === 0 ? (
            <p className="text-sm text-slate-400">Tidak ada supir terdaftar.</p>
          ) : (
            <ul className="space-y-2">
              {m.drivers.map((d) => (
                <li key={d.id} className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-700">{d.name}</p>
                    <p className="truncate text-xs text-slate-400">{d.plates.join(', ')}</p>
                  </div>
                  <DriverStatusBadge status={d.status} />
                </li>
              ))}
            </ul>
          )}
          {m.blacklistedDrivers.length > 0 && (
            <p className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-red-600">
              <Ban size={13} /> {m.blacklistedDrivers.length} supir aktif ter-blacklist.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3 text-center">
      <p className="text-2xl font-extrabold text-slate-800">{value}</p>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
    </div>
  )
}
