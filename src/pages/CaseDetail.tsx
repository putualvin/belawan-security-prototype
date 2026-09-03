import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Camera,
  Check,
  CheckCircle2,
  ClipboardList,
  Clock,
  MapPin,
  Pencil,
  Truck,
  User,
  X,
  XCircle,
} from 'lucide-react'
import { useStore } from '../store/useStore'
import { categoryById, driverById, locationById, vendorById } from '../data/mockData'
import { evaluate, priorCountsFromHistory } from '../utils/ruleEngine'
import { DriverOutcomeBadge, DriverStatusBadge, StatusBadge, VehicleSanctionBadge } from '../components/Badges'
import { RuleReasoning } from '../components/RuleReasoning'
import { CategoryPicker } from '../components/CategoryPicker'
import { formatDate, formatDateTime } from '../utils/format'

export function CaseDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const cases = useStore((s) => s.cases)
  const drivers = useStore((s) => s.drivers)
  const currentRole = useStore((s) => s.currentRole)
  const approveCase = useStore((s) => s.approveCase)
  const rejectCase = useStore((s) => s.rejectCase)
  const executeCase = useStore((s) => s.executeCase)
  const closeCase = useStore((s) => s.closeCase)

  const c = cases.find((x) => x.id === id)
  const driver = c ? drivers.find((d) => d.id === c.driverId) ?? driverById(c.driverId) : undefined

  const [adjusting, setAdjusting] = useState(false)
  const [adjustedIds, setAdjustedIds] = useState<string[]>([])
  const [comment, setComment] = useState('')

  const preview = useMemo(() => {
    if (!c || !driver) return null
    const prior = priorCountsFromHistory(driver.history)
    return evaluate((adjusting ? adjustedIds : c.categoryIds).map(categoryById), prior)
  }, [adjusting, adjustedIds, c, driver])

  if (!c || !driver) {
    return (
      <div className="p-6 text-center text-slate-500">
        <p>Kasus tidak ditemukan.</p>
        <button onClick={() => navigate(-1)} className="btn-secondary mt-4">Kembali</button>
      </div>
    )
  }

  const vendor = vendorById(driver.vendorId)
  const loc = locationById(c.locationId)
  const isEHFS = currentRole === 'EHFS'
  const canApprove = isEHFS && c.status === 'in_review'
  const canExecute = currentRole === 'PIC' && c.status === 'open' && c.routing === 'PIC_DIRECT'
  const canClose = c.status === 'sanctioned' && (currentRole === 'PIC' || currentRole === 'EHFS')

  const startAdjust = () => {
    setAdjustedIds(c.categoryIds)
    setAdjusting(true)
  }
  const toggleAdjust = (cid: string) =>
    setAdjustedIds((prev) => (prev.includes(cid) ? prev.filter((x) => x !== cid) : [...prev, cid]))

  const doApprove = () => {
    const changed =
      adjusting && JSON.stringify([...adjustedIds].sort()) !== JSON.stringify([...c.categoryIds].sort())
    approveCase(c.id, comment.trim(), changed ? adjustedIds : undefined)
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4 pb-8">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-slate-700">
        <ArrowLeft size={16} /> Kembali
      </button>

      {/* Header */}
      <div className="card p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs font-semibold text-slate-400">{c.id}</p>
            <h1 className="text-lg font-extrabold text-slate-800">{driver.name}</h1>
            <p className="text-sm text-slate-500">{c.vehiclePlate} · {vendor.name}</p>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <StatusBadge status={c.status} />
            <DriverStatusBadge status={driver.status} />
          </div>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
          <Info icon={Clock} label="Dilaporkan">{formatDateTime(c.reportedAt)}</Info>
          <Info icon={User} label="Pelapor">{c.reporterName} · {c.reporterDept}</Info>
          <Info icon={MapPin} label="Lokasi">{loc.name}{loc.hasCCTV ? ' · CCTV ✓' : ''}</Info>
          <Info icon={ClipboardList} label="Bukti & saksi">{c.evidenceCount} foto · {c.witnesses || 'tanpa saksi'}</Info>
        </div>
      </div>

      {/* Description + categories */}
      <div className="card space-y-3 p-4">
        <div>
          <p className="mb-1 text-xs font-semibold text-slate-400">Deskripsi</p>
          <p className="text-sm text-slate-700">{c.description}</p>
        </div>
        <div>
          <p className="mb-1.5 text-xs font-semibold text-slate-400">Kategori pelanggaran</p>
          <div className="flex flex-wrap gap-1.5">
            {c.categoryIds.map((cid) => {
              const cat = categoryById(cid)
              return (
                <span key={cid} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                  {cat.group}: {cat.name}
                </span>
              )
            })}
          </div>
        </div>
        {c.evidenceCount > 0 && (
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: c.evidenceCount }).map((_, i) => (
              <div key={i} className="grid h-16 w-16 place-items-center rounded-lg bg-slate-100 text-slate-400 ring-1 ring-slate-200">
                <Camera size={18} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dasar penetapan sanksi */}
      <RuleReasoning
        driverOutcome={c.driverOutcome}
        vehicleSanctions={c.vehicleSanctions}
        reasoning={c.reasoning}
        routing={c.routing}
      />

      {c.vendorFlagged && (
        <div className="flex items-start gap-2 rounded-2xl bg-amber-50 p-3.5 text-sm text-amber-800 ring-1 ring-amber-200">
          <Truck size={18} className="mt-0.5 shrink-0" />
          <span>Vendor <span className="font-semibold">{vendor.name}</span> ter-flag ke Procurement akibat akumulasi insiden.</span>
        </div>
      )}

      {/* Sanction result */}
      {c.sanction && (
        <div className="rounded-2xl bg-slate-900 p-4 text-white">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} className="text-green-400" />
            <span className="font-bold">Sanksi diterbitkan</span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
            <DriverOutcomeBadge outcome={c.sanction.driverOutcome} />
            {c.sanction.vehicleSanctions.map((v) => (
              <VehicleSanctionBadge key={v} sanction={v} />
            ))}
          </div>
          <p className="mt-1.5 text-xs text-white/60">Oleh {c.sanction.issuedBy} · {formatDateTime(c.sanction.issuedAt)}</p>
        </div>
      )}
      {c.approval?.comment && (
        <div className="rounded-2xl border border-slate-200 bg-white p-3.5 text-sm">
          <p className="text-xs font-semibold text-slate-400">Catatan EHFS</p>
          <p className="mt-0.5 text-slate-700">“{c.approval.comment}”</p>
        </div>
      )}

      {/* EHFS approval panel */}
      {canApprove && preview && (
        <div className="card space-y-3 border-brand-200 p-4">
          <p className="flex items-center gap-2 font-bold text-slate-800">
            <Pencil size={16} /> Tinjauan EHFS
          </p>

          {adjusting ? (
            <div className="rounded-xl bg-slate-50 p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-700">Sesuaikan kategori</p>
                <button onClick={() => setAdjusting(false)} className="text-xs font-semibold text-slate-500">Batal</button>
              </div>
              <CategoryPicker selected={adjustedIds} onToggle={toggleAdjust} />
              <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg bg-white p-2 text-sm ring-1 ring-slate-200">
                <span>Setelah penyesuaian:</span>
                <DriverOutcomeBadge outcome={preview.driverOutcome} />
                {preview.vehicleSanctions.map((v) => (
                  <VehicleSanctionBadge key={v} sanction={v} />
                ))}
              </div>
            </div>
          ) : (
            <button onClick={startAdjust} className="btn-secondary w-full">
              <Pencil size={15} /> Sesuaikan kategori pelanggaran
            </button>
          )}

          <div>
            <label className="label">Komentar (opsional)</label>
            <textarea
              className="input min-h-20 resize-none"
              placeholder="Catatan keputusan…"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => rejectCase(c.id, comment.trim() || 'Ditolak tanpa catatan.')} className="btn-danger py-3">
              <XCircle size={18} /> Tolak
            </button>
            <button onClick={doApprove} className="btn-primary py-3">
              <Check size={18} /> Setujui &amp; Terbitkan
            </button>
          </div>
        </div>
      )}

      {/* PIC execute (open, non-blacklist) */}
      {canExecute && (
        <button onClick={() => executeCase(c.id, 'Budi Santoso (PIC Security)')} className="btn-primary w-full py-3.5">
          <Check size={18} /> Terbitkan Sanksi — {c.driverOutcomeLabel}
        </button>
      )}

      {canClose && (
        <button onClick={() => closeCase(c.id)} className="btn-secondary w-full py-3">
          <X size={16} /> Tutup Kasus
        </button>
      )}

      {/* Audit timeline */}
      <div className="card p-4">
        <p className="mb-3 text-sm font-bold text-slate-700">Jejak Audit</p>
        <ol className="space-y-3">
          {c.audit.map((a, i) => (
            <li key={i} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-brand-500" />
                {i < c.audit.length - 1 && <span className="w-px flex-1 bg-slate-200" />}
              </div>
              <div className="pb-1">
                <p className="text-sm font-medium text-slate-700">{a.action}</p>
                <p className="text-xs text-slate-400">{a.actor} · {formatDateTime(a.at)}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      {/* Driver prior history */}
      {driver.history.length > 0 && (
        <div className="card p-4">
          <p className="mb-2 text-sm font-bold text-slate-700">Riwayat supir — {driver.name}</p>
          <ul className="space-y-2">
            {driver.history.map((h, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <DriverOutcomeBadge outcome={h.outcome} />
                <div>
                  <p className="text-slate-700">{h.group}: {h.description}</p>
                  <p className="text-xs text-slate-400">{formatDate(h.date)}{h.caseId ? ` · ${h.caseId}` : ''}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function Info({ icon: Icon, label, children }: { icon: typeof Clock; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <Icon size={15} className="mt-0.5 shrink-0 text-slate-400" />
      <span>
        <span className="block text-[11px] font-semibold text-slate-400">{label}</span>
        <span className="text-slate-700">{children}</span>
      </span>
    </div>
  )
}
