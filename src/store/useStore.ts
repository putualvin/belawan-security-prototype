import { create } from 'zustand'
import type {
  DeviceMode,
  Driver,
  DriverOutcome,
  DriverStatus,
  RoleKey,
  Vendor,
  VendorStatus,
  ViolationCase,
} from '../types'
import {
  buildInitialCases,
  categoryById,
  DRIVERS,
  VENDORS,
} from '../data/mockData'
import {
  DRIVER_OUTCOME_LABEL,
  evaluate,
  priorCountsFromHistory,
  VENDOR_FLAG_THRESHOLD,
  type CategoryEval,
} from '../utils/ruleEngine'

export interface AppNotification {
  id: string
  audience: RoleKey
  text: string
  at: string
  read: boolean
}

export interface NewCaseInput {
  reporterName: string
  reporterDept: string
  locationId: string
  description: string
  driverId: string
  categoryIds: string[]
  evidenceCount: number
  witnesses: string
}

export interface NewDriverInput {
  name: string
  ktp: string
  vendorId: string
  plate: string
}

interface AppState {
  currentRole: RoleKey | null
  deviceMode: DeviceMode
  cases: ViolationCase[]
  drivers: Driver[]
  vendors: Vendor[]
  notifications: AppNotification[]

  setRole: (role: RoleKey) => void
  clearRole: () => void
  setDeviceMode: (mode: DeviceMode) => void
  toggleDeviceMode: () => void
  resetDemo: () => void

  addCase: (input: NewCaseInput) => string
  addDriver: (input: NewDriverInput) => string
  approveCase: (caseId: string, comment: string, adjustedCategoryIds?: string[]) => void
  rejectCase: (caseId: string, comment: string) => void
  executeCase: (caseId: string, issuedBy: string) => void
  closeCase: (caseId: string) => void
  setVendorStatus: (vendorId: string, status: VendorStatus) => void
  markNotificationsRead: (audience: RoleKey) => void
}

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T

const initialDeviceMode = (): DeviceMode =>
  typeof window !== 'undefined' && window.innerWidth < 768 ? 'phone' : 'desktop'

function nextCaseId(cases: ViolationCase[]): string {
  const max = cases.reduce((m, c) => {
    const n = Number(c.id.split('-').pop())
    return Number.isFinite(n) && n > m ? n : m
  }, 0)
  return `KSS-2026-${String(max + 1).padStart(3, '0')}`
}

function addDays(iso: string, days: number): string {
  const d = new Date(iso)
  d.setDate(d.getDate() + days)
  return d.toISOString()
}

const STATUS_RANK: Record<DriverStatus, number> = { clear: 0, sp1: 1, sp2: 2, blacklisted: 3 }

function outcomeToStatus(outcome: DriverOutcome): DriverStatus | null {
  switch (outcome) {
    case 'BLACKLIST':
      return 'blacklisted'
    case 'SP2':
      return 'sp2'
    case 'SP1':
    case 'SP_CONDITIONAL':
      return 'sp1'
    case 'NONE':
      return null
  }
}

/** Apply a case's resolved outcome to the driver: per-category history + status. */
function applyOutcome(
  drivers: Driver[],
  driverId: string,
  perCategory: CategoryEval[],
  caseOutcome: DriverOutcome,
  date: string,
  caseId: string,
): Driver[] {
  return drivers.map((d) => {
    if (d.id !== driverId) return d
    const next: Driver = clone(d)
    const newHistory = perCategory
      .filter((e) => e.outcome !== 'NONE')
      .map((e) => ({
        date: date.slice(0, 10),
        categoryId: e.categoryId,
        group: e.group,
        description: e.name,
        outcome: e.outcome,
        caseId,
      }))
    next.history = [...newHistory, ...next.history]

    const mapped = outcomeToStatus(caseOutcome)
    if (mapped && STATUS_RANK[mapped] > STATUS_RANK[next.status]) {
      next.status = mapped
      const driver = perCategory.find((e) => e.outcome === caseOutcome)
      next.statusReason = `${DRIVER_OUTCOME_LABEL[caseOutcome]}${driver ? ` — ${driver.name}` : ''}`
    }
    return next
  })
}

function flagVendorIfNeeded(vendors: Vendor[], cases: ViolationCase[], drivers: Driver[], vendorId: string): Vendor[] {
  const live = cases.filter((c) => {
    const drv = drivers.find((d) => d.id === c.driverId)
    return drv?.vendorId === vendorId
  }).length
  return vendors.map((v) => {
    if (v.id !== vendorId) return v
    if (v.historicalIncidents + live >= VENDOR_FLAG_THRESHOLD && v.status === 'active') {
      return { ...v, status: 'flagged' as VendorStatus }
    }
    return v
  })
}

