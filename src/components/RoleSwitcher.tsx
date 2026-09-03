import { useNavigate } from 'react-router-dom'
import { LogOut, Users } from 'lucide-react'
import { useStore } from '../store/useStore'
import { ROLES } from '../data/mockData'

export function RoleSwitcher({ compact = false }: { compact?: boolean }) {
  const currentRole = useStore((s) => s.currentRole)
  const clearRole = useStore((s) => s.clearRole)
  const navigate = useNavigate()
  const active = ROLES.find((r) => r.key === currentRole)

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => {
          clearRole()
          navigate('/')
        }}
        className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-2.5 py-1.5 text-left text-white transition hover:bg-white/20"
        title="Keluar"
      >
        <Users size={16} className="shrink-0" />
        {!compact && active && (
          <span className="leading-tight">
            <span className="block text-xs font-semibold">{active.title}</span>
            <span className="block text-[10px] text-white/70">{active.person}</span>
          </span>
        )}
        <LogOut size={14} className="shrink-0" />
        {!compact && <span className="text-xs font-semibold">Keluar</span>}
      </button>
    </div>
  )
}
