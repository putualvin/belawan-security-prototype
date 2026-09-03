import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { ArrowRight, CheckCircle2, LockKeyhole, LogIn, Monitor, ShieldAlert, Smartphone } from 'lucide-react'
import { useStore } from '../store/useStore'
import { ROLES } from '../data/mockData'
import type { RoleKey } from '../types'
import { detectDeviceMode } from '../utils/device'

const DEMO_PIN = '1234'

export function Landing() {
  const currentRole = useStore((s) => s.currentRole)
  const setRole = useStore((s) => s.setRole)
  const navigate = useNavigate()
  const [deviceMode, setDeviceMode] = useState(detectDeviceMode)
  const [roleKey, setRoleKey] = useState<RoleKey | ''>('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')

  const compatibleRoles = useMemo(
    () => ROLES.filter((role) => role.defaultMode === deviceMode),
    [deviceMode],
  )

  useEffect(() => {
    const onResize = () => setDeviceMode(detectDeviceMode())
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    if (compatibleRoles.length > 0 && !compatibleRoles.some((role) => role.key === roleKey)) {
      setRoleKey(compatibleRoles[0].key)
    }
  }, [compatibleRoles, roleKey])

  if (currentRole) {
    const active = ROLES.find((role) => role.key === currentRole)
    return <Navigate to={active?.home ?? '/'} replace />
  }

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const active = compatibleRoles.find((role) => role.key === roleKey)
    if (!active) {
      setError('Akun untuk perangkat ini belum tersedia.')
      return
    }
    if (pin !== DEMO_PIN) {
      setError('PIN tidak sesuai. Untuk prototipe, gunakan PIN 1234.')
      return
    }
    setError('')
    setRole(active.key)
    navigate(active.home)
  }

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-brand-900 via-brand-800 to-slate-900">
      <div className="mx-auto flex min-h-[100dvh] max-w-5xl items-center px-4 py-8 sm:py-12">
        <div className="w-full">
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
          <div className="hidden items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/80 sm:flex">
            {deviceMode === 'phone' ? <Smartphone size={14} /> : <Monitor size={14} />}
            {deviceMode === 'phone' ? 'Perangkat ponsel' : 'Perangkat desktop'}
          </div>
        </div>

        <div className="mx-auto max-w-md rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-brand-100 text-brand-700">
              <ShieldAlert size={28} />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-800">Login Sistem Keamanan</h1>
            <p className="mt-1 text-sm text-slate-500">Masuk menggunakan akun sesuai perangkat yang digunakan.</p>
          </div>

          <div className="mb-5 flex items-center gap-3 rounded-2xl bg-brand-50 p-3 text-sm text-brand-800 ring-1 ring-brand-100">
            {deviceMode === 'phone' ? <Smartphone size={20} className="shrink-0" /> : <Monitor size={20} className="shrink-0" />}
            <div>
              <p className="font-bold">{deviceMode === 'phone' ? 'Aplikasi mobile lapangan' : 'Aplikasi web operasional'}</p>
              <p className="text-xs text-brand-700">Peran ditampilkan berdasarkan perangkat ini.</p>
            </div>
          </div>

          <form className="space-y-4" onSubmit={submit}>
            <div>
              <label className="label" htmlFor="account">Akun pengguna</label>
              <select id="account" className="input" value={roleKey} onChange={(event) => setRoleKey(event.target.value as RoleKey)}>
                {compatibleRoles.map((role) => {
                  return <option key={role.key} value={role.key}>{role.person} — {role.title}</option>
                })}
              </select>
            </div>

            <div>
              <label className="label" htmlFor="pin"><LockKeyhole size={15} className="mr-1 inline" />PIN</label>
              <input
                id="pin"
                type="password"
                inputMode="numeric"
                autoComplete="current-password"
                className="input"
                placeholder="Masukkan PIN"
                value={pin}
                onChange={(event) => setPin(event.target.value)}
              />
              <p className="mt-1 text-xs text-slate-400">PIN demo: 1234</p>
            </div>

            {error && <p className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}

            <button type="submit" className="btn-primary w-full py-3.5">
              <LogIn size={18} /> Masuk
            </button>
          </form>

          <div className="mt-5 border-t border-slate-100 pt-4 text-xs text-slate-400">
            <p className="flex items-start gap-2"><CheckCircle2 size={15} className="mt-0.5 shrink-0 text-green-600" /> Sesi menentukan menu dan kewenangan sesuai akun.</p>
            <p className="mt-2 flex items-start gap-2"><ArrowRight size={15} className="mt-0.5 shrink-0 text-brand-600" /> Security Gerbang dapat memakai Cek Status lalu melaporkan percobaan masuk.</p>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-white/40">
          Prototipe konsep · PT SMART Tbk Belawan · Bukan produk final · Data simulasi
        </p>
        </div>
      </div>
    </div>
  )
}
