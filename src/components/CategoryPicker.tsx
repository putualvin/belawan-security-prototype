import { Check, Info, Truck, User } from 'lucide-react'
import { CATEGORIES, CATEGORY_GROUPS } from '../data/mockData'
import { DRIVER_TRACK_SHORT, VEHICLE_SANCTION_LABEL } from '../utils/ruleEngine'

interface Props {
  selected: string[]
  onToggle: (id: string) => void
}

export function CategoryPicker({ selected, onToggle }: Props) {
  return (
    <div className="space-y-4">
      {CATEGORY_GROUPS.map((group) => {
        const cats = CATEGORIES.filter((c) => c.group === group)
        return (
          <div key={group}>
            <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">{group}</p>
            <div className="space-y-1.5">
              {cats.map((c) => {
                const on = selected.includes(c.id)
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => onToggle(c.id)}
                    className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition ${
                      on ? 'border-brand-500 bg-brand-50' : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <span
                      className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border ${
                        on ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300'
                      }`}
                    >
                      {on && <Check size={14} />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-slate-800">{c.name}</span>
                      <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          <User size={11} /> Supir: {DRIVER_TRACK_SHORT[c.driverTrack]}
                        </span>
                        {c.vehicleSanctions.length > 0 && (
                          <span className="inline-flex items-center gap-1">
                            <Truck size={11} /> {c.vehicleSanctions.map((v) => VEHICLE_SANCTION_LABEL[v]).join(', ')}
                          </span>
                        )}
                      </span>
                      {c.note && (
                        <span className="mt-0.5 flex items-center gap-1 text-[11px] text-amber-600">
                          <Info size={11} /> {c.note}
                        </span>
                      )}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
