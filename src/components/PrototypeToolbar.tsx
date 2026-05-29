import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FlaskConical, Monitor, RotateCcw, Smartphone, X, LogOut } from 'lucide-react'
import { useStore } from '../store/useStore'

export function PrototypeToolbar() {
  const deviceMode = useStore((s) => s.deviceMode)
  const setDeviceMode = useStore((s) => s.setDeviceMode)
  const resetDemo = useStore((s) => s.resetDemo)
  const clearRole = useStore((s) => s.clearRole)
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)

  const doReset = () => {
    resetDemo()
    setConfirmReset(false)
    setOpen(false)
  }

  return (
    <div className="fixed bottom-20 right-4 z-[60] flex flex-col items-end gap-2 sm:bottom-4 print:hidden">
      {open && (
        <div className="w-64 rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl">
          <div className="mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-amber-600">
              <FlaskConical size={14} /> Kontrol Prototipe
            </span>
            <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600">
              <X size={16} />
            </button>
          </div>

          <p className="mb-1.5 text-xs font-semibold text-slate-600">Tampilan perangkat</p>
          <div className="mb-3 grid grid-cols-2 gap-2">
            <button
              onClick={() => setDeviceMode('phone')}
              className={`flex items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-xs font-semibold transition ${
                deviceMode === 'phone' ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Smartphone size={14} /> Phone
            </button>
            <button
              onClick={() => setDeviceMode('desktop')}
              className={`flex items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-xs font-semibold transition ${
                deviceMode === 'desktop' ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Monitor size={14} /> Desktop
            </button>
          </div>

          {confirmReset ? (
            <div className="mb-2 rounded-lg bg-amber-50 p-2 text-xs text-amber-800">
              <p className="mb-2 font-semibold">Reset semua data demo ke kondisi awal?</p>
              <div className="flex gap-2">
                <button onClick={doReset} className="flex-1 rounded-md bg-amber-600 px-2 py-1.5 font-semibold text-white hover:bg-amber-700">
                  Ya, reset
                </button>
                <button onClick={() => setConfirmReset(false)} className="flex-1 rounded-md border border-slate-300 px-2 py-1.5 font-semibold text-slate-600">
                  Batal
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setConfirmReset(true)}
              className="mb-2 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 px-2 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              <RotateCcw size={14} /> Reset Data Demo
            </button>
          )}

          <button
            onClick={() => {
              clearRole()
              navigate('/')
            }}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 px-2 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            <LogOut size={14} /> Pemilihan Peran
          </button>

          <p className="mt-2 text-center text-[10px] text-slate-400">Data tidak tersimpan permanen.</p>
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full bg-amber-500 px-3.5 py-2.5 font-bold text-white shadow-lg ring-2 ring-amber-300 transition hover:bg-amber-600"
        title="Kontrol prototipe"
      >
        <FlaskConical size={18} />
        <span className="text-xs uppercase tracking-wide">Prototipe</span>
      </button>
    </div>
  )
}
