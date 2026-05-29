import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  History,
  Search,
  ShieldAlert,
  X,
} from 'lucide-react'
import { useStore } from '../../store/useStore'
import { vendorById } from '../../data/mockData'
import { formatDate } from '../../utils/format'
import { DriverOutcomeBadge } from '../../components/Badges'
import type { Driver } from '../../types'

export function GateSearch() {
  const drivers = useStore((s) => s.drivers)
  const navigate = useNavigate()
  const [q, setQ] = useState('')

  const matches = useMemo(() => {
    const query = q.trim().toLowerCase()
    if (!query) return []
    return drivers.filter(
      (d) =>
        d.name.toLowerCase().includes(query) ||
        d.ktp.includes(query) ||
        d.plates.some((p) => p.toLowerCase().replace(/\s/g, '').includes(query.replace(/\s/g, ''))),
    )
  }, [q, drivers])

  return (
    <div className="flex min-h-full flex-col">
      {/* Sticky search */}
      <div className="sticky top-0 z-10 bg-brand-700 px-4 pb-4 pt-3">
        <p className="mb-2 text-center text-sm font-semibold text-white/90">Cek Status Akses Gerbang</p>
        <div className="relative">
          <Search size={20} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            autoFocus
            className="w-full rounded-2xl border-0 py-3.5 pl-11 pr-10 text-lg font-medium text-slate-900 shadow-lg outline-none ring-2 ring-transparent focus:ring-white"
            placeholder="Nama / KTP / nomor plat"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          {q && (
            <button onClick={() => setQ('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 space-y-3 p-4">
        {!q && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-slate-500">
            <ShieldAlert size={36} className="mx-auto mb-2 text-slate-300" />
            <p className="font-semibold text-slate-600">Masukkan data supir / kendaraan</p>
            <p className="mt-1 text-sm">Coba: <span className="font-semibold text-brand-700">Doni Wijaya</span> atau <span className="font-semibold text-brand-700">BK 8024 FI</span></p>
          </div>
        )}

        {q && matches.length === 0 && (
          <div className="rounded-2xl bg-white p-6 text-center text-slate-500 shadow-card">
            Tidak ada hasil untuk “{q}”.
          </div>
        )}

        {matches.map((d) => (
          <ResultCard key={d.id} d={d} />
        ))}
      </div>

      {/* Quick incident report */}
      <div className="sticky bottom-0 border-t border-slate-200 bg-white p-3">
        <button onClick={() => navigate('/report')} className="btn-danger w-full py-3">
          <AlertTriangle size={18} /> Lapor Insiden
        </button>
      </div>
    </div>
  )
}

function ResultCard({ d }: { d: Driver }) {
  const vendor = vendorById(d.vendorId)
  const blocked = d.status === 'blacklisted'

  const banner = {
    clear: { cls: 'bg-green-500', icon: CheckCircle2, text: 'CLEAR — BOLEH MASUK' },
    sp1: { cls: 'bg-yellow-500', icon: AlertTriangle, text: 'BOLEH MASUK — ADA SP-1' },
    sp2: { cls: 'bg-orange-500', icon: AlertTriangle, text: 'BOLEH MASUK — ADA SP-2' },
    blacklisted: { cls: 'bg-red-600', icon: Ban, text: 'BLACKLISTED — TOLAK MASUK' },
  }[d.status]
  const Icon = banner.icon

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-lg">
      <div className={`flex items-center gap-3 px-4 py-3.5 text-white ${banner.cls}`}>
        <Icon size={30} className="shrink-0" />
        <span className="text-lg font-extrabold tracking-wide">{banner.text}</span>
      </div>

      <div className="space-y-3 p-4">
        <div>
          <p className="text-xl font-extrabold text-slate-800">{d.name}</p>
          <p className="text-sm text-slate-500">{d.plates.join(', ')} · KTP {d.ktp}</p>
          <p className="text-sm text-slate-500">{vendor.name}</p>
        </div>

        {blocked && d.statusReason && (
          <div className="flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700 ring-1 ring-red-100">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <span><span className="font-semibold">Alasan: </span>{d.statusReason}</span>
          </div>
        )}
        {!blocked && d.statusReason && (
          <div className="flex items-start gap-2 rounded-xl bg-yellow-50 p-3 text-sm text-yellow-800 ring-1 ring-yellow-100">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <span><span className="font-semibold">Catatan: </span>{d.statusReason} — masih boleh masuk, dalam pengawasan.</span>
          </div>
        )}

        <div>
          <p className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-400">
            <History size={13} /> Riwayat ({d.history.length})
          </p>
          {d.history.length === 0 ? (
            <p className="text-sm text-slate-400">Tidak ada riwayat pelanggaran.</p>
          ) : (
            <ul className="space-y-1.5">
              {d.history.map((h, i) => (
                <li key={i} className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm">
                  <span className="min-w-0 flex items-center gap-2">
                    <DriverOutcomeBadge outcome={h.outcome} />
                    <span className="min-w-0 truncate text-slate-700">{h.description}</span>
                  </span>
                  <span className="shrink-0 text-xs text-slate-400">{formatDate(h.date)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
