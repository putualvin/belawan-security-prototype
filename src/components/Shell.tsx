import { NavLink, Outlet } from 'react-router-dom'
import {
  AlertTriangle,
  BarChart3,
  Home,
  Inbox,
  PlusCircle,
  ScanLine,
  Truck,
} from 'lucide-react'
import type { RoleKey } from '../types'
import { useStore } from '../store/useStore'
import { ROLES } from '../data/mockData'
import { RoleSwitcher } from './RoleSwitcher'
import { NotificationBell } from './NotificationBell'
import { ROLE_ICON } from './roleIcons'

interface NavItem {
  to: string
  label: string
  icon: typeof Home
  end?: boolean
}

const NAV: Record<RoleKey, NavItem[]> = {
  PIC: [
    { to: '/pic', label: 'Laporan Saya', icon: Home, end: true },
    { to: '/report', label: 'Lapor', icon: PlusCircle },
  ],
  GATE: [
    { to: '/gate', label: 'Cek Status', icon: ScanLine, end: true },
    { to: '/report', label: 'Lapor Insiden', icon: AlertTriangle },
  ],
  EHFS: [{ to: '/ehfs', label: 'Antrian Persetujuan', icon: Inbox, end: true }],
  PROCUREMENT: [{ to: '/procurement', label: 'Vendor', icon: Truck, end: true }],
  MANAGEMENT: [{ to: '/management', label: 'Dashboard', icon: BarChart3, end: true }],
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/15 font-extrabold text-white">
        SM
      </div>
      <div className="leading-tight">
        <p className={`font-bold text-white ${compact ? 'text-sm' : 'text-sm'}`}>PT SMART Tbk Belawan</p>
        <p className="text-[10px] text-white/70">Sistem Pelaporan Pelanggaran</p>
      </div>
    </div>
  )
}

export function Shell() {
  const currentRole = useStore((s) => s.currentRole)!
  const deviceMode = useStore((s) => s.deviceMode)
  const role = ROLES.find((r) => r.key === currentRole)!
  const nav = NAV[currentRole]
  const RoleIcon = ROLE_ICON[currentRole]

  // -------------------------------------------------------------- PHONE
  if (deviceMode === 'phone') {
    return (
      <div className="flex min-h-[100dvh] w-full justify-center bg-slate-300 sm:py-6">
        <div className="flex h-[100dvh] w-full flex-col overflow-hidden bg-slate-50 sm:h-[860px] sm:max-h-[92vh] sm:w-[400px] sm:rounded-[2.2rem] sm:border-[10px] sm:border-slate-900 sm:shadow-2xl">
          <header className="sticky top-0 z-20 flex items-center justify-between gap-2 bg-brand-800 px-3 py-2.5">
            <Brand compact />
            <div className="flex items-center gap-1">
              <NotificationBell />
              <RoleSwitcher compact />
            </div>
          </header>

          <main className="flex-1 overflow-y-auto thin-scroll">
            <Outlet />
          </main>

          <nav className="z-20 grid shrink-0 grid-flow-col border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)]">
            {nav.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold transition ${
                      isActive ? 'text-brand-700' : 'text-slate-400'
                    }`
                  }
                >
                  <Icon size={22} />
                  {item.label}
                </NavLink>
              )
            })}
          </nav>
        </div>
      </div>
    )
  }

  // ------------------------------------------------------------- DESKTOP
  return (
    <div className="flex min-h-[100dvh] bg-slate-100">
      <aside className="sticky top-0 flex h-[100dvh] w-64 shrink-0 flex-col bg-brand-900">
        <div className="border-b border-white/10 px-4 py-4">
          <Brand />
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {nav.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                    isActive ? 'bg-white/15 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                <Icon size={18} />
                {item.label}
              </NavLink>
            )
          })}
        </nav>

        <div className="m-3 rounded-xl bg-white/10 p-3 text-white">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/15">
              <RoleIcon size={18} />
            </span>
            <div className="min-w-0 leading-tight">
              <p className="truncate text-sm font-semibold">{role.person}</p>
              <p className="truncate text-[11px] text-white/70">{role.title}</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 bg-brand-800 px-6 py-3">
          <div className="leading-tight">
            <p className="text-sm font-semibold text-white">{role.title}</p>
            <p className="text-[11px] text-white/70">{role.dept}</p>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <RoleSwitcher />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-5 lg:p-7 thin-scroll">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
