import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  AlertOctagon,
  Ban,
  Clock,
  FileWarning,
  Flag,
  TrendingUp,
} from 'lucide-react'
import { useStore } from '../../store/useStore'
import { casesPerMonth, vendorMetrics } from '../../utils/analytics'
import { slaInfo } from '../../utils/format'
import { DRIVER_OUTCOME_LABEL } from '../../utils/ruleEngine'
import type { DriverOutcome } from '../../types'

const OUTCOME_COLOR: Record<DriverOutcome, string> = {
  BLACKLIST: '#dc2626',
  SP2: '#ea580c',
  SP1: '#ca8a04',
  SP_CONDITIONAL: '#0ea5e9',
  NONE: '#94a3b8',
}
const OUTCOME_ORDER: DriverOutcome[] = ['BLACKLIST', 'SP2', 'SP1', 'SP_CONDITIONAL', 'NONE']

export function ManagementDashboard() {
  const cases = useStore((s) => s.cases)
  const drivers = useStore((s) => s.drivers)
  const vendors = useStore((s) => s.vendors)
  const now = useMemo(() => new Date(), [])

  const stats = useMemo(() => {
    const thisMonth = cases.filter((c) => {
      const d = new Date(c.reportedAt)
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    }).length
    const active = cases.filter((c) => c.status === 'open' || c.status === 'in_review').length
    const flaggedVendors = vendors.filter((v) => v.status === 'flagged').length
    const blacklisted = drivers.filter((d) => d.status === 'blacklisted').length

    const decided = cases.filter((c) => c.approval || c.sanction)
    const durations = decided.map((c) => {
      const end = c.approval?.decidedAt ?? c.sanction?.issuedAt ?? c.reportedAt
      return (+new Date(end) - +new Date(c.reportedAt)) / 36e5 / 24
    })
    const avgDays = durations.length ? durations.reduce((a, b) => a + b, 0) / durations.length : 0

    return { thisMonth, active, flaggedVendors, blacklisted, avgDays }
  }, [cases, drivers, vendors, now])

  const perMonth = useMemo(() => casesPerMonth(cases, now, 6), [cases, now])

  const perDept = useMemo(() => {
    const map = new Map<string, number>()
    for (const c of cases) map.set(c.reporterDept, (map.get(c.reporterDept) ?? 0) + 1)
    return [...map.entries()].map(([dept, jumlah]) => ({ dept, jumlah })).sort((a, b) => b.jumlah - a.jumlah)
  }, [cases])

  const topVendors = useMemo(
    () =>
      vendors
        .map((v) => ({ name: v.name.replace(/^(PT|CV\.)\s/, ''), insiden: vendorMetrics(v, cases, drivers).totalIncidents }))
        .sort((a, b) => b.insiden - a.insiden)
        .slice(0, 5),
    [vendors, cases, drivers],
  )

  const perOutcome = useMemo(
    () =>
      OUTCOME_ORDER.map((outcome) => ({
        outcome,
        label: DRIVER_OUTCOME_LABEL[outcome],
        value: cases.filter((c) => c.driverOutcome === outcome).length,
      })).filter((x) => x.value > 0),
    [cases],
  )

  const alerts = useMemo(() => {
    const list: { icon: typeof Flag; text: string; to?: string; tone: string }[] = []
    cases
      .filter((c) => c.status === 'in_review' && slaInfo(c.slaDueAt)?.tone === 'overdue')
      .forEach((c) => list.push({ icon: Clock, text: `${c.id} lewat SLA persetujuan EHFS`, to: `/case/${c.id}`, tone: 'red' }))
    vendors
      .filter((v) => vendorMetrics(v, cases, drivers).totalBlacklists >= 2 && v.status !== 'terminated')
      .forEach((v) => list.push({ icon: FileWarning, text: `${v.name} — rekomendasi terminasi kontrak (≥2 blacklist L1)`, to: `/procurement/vendor/${v.id}`, tone: 'orange' }))
    cases
      .filter((c) => c.driverOutcome === 'BLACKLIST' && c.status === 'in_review')
      .forEach((c) => list.push({ icon: AlertOctagon, text: `${c.id} — rekomendasi blacklist menunggu keputusan`, to: `/case/${c.id}`, tone: 'red' }))
    return list
  }, [cases, vendors, drivers])

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-800">Dashboard Eksekutif</h1>
        <p className="text-sm text-slate-500">Ringkasan kinerja penanganan pelanggaran — Operational Excellence.</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <KpiCard icon={TrendingUp} label="Kasus Bulan Ini" value={stats.thisMonth} tone="brand" />
        <KpiCard icon={Clock} label="Kasus Aktif" value={stats.active} tone="blue" />
        <KpiCard icon={Flag} label="Vendor Flagged" value={stats.flaggedVendors} tone="orange" />
        <KpiCard icon={Ban} label="Supir Blacklist" value={stats.blacklisted} tone="red" />
        <KpiCard icon={Clock} label="Rata² Penyelesaian" value={`${stats.avgDays.toFixed(1)} hr`} tone="slate" />
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <ChartCard title="Kasus per Bulan">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={perMonth} margin={{ top: 8, right: 12, bottom: 0, left: -18 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748b' }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#64748b' }} />
              <Tooltip />
              <Line type="monotone" dataKey="jumlah" stroke="#155a98" strokeWidth={2.5} dot={{ r: 4, fill: '#155a98' }} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Kasus per Departemen Pelapor">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={perDept} margin={{ top: 8, right: 12, bottom: 0, left: -18 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="dept" tick={{ fontSize: 12, fill: '#64748b' }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#64748b' }} />
              <Tooltip />
              <Bar dataKey="jumlah" fill="#1d6fb8" radius={[6, 6, 0, 0]} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Top 5 Vendor Bermasalah">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={topVendors} layout="vertical" margin={{ top: 4, right: 16, bottom: 0, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: '#64748b' }} />
              <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11, fill: '#475569' }} />
              <Tooltip />
              <Bar dataKey="insiden" fill="#ea580c" radius={[0, 6, 6, 0]} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Kasus per Sanksi Supir">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={perOutcome} dataKey="value" nameKey="label" cx="50%" cy="50%" outerRadius={85} label={(e) => `${e.label}: ${e.value}`} isAnimationActive={false}>
                {perOutcome.map((e) => (
                  <Cell key={e.outcome} fill={OUTCOME_COLOR[e.outcome]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Critical alerts */}
      <div className="card p-4">
        <h2 className="mb-3 flex items-center gap-2 font-bold text-slate-800">
          <AlertOctagon size={18} className="text-red-500" /> Alert Kritis
        </h2>
        {alerts.length === 0 ? (
          <p className="text-sm text-slate-400">Tidak ada alert kritis saat ini.</p>
        ) : (
          <ul className="space-y-2">
            {alerts.map((a, i) => {
              const Icon = a.icon
              const tone = a.tone === 'red' ? 'bg-red-50 text-red-700 ring-red-100' : 'bg-orange-50 text-orange-700 ring-orange-100'
              const inner = (
                <span className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm ring-1 ${tone}`}>
                  <Icon size={16} className="shrink-0" /> {a.text}
                </span>
              )
              return <li key={i}>{a.to ? <Link to={a.to}>{inner}</Link> : inner}</li>
            })}
          </ul>
        )}
      </div>
    </div>
  )
}

function KpiCard({ icon: Icon, label, value, tone }: { icon: typeof Flag; label: string; value: number | string; tone: 'brand' | 'blue' | 'orange' | 'red' | 'slate' }) {
  const accent = { brand: 'text-brand-700', blue: 'text-blue-600', orange: 'text-orange-600', red: 'text-red-600', slate: 'text-slate-700' }[tone]
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</span>
        <Icon size={16} className={accent} />
      </div>
      <p className={`text-2xl font-extrabold ${accent}`}>{value}</p>
    </div>
  )
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card p-4">
      <h2 className="mb-2 font-bold text-slate-800">{title}</h2>
      {children}
    </div>
  )
}
