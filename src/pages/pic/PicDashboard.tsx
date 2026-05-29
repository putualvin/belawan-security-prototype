import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { CaseCard } from '../../components/CaseCard'
import type { CaseStatus } from '../../types'

type Filter = 'all' | CaseStatus

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'Semua' },
  { key: 'open', label: 'Open' },
  { key: 'in_review', label: 'In Review' },
  { key: 'sanctioned', label: 'Tersanksi' },
  { key: 'closed', label: 'Closed' },
]

export function PicDashboard() {
  const cases = useStore((s) => s.cases)
  const navigate = useNavigate()
  const [filter, setFilter] = useState<Filter>('all')

  const sorted = useMemo(
    () => [...cases].sort((a, b) => +new Date(b.reportedAt) - +new Date(a.reportedAt)),
    [cases],
  )
  const shown = filter === 'all' ? sorted : sorted.filter((c) => c.status === filter)

  const counts = {
    open: cases.filter((c) => c.status === 'open').length,
    in_review: cases.filter((c) => c.status === 'in_review').length,
    sanctioned: cases.filter((c) => c.status === 'sanctioned').length,
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4">
      <div>
        <h1 className="text-xl font-extrabold text-slate-800">Laporan Pelanggaran</h1>
        <p className="text-sm text-slate-500">Laporan yang Anda &amp; tim ajukan.</p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-2">
        <Stat label="Open" value={counts.open} tone="slate" />
        <Stat label="In Review" value={counts.in_review} tone="blue" />
        <Stat label="Tersanksi" value={counts.sanctioned} tone="red" />
      </div>

      <button
        onClick={() => navigate('/report')}
        className="btn-primary w-full py-3.5 text-base shadow-lg shadow-brand-700/20"
      >
        <Plus size={20} /> Lapor Pelanggaran
      </button>

      {/* Filters */}
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 thin-scroll">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              filter === f.key ? 'bg-brand-700 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {shown.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-300 py-10 text-center text-sm text-slate-400">
            Tidak ada laporan pada filter ini.
          </p>
        ) : (
          shown.map((c) => <CaseCard key={c.id} c={c} />)
        )}
      </div>
    </div>
  )
}

function Stat({ label, value, tone }: { label: string; value: number; tone: 'slate' | 'blue' | 'red' }) {
  const cls = {
    slate: 'text-slate-700',
    blue: 'text-blue-600',
    red: 'text-red-600',
  }[tone]
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 text-center shadow-card">
      <p className={`text-2xl font-extrabold ${cls}`}>{value}</p>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
    </div>
  )
}
