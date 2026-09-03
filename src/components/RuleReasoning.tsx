import { Scale, Truck, User, UserCheck } from 'lucide-react'
import type { DriverOutcome, Routing, VehicleSanction } from '../types'
import { DriverOutcomeBadge, VehicleSanctionBadge } from './Badges'

interface Props {
  driverOutcome: DriverOutcome
  vehicleSanctions: VehicleSanction[]
  reasoning: string[]
  routing: Routing
}

/** Displays the basis for the sanction decision. */
export function RuleReasoning({ driverOutcome, vehicleSanctions, reasoning, routing }: Props) {
  return (
    <div className="overflow-hidden rounded-2xl border border-brand-200 bg-brand-50">
      <div className="flex items-center gap-2 border-b border-brand-200 bg-brand-100/60 px-4 py-2.5">
        <Scale size={16} className="text-brand-700" />
        <span className="text-sm font-bold text-brand-800">Dasar Penetapan Sanksi</span>
      </div>

      <div className="space-y-3 p-4">
        {/* Two parallel sanction tracks */}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div className="rounded-xl bg-white p-3 ring-1 ring-slate-200">
            <p className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-400">
              <User size={13} /> Sanksi Supir
            </p>
            <DriverOutcomeBadge outcome={driverOutcome} />
          </div>
          <div className="rounded-xl bg-white p-3 ring-1 ring-slate-200">
            <p className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-400">
              <Truck size={13} /> Sanksi Angkutan
            </p>
            {vehicleSanctions.length === 0 ? (
              <span className="text-sm text-slate-400">Tidak ada</span>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {vehicleSanctions.map((v) => (
                  <VehicleSanctionBadge key={v} sanction={v} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Reasoning steps */}
        <ol className="space-y-1.5">
          {reasoning.map((step, i) => (
            <li key={i} className="flex gap-2 text-sm text-slate-700">
              <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-200 text-[11px] font-bold text-brand-800">
                {i + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>

        {/* Routing */}
        <div
          className={`flex items-start gap-2 rounded-xl p-3 text-sm ${
            routing === 'APPROVAL'
              ? 'bg-orange-50 text-orange-800 ring-1 ring-orange-200'
              : 'bg-green-50 text-green-800 ring-1 ring-green-200'
          }`}
        >
          <UserCheck size={18} className="mt-0.5 shrink-0" />
          <span>
            <span className="font-semibold">Tindak lanjut: </span>
            {routing === 'APPROVAL'
              ? 'Berujung blacklist → wajib persetujuan EHFS (SLA 2 hari kerja).'
              : 'Tanpa blacklist → dapat dieksekusi langsung oleh PIC.'}
          </span>
        </div>
      </div>
    </div>
  )
}
