const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

export function formatDate(iso: string): string {
  const d = new Date(iso)
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso)
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${formatDate(iso)}, ${hh}:${mm}`
}

export interface SlaInfo {
  label: string
  tone: 'overdue' | 'urgent' | 'ok'
}

/** Human SLA status relative to "now" for the EHFS queue. */
export function slaInfo(dueIso: string | undefined): SlaInfo | null {
  if (!dueIso) return null
  const due = new Date(dueIso).getTime()
  const now = Date.now()
  const hrs = (due - now) / 36e5
  if (hrs < 0) return { label: `Lewat SLA ${Math.abs(Math.round(hrs / 24))} hari`, tone: 'overdue' }
  if (hrs < 24) return { label: `Sisa ${Math.round(hrs)} jam`, tone: 'urgent' }
  return { label: `Sisa ${Math.round(hrs / 24)} hari`, tone: 'ok' }
}
