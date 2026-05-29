import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, ChevronRight, Truck } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { vendorMetrics } from '../../utils/analytics'
import { VendorStatusBadge } from '../../components/Badges'

export function ProcurementDashboard() {
  const vendors = useStore((s) => s.vendors)
  const cases = useStore((s) => s.cases)
  const drivers = useStore((s) => s.drivers)
  const navigate = useNavigate()

  const rows = useMemo(
    () =>
      vendors
        .map((v) => ({ vendor: v, m: vendorMetrics(v, cases, drivers) }))
        .sort((a, b) => b.m.totalIncidents - a.m.totalIncidents),
    [vendors, cases, drivers],
  )

  const flagged = vendors.filter((v) => v.status === 'flagged').length
  const review = vendors.filter((v) => v.status === 'review').length
  const terminated = vendors.filter((v) => v.status === 'terminated').length

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-800">Manajemen Vendor</h1>
        <p className="text-sm text-slate-500">Rekam jejak insiden vendor pihak ketiga &amp; tindak lanjut kontrak.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi label="Total Vendor" value={vendors.length} tone="slate" />
        <Kpi label="Flagged" value={flagged} tone="orange" />
        <Kpi label="Review Kontrak" value={review} tone="yellow" />
        <Kpi label="Terminasi" value={terminated} tone="red" />
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-400">
              <th className="px-4 py-3 font-semibold">Vendor</th>
              <th className="px-4 py-3 font-semibold">Kontrak</th>
              <th className="px-4 py-3 text-center font-semibold">Insiden</th>
              <th className="px-4 py-3 text-center font-semibold">SP</th>
              <th className="px-4 py-3 text-center font-semibold">Blacklist</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ vendor, m }) => {
              const danger = vendor.status === 'flagged' || vendor.status === 'terminated'
              return (
                <tr
                  key={vendor.id}
                  onClick={() => navigate(`/procurement/vendor/${vendor.id}`)}
                  className={`cursor-pointer border-b border-slate-100 transition last:border-0 hover:bg-brand-50 ${danger ? 'bg-amber-50/40' : ''}`}
                >
                  <td className="px-4 py-3 font-semibold text-slate-800">
                    <span className="flex items-center gap-2">
                      {danger && <AlertTriangle size={15} className="text-amber-500" />}
                      {vendor.name}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{vendor.contractNo}</td>
                  <td className="px-4 py-3 text-center font-bold text-slate-700">{m.totalIncidents}</td>
                  <td className="px-4 py-3 text-center text-slate-600">{m.totalSP}</td>
                  <td className="px-4 py-3 text-center text-slate-600">{m.totalBlacklists}</td>
                  <td className="px-4 py-3"><VendorStatusBadge status={vendor.status} /></td>
                  <td className="px-4 py-3 text-right"><ChevronRight size={16} className="text-slate-300" /></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {rows.map(({ vendor, m }) => {
          const danger = vendor.status === 'flagged' || vendor.status === 'terminated'
          return (
            <button
              key={vendor.id}
              onClick={() => navigate(`/procurement/vendor/${vendor.id}`)}
              className={`flex w-full items-center justify-between gap-3 rounded-2xl border bg-white p-4 text-left shadow-card ${danger ? 'border-amber-300' : 'border-slate-200'}`}
            >
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 font-bold text-slate-800">
                  {danger && <AlertTriangle size={14} className="text-amber-500" />}
                  <span className="truncate">{vendor.name}</span>
                </p>
                <p className="text-xs text-slate-500">{m.totalIncidents} insiden · {m.totalSP} SP · {m.totalBlacklists} blacklist</p>
                <div className="mt-1.5"><VendorStatusBadge status={vendor.status} /></div>
              </div>
              <ChevronRight size={18} className="shrink-0 text-slate-300" />
            </button>
          )
        })}
      </div>

      <p className="flex items-center gap-1.5 text-xs text-slate-400">
        <Truck size={13} /> Ambang flag otomatis: ≥ 5 insiden → flag Procurement · ≥ 2 blacklist L1 (12 bln) → rekomendasi terminasi.
      </p>
    </div>
  )
}

function Kpi({ label, value, tone }: { label: string; value: number; tone: 'slate' | 'orange' | 'yellow' | 'red' }) {
  const cls = { slate: 'text-slate-700', orange: 'text-orange-600', yellow: 'text-yellow-600', red: 'text-red-600' }[tone]
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
      <p className={`text-3xl font-extrabold ${cls}`}>{value}</p>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
    </div>
  )
}