export const useStore = create<AppState>((set, get) => ({
  currentRole: null,
  deviceMode: initialDeviceMode(),
  cases: buildInitialCases(),
  drivers: clone(DRIVERS),
  vendors: clone(VENDORS),
  notifications: [],

  setRole: (role) =>
    set(() => ({
      currentRole: role,
      deviceMode:
        window.innerWidth < 768
          ? 'phone'
          : role === 'PIC' || role === 'GATE'
            ? 'phone'
            : 'desktop',
    })),

  clearRole: () => set({ currentRole: null }),
  setDeviceMode: (mode) => set({ deviceMode: mode }),
  toggleDeviceMode: () => set((s) => ({ deviceMode: s.deviceMode === 'phone' ? 'desktop' : 'phone' })),

  resetDemo: () =>
    set({
      cases: buildInitialCases(),
      drivers: clone(DRIVERS),
      vendors: clone(VENDORS),
      notifications: [],
    }),

  addDriver: (input) => {
    const state = get()
    const seq = state.drivers.length + 1
    const id = `D-NEW-${seq}`
    const driver: Driver = {
      id,
      name: input.name.trim(),
      ktp: input.ktp.trim(),
      vendorId: input.vendorId,
      plates: [input.plate.trim().toUpperCase()],
      status: 'clear',
      history: [],
    }
    set({ drivers: [...state.drivers, driver] })
    return id
  },

  addCase: (input) => {
    const state = get()
    const cats = input.categoryIds.map(categoryById)
    const driver = state.drivers.find((d) => d.id === input.driverId)!
    const prior = priorCountsFromHistory(driver.history)
    const result = evaluate(cats, prior)
    const now = new Date().toISOString()
    const id = nextCaseId(state.cases)

    const vendorLive = state.cases.filter((c) => {
      const drv = state.drivers.find((d) => d.id === c.driverId)
      return drv?.vendorId === driver.vendorId
    }).length
    const vendor = state.vendors.find((v) => v.id === driver.vendorId)!
    const vendorFlagged = vendor.historicalIncidents + vendorLive + 1 >= VENDOR_FLAG_THRESHOLD

    const base: ViolationCase = {
      id,
      reportedAt: now,
      reporterName: input.reporterName,
      reporterDept: input.reporterDept,
      locationId: input.locationId,
      description: input.description,
      driverId: input.driverId,
      vehiclePlate: driver.plates[0] ?? '-',
      categoryIds: input.categoryIds,
      evidenceCount: input.evidenceCount,
      witnesses: input.witnesses,
      driverOutcome: result.driverOutcome,
      driverOutcomeLabel: result.driverLabel,
      vehicleSanctions: result.vehicleSanctions,
      reasoning: result.reasoning,
      routing: result.routing,
      status: 'open',
      vendorFlagged,
      audit: [{ at: now, actor: `${input.reporterName} (PIC ${input.reporterDept})`, action: 'Membuat laporan' }],
    }

    let drivers = state.drivers
    const notifications = [...state.notifications]

    if (result.routing === 'PIC_DIRECT') {
      base.status = 'sanctioned'
      base.sanction = {
        driverOutcome: result.driverOutcome,
        driverLabel: result.driverLabel,
        vehicleSanctions: result.vehicleSanctions,
        issuedAt: now,
        issuedBy: `${input.reporterName} (PIC ${input.reporterDept})`,
      }
      base.audit.push({
        at: now,
        actor: `${input.reporterName} (PIC ${input.reporterDept})`,
        action: `Eksekusi langsung — ${result.driverLabel}`,
      })
      drivers = applyOutcome(drivers, driver.id, result.perCategory, result.driverOutcome, now, id)
    } else {
      base.status = 'in_review'
      base.slaDueAt = addDays(now, 2)
      base.audit.push({ at: now, actor: 'Sistem', action: 'Berujung blacklist → diteruskan ke antrian EHFS' })
      notifications.push({
        id: `N-${id}`,
        audience: 'EHFS',
        text: `Laporan baru ${id} menunggu persetujuan blacklist.`,
        at: now,
        read: false,
      })
    }

    let vendors = state.vendors
    if (vendorFlagged) {
      vendors = vendors.map((v) =>
        v.id === driver.vendorId && v.status === 'active' ? { ...v, status: 'flagged' as VendorStatus } : v,
      )
      notifications.push({
        id: `NV-${id}`,
        audience: 'PROCUREMENT',
        text: `Vendor ${vendor.name} ter-flag akibat akumulasi insiden.`,
        at: now,
        read: false,
      })
    }

    set({ cases: [base, ...state.cases], drivers, vendors, notifications })
    return id
  },

  approveCase: (caseId, comment, adjustedCategoryIds) =>
    set((state) => {
      const now = new Date().toISOString()
      const actor = 'Eko Prasetyo (EHFS)'
      let drivers = state.drivers
      let vendors = state.vendors

      const cases = state.cases.map((c) => {
        if (c.id !== caseId) return c
        const catIds = adjustedCategoryIds?.length ? adjustedCategoryIds : c.categoryIds
        const driver = state.drivers.find((d) => d.id === c.driverId)!
        const prior = priorCountsFromHistory(driver.history)
        const result = evaluate(catIds.map(categoryById), prior)
        drivers = applyOutcome(drivers, c.driverId, result.perCategory, result.driverOutcome, now, c.id)
        vendors = flagVendorIfNeeded(vendors, state.cases, state.drivers, driver.vendorId)
        return {
          ...c,
          categoryIds: catIds,
          driverOutcome: result.driverOutcome,
          driverOutcomeLabel: result.driverLabel,
          vehicleSanctions: result.vehicleSanctions,
          reasoning: result.reasoning,
          status: 'sanctioned' as const,
          approval: {
            decision: 'approved' as const,
            decidedBy: actor,
            decidedAt: now,
            comment,
            adjustedCategoryIds: adjustedCategoryIds?.length ? adjustedCategoryIds : undefined,
          },
          sanction: {
            driverOutcome: result.driverOutcome,
            driverLabel: result.driverLabel,
            vehicleSanctions: result.vehicleSanctions,
            issuedAt: now,
            issuedBy: actor,
          },
          audit: [
            ...c.audit,
            ...(adjustedCategoryIds?.length ? [{ at: now, actor, action: 'Menyesuaikan kategori pelanggaran' }] : []),
            { at: now, actor, action: `Menyetujui & menerbitkan sanksi — ${result.driverLabel}` },
          ],
        }
      })

      const notifications = [
        ...state.notifications,
        { id: `NA-${caseId}-${Date.now()}`, audience: 'PIC' as RoleKey, text: `Laporan ${caseId} disetujui EHFS.`, at: now, read: false },
      ]
      return { cases, drivers, vendors, notifications }
    }),

  rejectCase: (caseId, comment) =>
    set((state) => {
      const now = new Date().toISOString()
      const actor = 'Eko Prasetyo (EHFS)'
      const cases = state.cases.map((c) =>
        c.id === caseId
          ? {
              ...c,
              status: 'rejected' as const,
              approval: { decision: 'rejected' as const, decidedBy: actor, decidedAt: now, comment },
              audit: [...c.audit, { at: now, actor, action: 'Menolak laporan' }],
            }
          : c,
      )
      const notifications = [
        ...state.notifications,
        { id: `NR-${caseId}-${Date.now()}`, audience: 'PIC' as RoleKey, text: `Laporan ${caseId} ditolak EHFS.`, at: now, read: false },
      ]
      return { cases, notifications }
    }),

  executeCase: (caseId, issuedBy) =>
    set((state) => {
      const now = new Date().toISOString()
      let drivers = state.drivers
      const cases = state.cases.map((c) => {
        if (c.id !== caseId) return c
        const driver = state.drivers.find((d) => d.id === c.driverId)!
        const prior = priorCountsFromHistory(driver.history)
        const result = evaluate(c.categoryIds.map(categoryById), prior)
        drivers = applyOutcome(drivers, c.driverId, result.perCategory, result.driverOutcome, now, c.id)
        return {
          ...c,
          status: 'sanctioned' as const,
          sanction: {
            driverOutcome: result.driverOutcome,
            driverLabel: result.driverLabel,
            vehicleSanctions: result.vehicleSanctions,
            issuedAt: now,
            issuedBy,
          },
          audit: [...c.audit, { at: now, actor: issuedBy, action: `Eksekusi langsung — ${result.driverLabel}` }],
        }
      })
      return { cases, drivers }
    }),

  closeCase: (caseId) =>
    set((state) => ({
      cases: state.cases.map((c) =>
        c.id === caseId
          ? { ...c, status: 'closed' as const, audit: [...c.audit, { at: new Date().toISOString(), actor: 'Sistem', action: 'Kasus ditutup' }] }
          : c,
      ),
    })),

  setVendorStatus: (vendorId, status) =>
    set((state) => ({ vendors: state.vendors.map((v) => (v.id === vendorId ? { ...v, status } : v)) })),

  markNotificationsRead: (audience) =>
    set((state) => ({
      notifications: state.notifications.map((n) => (n.audience === audience ? { ...n, read: true } : n)),
    })),
}))
