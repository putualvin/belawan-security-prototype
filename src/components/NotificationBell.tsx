import { useEffect, useRef, useState } from 'react'
import { Bell } from 'lucide-react'
import { useStore } from '../store/useStore'
import { formatDateTime } from '../utils/format'

export function NotificationBell() {
  const currentRole = useStore((s) => s.currentRole)
  const notifications = useStore((s) => s.notifications)
  const markRead = useStore((s) => s.markNotificationsRead)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const mine = notifications.filter((n) => n.audience === currentRole)
  const unread = mine.filter((n) => !n.read).length

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const toggle = () => {
    const next = !open
    setOpen(next)
    if (next && currentRole && unread > 0) markRead(currentRole)
  }

  return (
    <div className="relative" ref={ref}>
      <button onClick={toggle} className="relative grid h-9 w-9 place-items-center rounded-xl text-white transition hover:bg-white/10">
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-72 overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-800 shadow-xl">
          <div className="border-b border-slate-100 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Notifikasi
          </div>
          {mine.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-slate-400">Belum ada notifikasi.</p>
          ) : (
            <ul className="max-h-80 overflow-y-auto thin-scroll">
              {[...mine].reverse().map((n) => (
                <li key={n.id} className="border-b border-slate-50 px-3 py-2.5 last:border-0">
                  <p className="text-sm text-slate-700">{n.text}</p>
                  <p className="mt-0.5 text-[11px] text-slate-400">{formatDateTime(n.at)}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
