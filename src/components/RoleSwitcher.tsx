import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, ChevronDown, Users } from 'lucide-react'
import { useStore } from '../store/useStore'
import { ROLES } from '../data/mockData'
import { ROLE_ICON } from './roleIcons'

export function RoleSwitcher({ compact = false }: { compact?: boolean }) {
  const currentRole = useStore((s) => s.currentRole)
  const setRole = useStore((s) => s.setRole)
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const active = ROLES.find((r) => r.key === currentRole)

  const pick = (key: (typeof ROLES)[number]['key'], home: string) => {
    setRole(key)
    setOpen(false)
    navigate(home)
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-2.5 py-1.5 text-left text-white transition hover:bg-white/20"
      >
        <Users size={16} className="shrink-0" />
        {!compact && (
          <span className="leading-tight">
            <span className="block text-xs font-semibold">{active?.title}</span>
            <span className="block text-[10px] text-white/70">{active?.person}</span>
          </span>
        )}
        <ChevronDown size={14} className="shrink-0" />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-72 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
          <div className="border-b border-slate-100 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Ganti Peran (login palsu)
          </div>
          <ul className="max-h-[60vh] overflow-y-auto py-1 thin-scroll">
            {ROLES.map((r) => {
              const Icon = ROLE_ICON[r.key]
              const isActive = r.key === currentRole
              return (
                <li key={r.key}>
                  <button
                    onClick={() => pick(r.key, r.home)}
                    className={`flex w-full items-start gap-3 px-3 py-2.5 text-left transition hover:bg-slate-50 ${isActive ? 'bg-brand-50' : ''}`}
                  >
                    <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-100 text-brand-700">
                      <Icon size={18} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-800">
                        {r.title}
                        {isActive && <Check size={14} className="text-brand-600" />}
                      </span>
                      <span className="block truncate text-xs text-slate-500">{r.blurb}</span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
