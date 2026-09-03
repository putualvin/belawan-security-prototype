import { useNavigate } from 'react-router-dom'
import { ArrowRight, FlaskConical, Info, ShieldAlert } from 'lucide-react'
import { useStore } from '../store/useStore'
import { ROLES } from '../data/mockData'
import { ROLE_ICON } from '../components/roleIcons'
import type { RoleKey } from '../types'

export function Landing() {
  const setRole = useStore((s) => s.setRole)
  const navigate = useNavigate()

  const pick = (key: RoleKey, home: string) => {
    setRole(key)
    navigate(home)
  }

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-brand-900 via-brand-800 to-slate-900">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-white/15 text-lg font-extrabold text-white">
              SM
            </div>
            <div className="leading-tight">
              <p className="font-bold text-white">PT SMART Tbk — Belawan</p>
              <p className="text-xs text-white/70">Sinar Mas Agribusiness and Food · Operational Excellence</p>
            </div>
          </div>
          <span className="hidden items-center gap-1.5 rounded-full bg-amber-500/90 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white sm:flex">
            <FlaskConical size={14} /> Prototipe
          </span>
        </div>

        {/* Hero */}
        <div className="mb-6 rounded-3xl bg-white/5 p-6 ring-1 ring-white/10 sm:p-8">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/80">
            <ShieldAlert size={14} /> Sistem Pelaporan & Penindakan Pelanggaran Pihak Ketiga
          </div>
          <h1 className="text-2xl font-extrabold text-white sm:text-3xl">
            Satu alur, lima peran, satu sumber kebenaran.
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-white/75">
            Menggantikan alur kerja kertas &amp; Excel yang terfragmentasi dengan perhitungan sanksi
            berdasarkan matriks yang berlaku dan eskalasi otomatis. Pilih salah satu peran di bawah untuk mencobanya.
          </p>

          <div className="mt-4 flex items-start gap-2 rounded-2xl bg-amber-400/10 p-3 text-sm text-amber-100 ring-1 ring-amber-300/30">
            <Info size={18} className="mt-0.5 shrink-0" />
            <p>
              <span className="font-semibold">Ini prototipe untuk validasi konsep.</span> Silakan coba
              setiap peran dan beri masukan. Login hanya pilih peran (tanpa kata sandi). Data{' '}
              <span className="font-semibold">tidak tersimpan permanen</span> — segarkan halaman untuk
              mengembalikannya.
            </p>
          </div>
        </div>

        {/* Role cards */}
        <p className="mb-3 text-sm font-semibold text-white/80">Masuk sebagai:</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ROLES.map((r) => {
            const Icon = ROLE_ICON[r.key]
            return (
              <button
                key={r.key}
                onClick={() => pick(r.key, r.home)}
                className="group flex flex-col rounded-2xl bg-white p-4 text-left shadow-lg ring-1 ring-white/10 transition hover:-translate-y-0.5 hover:shadow-xl"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-100 text-brand-700">
                    <Icon size={22} />
                  </span>
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-500">
                    {r.defaultMode === 'phone' ? 'Mobile' : 'Web'}
                  </span>
                </div>
                <p className="font-bold text-slate-800">{r.title}</p>
                <p className="text-xs font-medium text-slate-400">{r.person} · {r.dept}</p>
                <p className="mt-2 flex-1 text-sm text-slate-600">{r.blurb}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand-700 group-hover:gap-2">
                  Masuk <ArrowRight size={16} className="transition-all" />
                </span>
              </button>
            )
          })}
        </div>

        {/* Demo path hint */}
        <div className="mt-6 rounded-2xl bg-white/5 p-4 text-sm text-white/75 ring-1 ring-white/10">
          <p className="font-semibold text-white">Alur demo end-to-end yang disarankan:</p>
          <p className="mt-1">
            <span className="font-semibold text-white">PIC</span> lapor pelanggaran →{' '}
            <span className="font-semibold text-white">EHFS</span> setujui di antrian →{' '}
            <span className="font-semibold text-white">Security Gerbang</span> cari supir tersebut →
            kini ter-blacklist. Ganti peran kapan saja lewat tombol di kanan atas.
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-white/40">
          Prototipe konsep · PT SMART Tbk Belawan · Bukan produk final · Data simulasi
        </p>
      </div>
    </div>
  )
}
