import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Clock, Inbox } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { driverById, locationById, vendorById } from '../../data/mockData'
import { DriverOutcomeBadge, StatusBadge } from '../../components/Badges'
import { formatDate, slaInfo } from '../../utils/format'
import type { ViolationCase } from '../../types'

type Tab = 'pending' | 'decided' | 'all'

export function EhfsQueue() {
  const cases = useStore((s) => s.cases)
  const [tab, setTab] = useState<Tab>('pending')

  const pending = useMemo(
    () =>
      cases
        .filter((c) => c.status === 'in_review')
        .sort((a, b) => +new Date(a.slaDueAt ?? a.reportedAt) - +new Date(b.slaDueAt ?? b.reportedAt)),
    [cases],
  )
  const decided = useMemo(
    () => cases.filter((c) => c.approval).sort((a, b) => +new Date(b.approval!.decidedAt) - +new Date(a.approval!.decidedAt)),
    [cases],
  )
  const all = useMemo(() => [...cases].sort((a, b) => +new Date(b.reportedAt) - +new Date(a.reportedAt)), [cases])

  const shown = tab === 'pending' ? pending : tab === 'decided' ? decided : all
  const overdue = pending.filter((c) => slaInfo(c.slaDueAt)?.tone === 'overdue').length

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'pending', label: 'Menunggu Persetujuan', count: pending.length },
    { key: 'decided', label: 'Sudah Diputuskan', count: decided.length },
    { key: 'all', label: 'Semua Kasus', count: all.length },
  ]

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-800">Antrian Persetujuan EHFS</h1>
        <p className="text-sm text-slate-500">Sanksi blacklist menunggu tinjauan. Diurutkan berdasarkan urgensi SLA.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi label="Menunggu" value={pending.length} tone="blue" />
        <Kpi label="Lewat SLA" value={overdue} tone="red" />
        <Kpi label="Diputuskan" value={decided.length} tone="slate" />
        <Kpi label="Total Kasus" value={all.length} tone="slate" />
      </div>

      <div className="flex flex-wrap gap-2 border-b border-slate-200">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`relative -mb-px flex items-center gap-2 px-3 py-2.5 text-sm font-semibold transition ${
              tab === t.key ? 'border-b-2 border-brand-600 text-brand-700' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.label}
            <span className={`rounded-full px-1.5 py-0.5 text-[11px] ${tab === t.key ? 'bg-brand-100 text-brand-700' : 'bg-slate-100 text-slate-500'}`}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 py-16 text-center text-slate-400">
          <Inbox size={32} className="mx-auto mb-2 opacity-50" />
          Tidak ada kasus pada tab ini.
        </div>
      ) : (
        <div className="space-y-2.5">
          {shown.map((c) => (
            <QueueRow key={c.id} c={c} showSla={tab === 'pending'} />
          ))}
        </div>
      )}
    </div>
  )
}

function QueueRow({ c, showSla }: { c: ViolationCase; showSla: boolean }) {
  const driver = driverById(c.driverId)
  const vendor = vendorById(driver.vendorId)
  const loc = locationById(c.locationId)
  const sla = slaInfo(c.slaDueAt)
  const slaCls =
    sla?.tone === 'overdue' ? 'bg-red-100 text-red-700' : sla?.tone === 'urgent' ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-600'

  return (
    <Link
      to={`/case/${c.id}`}
      className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-card transition hover:border-brand-300 hover:shadow-md"
    >
      <div className="hidden shrink-0 sm:block">
        <DriverOutcomeBadge outcome={c.driverOutcome} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-400">{c.id}</span>
          <span className="sm:hidden"><DriverOutcomeBadge outcome={c.driverOutcome} /></span>
          {c.vendorFlagged && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">Vendor flagged</span>}
        </div>
        <p className="truncate font-bold text-slate-800">{driver.name} · {c.vehiclePlate}</p>
        <p className="truncate text-sm text-slate-500">{vendor.name} · {loc.name} · {formatDate(c.reportedAt)}</p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1.5">
        {showSla && sla ? (
          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${slaCls}`}>
            <Clock size={12} /> {sla.label}
          </span>
        ) : (
          <StatusBadge status={c.status} />
        )}
        <ChevronRight size={18} className="text-slate-300" />
      </div>
    </Link>
  )
}

function Kpi({ label, value, tone }: { label: string; value: number; tone: 'blue' | 'red' | 'slate' }) {
  const cls = { blue: 'text-blue-600', red: 'text-red-600', slate: 'text-slate-700' }[tone]
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
      <p className={`text-3xl font-extrabold ${cls}`}>{value}</p>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
    </div>
  )
}
