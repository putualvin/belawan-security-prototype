import { ClipboardList, ShieldCheck, ScanLine, Truck, BarChart3 } from 'lucide-react'
import type { RoleKey } from '../types'

export const ROLE_ICON: Record<RoleKey, typeof ClipboardList> = {
  PIC: ClipboardList,
  EHFS: ShieldCheck,
  GATE: ScanLine,
  PROCUREMENT: Truck,
  MANAGEMENT: BarChart3,
}
