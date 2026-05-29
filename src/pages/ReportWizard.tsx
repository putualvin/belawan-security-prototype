import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Check,
  History,
  Search,
  Send,
  TriangleAlert,
  UserPlus,
  X,
} from 'lucide-react'
import { useStore } from '../store/useStore'
import { LOCATIONS, ROLES, VENDORS, categoryById, vendorById } from '../data/mockData'
import { evaluate, priorCountsFromHistory } from '../utils/ruleEngine'
import { CategoryPicker } from '../components/CategoryPicker'
import { RuleReasoning } from '../components/RuleReasoning'
import { DriverOutcomeBadge, DriverStatusBadge } from '../components/Badges'
import { formatDate } from '../utils/format'

const STEPS = ['Insiden', 'Subjek', 'Pelanggaran', 'Review']

export function ReportWizard() {
  const navigate = useNavigate()
  const drivers = useStore((s) => s.drivers)
  const cases = useStore((s) => s.cases)
  const currentRole = useStore((s) => s.currentRole)!
  const addCase = useStore((s) => s.addCase)
  const addDriver = useStore((s) => s.addDriver)
  const role = ROLES.find((r) => r.key === currentRole)!

  const [step, setStep] = useState(1)
  const [locationId, setLocationId] = useState('')
  const [description, setDescription] = useState('')
  const [driverId, setDriverId] = useState('')
  const [search, setSearch] = useState('')
  const [categoryIds, setCategoryIds] = useState<string[]>([])
  const [evidenceCount, setEvidenceCount] = useState(0)
  const [witnesses, setWitnesses] = useState('')

  // Add-new-driver mini form (search-or-create)
  const [creating, setCreating] = useState(false)
  const [nd, setNd] = useState({ name: '', ktp: '', vendorId: '', plate: '' })

  const selectedDriver = drivers.find((d) => d.id === driverId)

  const result = useMemo(() => {
    const prior = selectedDriver ? priorCountsFromHistory(selectedDriver.history) : {}
    return evaluate(categoryIds.map(categoryById), prior)
  }, [categoryIds, selectedDriver])

  const driverResults = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return drivers.slice(0, 6)
    return drivers.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.ktp.includes(q) ||
        d.plates.some((p) => p.toLowerCase().includes(q)),
    )
  }, [search, drivers])

  const vendorInfo = useMemo(() => {
    if (!selectedDriver) return null
    const vendor = vendorById(selectedDriver.vendorId)
    const live = cases.filter((c) => {
      const drv = drivers.find((d) => d.id === c.driverId)
      return drv?.vendorId === vendor.id
    }).length
    const projected = vendor.historicalIncidents + live + 1
    return { vendor, projected, willFlag: projected >= 5 }
  }, [selectedDriver, cases, drivers])

  const canNext =
    (step === 1 && !!locationId && description.trim().length > 3) ||
    (step === 2 && !!driverId) ||
    (step === 3 && categoryIds.length > 0) ||
    step === 4

  const toggleCat = (id: string) =>
    setCategoryIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  const saveNewDriver = () => {
    if (!nd.name.trim() || !nd.ktp.trim() || !nd.vendorId || !nd.plate.trim()) return
    const id = addDriver(nd)
    setDriverId(id)
    setCreating(false)
    setSearch('')
    setNd({ name: '', ktp: '', vendorId: '', plate: '' })
  }

  const submit = () => {
    const reporterDept = currentRole === 'GATE' ? 'Security (Gerbang)' : 'Security'
    const id = addCase({
      reporterName: role.person,
      reporterDept,
      locationId,
      description,
      driverId,
      categoryIds,
      evidenceCount,
      witnesses,
    })
    navigate(`/case/${id}`)
  }

  return (
    <div className="mx-auto max-w-2xl p-4 pb-8">
      {/* Stepper header */}
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={() => (step === 1 ? navigate(-1) : setStep((s) => s - 1))}
          className="flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft size={16} /> {step === 1 ? 'Kembali' : 'Sebelumnya'}
        </button>
        <span className="text-xs font-semibold text-slate-400">Lapor Pelanggaran · Langkah {step}/4</span>
      </div>

      <div className="mb-5 flex items-center gap-1.5">
        {STEPS.map((label, i) => {
          const n = i + 1
          const done = n < step
          const active = n === step
          return (
            <div key={label} className="flex flex-1 flex-col items-center gap-1">
              <div className="flex w-full items-center">
                <span
                  className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold ${
                    done ? 'bg-brand-600 text-white' : active ? 'bg-brand-700 text-white ring-4 ring-brand-100' : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {done ? <Check size={14} /> : n}
                </span>
                {n < 4 && <span className={`h-0.5 flex-1 ${done ? 'bg-brand-500' : 'bg-slate-200'}`} />}
              </div>
              <span className={`text-[10px] font-semibold ${active ? 'text-brand-700' : 'text-slate-400'}`}>{label}</span>
            </div>
          )
        })}
      </div>

      {/* STEP 1 — Insiden */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="card p-4">
            <label className="label">Tanggal &amp; waktu</label>
            <div className="input flex items-center bg-slate-50 text-slate-500">Hari ini · {formatDate(new Date().toISOString())}</div>
          </div>
          <div className="card p-4">
            <label className="label">Lokasi insiden</label>
            <select className="input" value={locationId} onChange={(e) => setLocationId(e.target.value)}>
              <option value="">— Pilih lokasi —</option>
              {LOCATIONS.map((l) => (
                <option key={l.id} value={l.id}>{l.name} {l.hasCCTV ? '(CCTV)' : ''}</option>
              ))}
            </select>
          </div>
          <div className="card p-4">
            <label className="label">Deskripsi kejadian</label>
            <textarea
              className="input min-h-28 resize-none"
              placeholder="Jelaskan kronologi insiden secara ringkas…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* STEP 2 — Subjek (pilih supir yang melanggar; search-or-create) */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="card p-4">
            <label className="label">Pilih supir / kendaraan yang melanggar</label>
            <p className="mb-2 text-xs text-slate-500">
              Cari dari data master untuk mengaitkan kejadian ke supir. (Ini bukan verifikasi blacklist gerbang.)
            </p>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                className="input pl-9"
                placeholder="Nama, KTP, atau nomor plat…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="mt-3 space-y-2">
              {driverResults.map((d) => {
                const vendor = vendorById(d.vendorId)
                const on = d.id === driverId
                return (
                  <button
                    key={d.id}
                    onClick={() => setDriverId(d.id)}
                    className={`flex w-full items-center justify-between gap-2 rounded-xl border p-3 text-left transition ${
                      on ? 'border-brand-500 bg-brand-50' : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-800">{d.name}</p>
                      <p className="truncate text-xs text-slate-500">{d.plates.join(', ')} · KTP {d.ktp}</p>
                      <p className="truncate text-xs text-slate-400">{vendor.name}</p>
                    </div>
                    <DriverStatusBadge status={d.status} />
                  </button>
                )
              })}
            </div>

            {/* Search-or-create */}
            {!creating ? (
              <button
                onClick={() => {
                  setCreating(true)
                  setNd((s) => ({ ...s, name: search.trim() }))
                }}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 py-2.5 text-sm font-semibold text-slate-500 hover:border-brand-400 hover:text-brand-600"
              >
                <UserPlus size={16} /> Tambah supir baru
              </button>
            ) : (
              <div className="mt-3 space-y-2 rounded-xl bg-slate-50 p-3">
                <p className="text-sm font-semibold text-slate-700">Supir baru</p>
                <input className="input" placeholder="Nama supir" value={nd.name} onChange={(e) => setNd({ ...nd, name: e.target.value })} />
                <input className="input" placeholder="Nomor KTP" value={nd.ktp} onChange={(e) => setNd({ ...nd, ktp: e.target.value })} />
                <input className="input" placeholder="Nomor plat (mis. BK 1234 AB)" value={nd.plate} onChange={(e) => setNd({ ...nd, plate: e.target.value })} />
                <select className="input" value={nd.vendorId} onChange={(e) => setNd({ ...nd, vendorId: e.target.value })}>
                  <option value="">— Pilih vendor —</option>
                  {VENDORS.map((v) => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <button onClick={() => setCreating(false)} className="btn-secondary flex-1 py-2">Batal</button>
                  <button
                    onClick={saveNewDriver}
                    disabled={!nd.name.trim() || !nd.ktp.trim() || !nd.vendorId || !nd.plate.trim()}
                    className="btn-primary flex-1 py-2"
                  >
                    Simpan &amp; pilih
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Prior history */}
          {selectedDriver && (
            <div className="card p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-700">
                <History size={16} /> Riwayat pelanggaran — {selectedDriver.name}
              </div>
              {selectedDriver.history.length === 0 ? (
                <p className="text-sm text-slate-400">Belum ada riwayat pelanggaran tercatat.</p>
              ) : (
                <ul className="space-y-2">
                  {selectedDriver.history.map((h, i) => (
                    <li key={i} className="flex items-start gap-2 rounded-lg bg-slate-50 p-2.5 text-sm">
                      <DriverOutcomeBadge outcome={h.outcome} />
                      <div className="min-w-0">
                        <p className="text-slate-700">{h.group}: {h.description}</p>
                        <p className="text-xs text-slate-400">{formatDate(h.date)}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}

      {/* STEP 3 — Pelanggaran */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="card p-4">
            <label className="label">Kategori pelanggaran (boleh lebih dari satu)</label>
            <p className="mb-3 text-xs text-slate-500">
              Pilih semua kategori yang berlaku. Setiap kategori punya jalur sanksi supir &amp; angkutan sesuai matriks resmi.
            </p>
            <CategoryPicker selected={categoryIds} onToggle={toggleCat} />
          </div>

          <div className="card p-4">
            <label className="label">Bukti foto</label>
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: evidenceCount }).map((_, i) => (
                <div key={i} className="relative grid h-20 w-20 place-items-center rounded-xl bg-slate-100 text-slate-400 ring-1 ring-slate-200">
                  <Camera size={20} />
                  <button onClick={() => setEvidenceCount((c) => c - 1)} className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-slate-700 text-white">
                    <X size={12} />
                  </button>
                </div>
              ))}
              <button onClick={() => setEvidenceCount((c) => c + 1)} className="grid h-20 w-20 place-items-center rounded-xl border-2 border-dashed border-slate-300 text-slate-400 hover:border-brand-400 hover:text-brand-500">
                <Camera size={22} />
              </button>
            </div>
            <p className="mt-1.5 text-xs text-slate-400">Unggah simulasi — ketuk kamera untuk menambah foto.</p>
          </div>

          <div className="card p-4">
            <label className="label">Saksi</label>
            <input className="input" placeholder="Nama saksi / rujukan CCTV…" value={witnesses} onChange={(e) => setWitnesses(e.target.value)} />
          </div>
        </div>
      )}

      {/* STEP 4 — Review */}
      {step === 4 && selectedDriver && (
        <div className="space-y-4">
          <div className="card divide-y divide-slate-100">
            <Row label="Pelapor" value={`${role.person} · ${currentRole === 'GATE' ? 'Security (Gerbang)' : 'Security'}`} />
            <Row label="Lokasi" value={LOCATIONS.find((l) => l.id === locationId)?.name ?? '-'} />
            <Row label="Subjek" value={`${selectedDriver.name} · ${selectedDriver.plates[0]}`} />
            <Row label="Vendor" value={vendorById(selectedDriver.vendorId).name} />
            <Row label="Bukti" value={`${evidenceCount} foto`} />
            <Row label="Saksi" value={witnesses || '-'} />
            <div className="p-3">
              <p className="mb-1.5 text-xs font-semibold text-slate-400">Kategori terpilih</p>
              <div className="flex flex-wrap gap-1.5">
                {categoryIds.map((id) => {
                  const cat = categoryById(id)
                  return (
                    <span key={id} className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                      {cat.group}: {cat.name}
                    </span>
                  )
                })}
              </div>
            </div>
          </div>

          <RuleReasoning
            driverOutcome={result.driverOutcome}
            vehicleSanctions={result.vehicleSanctions}
            reasoning={result.reasoning}
            routing={result.routing}
          />

          {vendorInfo?.willFlag && (
            <div className="flex items-start gap-2 rounded-2xl bg-amber-50 p-3.5 text-sm text-amber-800 ring-1 ring-amber-200">
              <TriangleAlert size={18} className="mt-0.5 shrink-0" />
              <span>
                <span className="font-semibold">Vendor ini akan di-flag ke Procurement</span> — sudah {vendorInfo.projected} kejadian tercatat untuk {vendorInfo.vendor.name}.
              </span>
            </div>
          )}

          <button onClick={submit} className="btn-primary w-full py-3.5 text-base">
            {result.routing === 'APPROVAL' ? (
              <><Send size={18} /> Kirim ke EHFS untuk Persetujuan</>
            ) : (
              <><Check size={18} /> Terbitkan Sanksi Langsung</>
            )}
          </button>
          <p className="text-center text-xs text-slate-400">
            {result.routing === 'APPROVAL'
              ? 'Sanksi blacklist membutuhkan persetujuan EHFS sebelum berlaku.'
              : 'Sanksi SP / finansial dapat Anda terbitkan langsung sebagai PIC.'}
          </p>
        </div>
      )}

      {/* Footer nav */}
      {step < 4 && (
        <button onClick={() => canNext && setStep((s) => s + 1)} disabled={!canNext} className="btn-primary mt-5 w-full py-3">
          Lanjut <ArrowRight size={18} />
        </button>
      )}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 p-3">
      <span className="text-xs font-semibold text-slate-400">{label}</span>
      <span className="text-right text-sm font-medium text-slate-700">{value}</span>
    </div>
  )
}
