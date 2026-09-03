import { useState } from 'react'
import { ArrowLeft, Camera, CheckCircle2, Clock3, MapPin, Send, ShieldAlert, UserRound } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { LOCATIONS, ROLES, vendorById } from '../../data/mockData'
import { useStore } from '../../store/useStore'
import { formatDateTime } from '../../utils/format'

export function GateReentryReport() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const driverId = params.get('driverId') ?? ''
  const driver = useStore((s) => s.drivers.find((d) => d.id === driverId))
  const currentRole = useStore((s) => s.currentRole)!
  const addGateAttempt = useStore((s) => s.addGateAttempt)
  const role = ROLES.find((r) => r.key === currentRole)!

  const [locationId, setLocationId] = useState('LOC-GATE')
  const [description, setDescription] = useState('')
  const [evidenceCount, setEvidenceCount] = useState(0)
  const [attemptedAt] = useState(() => new Date().toISOString())
  const [submittedId, setSubmittedId] = useState('')

  if (!driver) {
    return (
      <div className="mx-auto max-w-2xl p-4">
        <div className="card p-6 text-center">
          <p className="font-semibold text-slate-800">Data pihak ketiga tidak ditemukan.</p>
          <button onClick={() => navigate('/gate')} className="btn-secondary mt-4 px-4 py-2.5">
            <ArrowLeft size={16} /> Kembali ke Cek Status
          </button>
        </div>
      </div>
    )
  }

  const vendor = vendorById(driver.vendorId)

  if (driver.status !== 'blacklisted') {
    return (
      <div className="mx-auto max-w-2xl p-4">
        <div className="card p-6 text-center">
          <p className="font-semibold text-slate-800">Laporan percobaan masuk hanya dapat dibuat untuk status blacklist aktif.</p>
          <button onClick={() => navigate('/gate')} className="btn-secondary mt-4 px-4 py-2.5">
            <ArrowLeft size={16} /> Kembali ke Cek Status
          </button>
        </div>
      </div>
    )
  }

  if (submittedId) {
    return (
      <div className="mx-auto max-w-2xl p-4">
        <div className="card overflow-hidden">
          <div className="bg-green-600 p-6 text-center text-white">
            <CheckCircle2 size={44} className="mx-auto mb-2" />
            <h1 className="text-xl font-extrabold">Percobaan Masuk Tercatat</h1>
            <p className="mt-1 text-sm text-green-50">Akses ditolak dan laporan berhasil disimpan.</p>
          </div>
          <div className="space-y-3 p-5 text-sm">
            <div className="flex justify-between gap-3"><span className="text-slate-500">Nomor laporan</span><span className="font-bold text-slate-800">{submittedId}</span></div>
            <div className="flex justify-between gap-3"><span className="text-slate-500">Pihak ketiga</span><span className="font-semibold text-slate-800">{driver.name}</span></div>
            <div className="flex justify-between gap-3"><span className="text-slate-500">Tindakan</span><span className="font-bold text-red-600">Akses ditolak</span></div>
            <button onClick={() => navigate('/gate')} className="btn-primary mt-3 w-full py-3">Kembali ke Cek Status</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl p-4 pb-8">
      <div className="mb-4 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-slate-700">
          <ArrowLeft size={16} /> Kembali
        </button>
        <span className="text-xs font-semibold text-slate-400">Pelaporan Gate</span>
      </div>

      <div className="mb-4 rounded-2xl bg-red-600 p-4 text-white shadow-card">
        <div className="flex items-start gap-3">
          <ShieldAlert size={28} className="mt-0.5 shrink-0" />
          <div>
            <p className="text-lg font-extrabold">Blacklist Aktif — Akses Ditolak</p>
            <p className="mt-1 text-sm text-red-100">Catat percobaan masuk untuk menambah jejak pengawasan. Ini bukan laporan pelanggaran baru.</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="card p-4">
          <p className="label">Pihak ketiga yang diperiksa</p>
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="font-bold text-slate-800">{driver.name}</p>
            <p className="mt-1 text-xs text-slate-500">KTP {driver.ktp} · {driver.plates.join(', ')}</p>
            <p className="text-xs text-slate-500">{vendor.name}</p>
          </div>
          <div className="mt-3 flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700 ring-1 ring-red-100">
            <ShieldAlert size={16} className="mt-0.5 shrink-0" />
            <span><span className="font-semibold">Alasan blacklist: </span>{driver.statusReason ?? 'Blacklist aktif'}</span>
          </div>
        </div>

        <div className="card space-y-4 p-4">
          <div>
            <label className="label"><Clock3 size={15} className="mr-1 inline" />Tanggal &amp; waktu percobaan masuk</label>
            <div className="input bg-slate-50 text-slate-600">{formatDateTime(attemptedAt)}</div>
            <p className="mt-1 text-xs text-slate-400">Terisi otomatis oleh sistem saat laporan dibuat.</p>
          </div>

          <div>
            <label className="label"><MapPin size={15} className="mr-1 inline" />Gate/lokasi</label>
            <select className="input" value={locationId} onChange={(e) => setLocationId(e.target.value)}>
              <option value="">— Pilih gate/lokasi —</option>
              {LOCATIONS.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}
            </select>
          </div>

          <div>
            <label className="label"><UserRound size={15} className="mr-1 inline" />Petugas pelapor</label>
            <div className="input bg-slate-50 text-slate-600">{role.person} · {role.title}</div>
          </div>

          <div>
            <label className="label">Kronologi singkat</label>
            <textarea
              className="input min-h-28 resize-none"
              placeholder="Contoh: Pihak ter-blacklist datang menggunakan kendaraan berbeda dan mencoba masuk melalui Pos Gerbang Utama…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div>
            <label className="label">Bukti tambahan <span className="font-normal text-slate-400">(opsional)</span></label>
            <button onClick={() => setEvidenceCount((n) => n + 1)} className="btn-secondary w-full py-2.5">
              <Camera size={17} /> {evidenceCount ? `${evidenceCount} bukti ditambahkan` : 'Tambahkan foto/bukti'}
            </button>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-slate-500">Tindakan Security</span>
            <span className="rounded-full bg-red-100 px-3 py-1 font-bold text-red-700">Akses Ditolak</span>
          </div>
          <button
            onClick={() => setSubmittedId(addGateAttempt({
              driverId,
              locationId,
              description,
              evidenceCount,
              attemptedAt,
              reporterName: role.person,
              reporterDept: 'Security (Gerbang)',
            }))}
            disabled={!locationId || description.trim().length < 5}
            className="btn-danger mt-4 w-full py-3.5"
          >
            <Send size={18} /> Kirim Laporan Percobaan Masuk
          </button>
          <p className="mt-2 text-center text-xs text-slate-400">Pastikan akses sudah ditolak sebelum mengirim laporan.</p>
        </div>
      </div>
    </div>
  )
}
