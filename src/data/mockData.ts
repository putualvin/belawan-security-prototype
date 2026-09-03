import type {
  Driver,
  Location,
  RoleDef,
  Vendor,
  ViolationCase,
  ViolationCategory,
} from '../types'
import { evaluate, priorCountsFromHistory } from '../utils/ruleEngine'

// ---------------------------------------------------------------------------
// ROLES — demo accounts are filtered by the detected device class at login.
// ---------------------------------------------------------------------------
export const ROLES: RoleDef[] = [
  {
    key: 'PIC',
    title: 'PIC Pelapor',
    person: 'Budi Santoso',
    dept: 'Security / Logistik',
    blurb: 'Melaporkan pelanggaran di lapangan & mengeksekusi sanksi SP.',
    defaultMode: 'phone',
    home: '/pic',
  },
  {
    key: 'EHFS',
    title: 'EHFS Approver',
    person: 'Eko Prasetyo',
    dept: 'Environment, Health, Fire & Safety',
    blurb: 'Meninjau & menyetujui sanksi blacklist dari antrian.',
    defaultMode: 'desktop',
    home: '/ehfs',
  },
  {
    key: 'GATE',
    title: 'Security Gerbang',
    person: 'Petugas Gerbang',
    dept: 'Security — Pos Gerbang Utama',
    blurb: 'Cek cepat status supir / kendaraan: CLEAR atau BLACKLIST.',
    defaultMode: 'phone',
    home: '/gate',
  },
  {
    key: 'PROCUREMENT',
    title: 'Procurement',
    person: 'Adi Nugroho',
    dept: 'Procurement & Vendor Management',
    blurb: 'Memantau rekam jejak vendor & menindaklanjuti kontrak.',
    defaultMode: 'desktop',
    home: '/procurement',
  },
  {
    key: 'MANAGEMENT',
    title: 'Management',
    person: 'Rosniati',
    dept: 'Operational Excellence',
    blurb: 'Dashboard eksekutif: KPI, tren, & alert kritis.',
    defaultMode: 'desktop',
    home: '/management',
  },
]

// ---------------------------------------------------------------------------
// VIOLATION CATEGORIES — official sanction matrix (source of truth).
// ---------------------------------------------------------------------------
export const CATEGORIES: ViolationCategory[] = [
  {
    id: 'CAT-MANIP',
    group: 'Manipulasi Muatan',
    name: 'Bandul batu/air/orang, tangki BBM dimodifikasi',
    driverTrack: 'BLACKLIST_LANGSUNG',
    vehicleSanctions: ['BLACKLIST_TRUK', 'PENALTI_SUSUT'],
  },
  {
    id: 'CAT-KUPINGAN',
    group: 'Kupingan Mainhole',
    name: 'Las baru / patah',
    driverTrack: 'BERTAHAP_3X',
    vehicleSanctions: ['PENALTI_SUSUT'],
  },
  {
    id: 'CAT-LOCIS-NO',
    group: 'Locis',
    name: 'Beda nomor/warna, tidak terpasang baik',
    driverTrack: 'BERTAHAP_3X',
    vehicleSanctions: ['PENALTI_SUSUT'],
  },
  {
    id: 'CAT-LOCIS-TUSUK',
    group: 'Locis',
    name: 'Rusak bekas tusukan',
    driverTrack: 'BERTAHAP_3X',
    vehicleSanctions: ['PENALTI_SUSUT'],
  },
  {
    id: 'CAT-OPER',
    group: 'Truk rusak / Oper Muatan',
    name: 'Pindah muatan putus segel, kehilangan karena kecelakaan',
    driverTrack: 'NONE',
    vehicleSanctions: ['GANTI_RUGI'],
  },
  {
    id: 'CAT-TENDA',
    group: 'Tenda',
    name: 'Koyak, bisa dibuka tanpa rusak segel',
    driverTrack: 'BERTAHAP_3X',
    vehicleSanctions: ['PENALTI_SUSUT'],
  },
  {
    id: 'CAT-INDIS-SEC',
    group: 'Indisipliner',
    name: 'Melawan security / karyawan bertugas',
    driverTrack: 'BERTAHAP_2X',
    vehicleSanctions: [],
  },
  {
    id: 'CAT-INDIS-SAFETY',
    group: 'Indisipliner',
    name: 'Pelanggaran terkait safety di SMART',
    driverTrack: 'BERTAHAP_2X',
    vehicleSanctions: [],
  },
  {
    id: 'CAT-BARANG',
    group: 'Barang Terlarang',
    name: 'Bawa rokok, mancis, korek, makanan, minuman berasa',
    driverTrack: 'BERTAHAP_3X',
    vehicleSanctions: ['DENDA_500K'],
    note: 'Membawa (bukan merokok aktif) — bertahap.',
  },
  {
    id: 'CAT-MEROKOK',
    group: 'Barang Terlarang',
    name: 'Merokok (aktif)',
    driverTrack: 'BLACKLIST_LANGSUNG',
    vehicleSanctions: ['DENDA_500K'],
    note: 'Merokok aktif = blacklist langsung (risiko kebakaran).',
  },
  {
    id: 'CAT-TIPPING',
    group: 'Tipping',
    name: 'Beri uang/barang ke karyawan SMART',
    driverTrack: 'BLACKLIST_LANGSUNG',
    vehicleSanctions: ['DENDA_500K'],
  },
  {
    id: 'CAT-INSIDEN-MINOR',
    group: 'Insiden',
    name: 'Insiden minor (tabrak tiang / trotoar)',
    driverTrack: 'BERSYARAT',
    vehicleSanctions: ['GANTI_RUGI'],
  },
  {
    id: 'CAT-INSIDEN-MAJOR',
    group: 'Insiden',
    name: 'Insiden major (tabrak infrastruktur pabrik)',
    driverTrack: 'BLACKLIST_LANGSUNG',
    vehicleSanctions: ['GANTI_RUGI'],
  },
]

export const categoryById = (id: string): ViolationCategory =>
  CATEGORIES.find((c) => c.id === id)!

/** Distinct matrix groups, in declaration order. */
export const CATEGORY_GROUPS: string[] = [...new Set(CATEGORIES.map((c) => c.group))]

// ---------------------------------------------------------------------------
// LOCATIONS
// ---------------------------------------------------------------------------
export const LOCATIONS: Location[] = [
  { id: 'LOC-WB', name: 'Jembatan Timbang', area: 'Weighbridge', hasCCTV: true },
  { id: 'LOC-CPO', name: 'Area Tangki Timbun CPO', area: 'Storage', hasCCTV: true },
  { id: 'LOC-LOADING', name: 'Loading Ramp', area: 'Despatch', hasCCTV: true },
  { id: 'LOC-GATE', name: 'Pos Gerbang Utama', area: 'Security', hasCCTV: true },
  { id: 'LOC-WORKSHOP', name: 'Bengkel / Workshop', area: 'Maintenance', hasCCTV: false },
  { id: 'LOC-WAREHOUSE', name: 'Gudang Sparepart', area: 'Logistik', hasCCTV: false },
]

export const locationById = (id: string): Location =>
  LOCATIONS.find((l) => l.id === id)!

// ---------------------------------------------------------------------------
// VENDORS (8) — CV. Sejahtera Abadi pre-flagged with 22+ incidents.
// ---------------------------------------------------------------------------
export const VENDORS: Vendor[] = [
  {
    id: 'V-SEJAHTERA',
    name: 'CV. Sejahtera Abadi',
    contractNo: 'KTR-2023-014',
    status: 'flagged',
    historicalIncidents: 22,
    historicalSP: 9,
    historicalBlacklists: 3,
    note: 'Akumulasi insiden tertinggi. Belum pernah ditindak di sistem lama.',
  },
  { id: 'V-BAHARI', name: 'CV. Bahari Jaya', contractNo: 'KTR-2023-008', status: 'flagged', historicalIncidents: 8, historicalSP: 5, historicalBlacklists: 1 },
  { id: 'V-BERKAH', name: 'CV. Berkah Transport', contractNo: 'KTR-2024-002', status: 'review', historicalIncidents: 6, historicalSP: 5, historicalBlacklists: 1 },
  { id: 'V-SAMUDERA', name: 'CV. Samudera Trans', contractNo: 'KTR-2022-019', status: 'terminated', historicalIncidents: 12, historicalSP: 6, historicalBlacklists: 2, note: 'Kontrak telah diterminasi.' },
  { id: 'V-MAKMUR', name: 'PT Makmur Logistik', contractNo: 'KTR-2024-006', status: 'active', historicalIncidents: 4, historicalSP: 2, historicalBlacklists: 0 },
  { id: 'V-NUSANTARA', name: 'PT Nusantara Hauling', contractNo: 'KTR-2024-011', status: 'active', historicalIncidents: 3, historicalSP: 1, historicalBlacklists: 0 },
  { id: 'V-CAHAYA', name: 'PT Cahaya Sawit Trans', contractNo: 'KTR-2025-001', status: 'active', historicalIncidents: 2, historicalSP: 1, historicalBlacklists: 0 },
  { id: 'V-MANDIRI', name: 'PT Mandiri Angkutan', contractNo: 'KTR-2025-004', status: 'active', historicalIncidents: 1, historicalSP: 0, historicalBlacklists: 0 },
]

export const vendorById = (id: string): Vendor =>
  VENDORS.find((v) => v.id === id)!

// ---------------------------------------------------------------------------
// DRIVERS (15) — statuses & history keyed by categoryId so escalation counts.
// All KTP and phone values below are synthetic demo data.
// ---------------------------------------------------------------------------
export const DRIVERS: Driver[] = [
  {
    id: 'D-DONI',
    name: 'Doni Wijaya',
    ktp: 'DEMO-KTP-001',
    phone: '08xx-xxxx-0001',
    vendorId: 'V-SEJAHTERA',
    plates: ['BK 8024 FI'],
    status: 'blacklisted',
    statusReason: 'Blacklist permanen — manipulasi muatan + bawa rokok (KSS-2026-001).',
    history: [
      { date: '2026-04-30', categoryId: 'CAT-MANIP', group: 'Manipulasi Muatan', description: 'Bandul batu pada muatan', outcome: 'BLACKLIST', caseId: 'KSS-2026-001' },
      { date: '2026-04-30', categoryId: 'CAT-BARANG', group: 'Barang Terlarang', description: 'Membawa rokok ke area pabrik', outcome: 'SP1', caseId: 'KSS-2026-001' },
    ],
  },
  {
    id: 'D-RUDI',
    name: 'Rudi Hartono',
    ktp: 'DEMO-KTP-002',
    phone: '08xx-xxxx-0002',
    vendorId: 'V-SEJAHTERA',
    plates: ['BK 9156 XY'],
    status: 'blacklisted',
    statusReason: 'Blacklist permanen — manipulasi tangki BBM (KSS-2026-008).',
    history: [{ date: '2026-03-12', categoryId: 'CAT-MANIP', group: 'Manipulasi Muatan', description: 'Tangki BBM dimodifikasi', outcome: 'BLACKLIST', caseId: 'KSS-2026-008' }],
  },
  {
    id: 'D-AGUS',
    name: 'Agus Salim',
    ktp: 'DEMO-KTP-003',
    phone: '08xx-xxxx-0003',
    vendorId: 'V-MAKMUR',
    plates: ['BK 1023 CD'],
    status: 'sp2',
    statusReason: 'SP-2 — Locis berulang.',
    history: [
      { date: '2026-02-08', categoryId: 'CAT-LOCIS-NO', group: 'Locis', description: 'Locis beda nomor', outcome: 'SP1' },
      { date: '2026-05-20', categoryId: 'CAT-LOCIS-NO', group: 'Locis', description: 'Locis tidak terpasang baik', outcome: 'SP2', caseId: 'KSS-2026-004' },
    ],
  },
  {
    id: 'D-JOKO',
    name: 'Joko Susilo',
    ktp: 'DEMO-KTP-004',
    phone: '08xx-xxxx-0004',
    vendorId: 'V-BERKAH',
    plates: ['BK 7782 LM'],
    status: 'sp1',
    statusReason: 'SP-1 — indisipliner (melawan security).',
    history: [{ date: '2025-11-20', categoryId: 'CAT-INDIS-SEC', group: 'Indisipliner', description: 'Melawan security saat pemeriksaan', outcome: 'SP1' }],
  },
  { id: 'D-BAMBANG', name: 'Bambang Wijoyo', ktp: 'DEMO-KTP-005', phone: '08xx-xxxx-0005', vendorId: 'V-BAHARI', plates: ['BK 4421 PQ'], status: 'clear', history: [] },
  { id: 'D-EKO', name: 'Eko Saputra', ktp: 'DEMO-KTP-006', phone: '08xx-xxxx-0006', vendorId: 'V-CAHAYA', plates: ['BK 3310 RS'], status: 'clear', history: [] },
  {
    id: 'D-HENDRA',
    name: 'Hendra Gunawan',
    ktp: 'DEMO-KTP-007',
    phone: '08xx-xxxx-0007',
    vendorId: 'V-NUSANTARA',
    plates: ['BK 6654 TU'],
    status: 'sp1',
    statusReason: 'SP-1 (bersyarat) — insiden minor.',
    history: [{ date: '2026-04-15', categoryId: 'CAT-INSIDEN-MINOR', group: 'Insiden', description: 'Menabrak trotoar di area pabrik', outcome: 'SP_CONDITIONAL', caseId: 'KSS-2026-006' }],
  },
  {
    id: 'D-SLAMET',
    name: 'Slamet Riyadi',
    ktp: 'DEMO-KTP-008',
    vendorId: 'V-SAMUDERA',
    plates: ['BK 2298 VW'],
    status: 'blacklisted',
    statusReason: 'Blacklist permanen — manipulasi timbangan; vendor diterminasi.',
    history: [{ date: '2025-09-05', categoryId: 'CAT-MANIP', group: 'Manipulasi Muatan', description: 'Bandul air pada muatan', outcome: 'BLACKLIST' }],
  },
  { id: 'D-WAYAN', name: 'I Wayan Sudarma', ktp: 'DEMO-KTP-009', phone: '08xx-xxxx-0009', vendorId: 'V-MANDIRI', plates: ['BK 1145 AB'], status: 'clear', history: [] },
  { id: 'D-FAJAR', name: 'Fajar Pratama', ktp: 'DEMO-KTP-010', phone: '08xx-xxxx-0010', vendorId: 'V-MAKMUR', plates: ['BK 8890 KK'], status: 'clear', history: [] },
  {
    id: 'D-DEDI',
    name: 'Dedi Kurniawan',
    ktp: 'DEMO-KTP-011',
    phone: '08xx-xxxx-0011',
    vendorId: 'V-SEJAHTERA',
    plates: ['BK 5567 GH'],
    status: 'sp1',
    statusReason: 'SP-1 — membawa barang terlarang (rokok).',
    history: [{ date: '2026-02-22', categoryId: 'CAT-BARANG', group: 'Barang Terlarang', description: 'Membawa korek api', outcome: 'SP1' }],
  },
  { id: 'D-TONO', name: 'Tono Wibowo', ktp: 'DEMO-KTP-012', phone: '08xx-xxxx-0012', vendorId: 'V-BERKAH', plates: ['BK 3344 JK'], status: 'clear', history: [] },
  {
    id: 'D-IWAN',
    name: 'Iwan Setiawan',
    ktp: 'DEMO-KTP-013',
    vendorId: 'V-BAHARI',
    plates: ['BK 7711 MN'],
    status: 'blacklisted',
    statusReason: 'Blacklist permanen — tipping petugas (KSS-2026-010).',
    history: [{ date: '2026-05-10', categoryId: 'CAT-TIPPING', group: 'Tipping', description: 'Memberi uang ke petugas timbang', outcome: 'BLACKLIST', caseId: 'KSS-2026-010' }],
  },
  { id: 'D-PUTU', name: 'Putu Arya', ktp: 'DEMO-KTP-014', phone: '08xx-xxxx-0014', vendorId: 'V-CAHAYA', plates: ['BK 9923 OP'], status: 'clear', history: [] },
  { id: 'D-RIZAL', name: 'Rizal Effendi', ktp: 'DEMO-KTP-015', phone: '08xx-xxxx-0015', vendorId: 'V-NUSANTARA', plates: ['BK 1267 QR'], status: 'clear', history: [] },
]

export const driverById = (id: string): Driver =>
  DRIVERS.find((d) => d.id === id)!

// ---------------------------------------------------------------------------
// CASES (10) — generated from the applicable sanction matrix.
// priorBeforeCase lets a seeded case reflect history that existed *before* it.
// ---------------------------------------------------------------------------
interface CaseSeed {
  id: string
  reportedAt: string
  reporterName: string
  reporterDept: string
  locationId: string
  description: string
  driverId: string
  categoryIds: string[]
  priorBeforeCase?: Record<string, number>
  evidenceCount: number
  witnesses: string
  status: ViolationCase['status']
  slaDueAt?: string
  approval?: ViolationCase['approval']
  sanctionAt?: string
  sanctionBy?: string
  audit: ViolationCase['audit']
}

function buildCase(seed: CaseSeed): ViolationCase {
  const cats = seed.categoryIds.map(categoryById)
  const result = evaluate(cats, seed.priorBeforeCase ?? {})
  const driver = driverById(seed.driverId)
  const vendor = vendorById(driver.vendorId)
  const vendorFlagged = vendor.historicalIncidents + 1 >= 5

  const base: ViolationCase = {
    id: seed.id,
    reportedAt: seed.reportedAt,
    reporterName: seed.reporterName,
    reporterDept: seed.reporterDept,
    locationId: seed.locationId,
    description: seed.description,
    driverId: seed.driverId,
    vehiclePlate: driver.plates[0],
    categoryIds: seed.categoryIds,
    evidenceCount: seed.evidenceCount,
    witnesses: seed.witnesses,
    driverOutcome: result.driverOutcome,
    driverOutcomeLabel: result.driverLabel,
    vehicleSanctions: result.vehicleSanctions,
    reasoning: result.reasoning,
    routing: result.routing,
    status: seed.status,
    slaDueAt: seed.slaDueAt,
    vendorFlagged,
    approval: seed.approval,
    audit: seed.audit,
  }

  if ((seed.status === 'sanctioned' || seed.status === 'closed') && seed.sanctionAt) {
    base.sanction = {
      driverOutcome: result.driverOutcome,
      driverLabel: result.driverLabel,
      vehicleSanctions: result.vehicleSanctions,
      issuedAt: seed.sanctionAt,
      issuedBy: seed.sanctionBy ?? 'Sistem',
    }
  }
  return base
}

const CASE_SEEDS: CaseSeed[] = [
  {
    id: 'KSS-2026-001',
    reportedAt: '2026-04-30T09:15:00',
    reporterName: 'Siti Rahma',
    reporterDept: 'Logistik',
    locationId: 'LOC-WB',
    description: 'Supir kedapatan memasang bandul batu pada muatan dan membawa rokok ke area pabrik dalam satu kejadian dengan lebih dari satu kategori pelanggaran.',
    driverId: 'D-DONI',
    categoryIds: ['CAT-BARANG', 'CAT-MANIP'],
    evidenceCount: 4,
    witnesses: 'Petugas timbang (2 orang), rekaman CCTV',
    status: 'sanctioned',
    sanctionAt: '2026-05-02T10:35:00',
    sanctionBy: 'Eko Prasetyo (EHFS)',
    approval: { decision: 'approved', decidedBy: 'Eko Prasetyo (EHFS)', decidedAt: '2026-05-02T10:30:00', comment: 'Disetujui. Manipulasi muatan = blacklist langsung.' },
    audit: [
      { at: '2026-04-30T09:15:00', actor: 'Siti Rahma (PIC Logistik)', action: 'Membuat laporan' },
      { at: '2026-04-30T09:16:00', actor: 'Sistem', action: 'Penetapan sanksi berdasarkan matriks: manipulasi muatan → blacklist langsung' },
      { at: '2026-05-02T10:35:00', actor: 'Eko Prasetyo (EHFS)', action: 'Menyetujui & menerbitkan blacklist permanen' },
    ],
  },
  {
    id: 'KSS-2026-002',
    reportedAt: '2026-05-26T13:40:00',
    reporterName: 'Budi Santoso',
    reporterDept: 'Security',
    locationId: 'LOC-CPO',
    description: 'Supir kedapatan merokok aktif di area tangki timbun CPO.',
    driverId: 'D-BAMBANG',
    categoryIds: ['CAT-MEROKOK'],
    evidenceCount: 2,
    witnesses: 'Petugas K3',
    status: 'in_review',
    slaDueAt: '2026-05-28T13:40:00',
    audit: [
      { at: '2026-05-26T13:40:00', actor: 'Budi Santoso (PIC Security)', action: 'Membuat laporan' },
      { at: '2026-05-26T13:41:00', actor: 'Sistem', action: 'Merokok aktif → blacklist langsung → antrian EHFS' },
    ],
  },
  {
    id: 'KSS-2026-003',
    reportedAt: '2026-05-27T08:05:00',
    reporterName: 'Budi Santoso',
    reporterDept: 'Security',
    locationId: 'LOC-WB',
    description: 'Ditemukan bandul air pada muatan saat penimbangan.',
    driverId: 'D-DEDI',
    categoryIds: ['CAT-MANIP'],
    evidenceCount: 3,
    witnesses: 'Operator timbang, CCTV',
    status: 'in_review',
    slaDueAt: '2026-05-29T08:05:00',
    audit: [
      { at: '2026-05-27T08:05:00', actor: 'Budi Santoso (PIC Security)', action: 'Membuat laporan' },
      { at: '2026-05-27T08:06:00', actor: 'Sistem', action: 'Manipulasi muatan → blacklist langsung → antrian EHFS' },
    ],
  },
  {
    id: 'KSS-2026-004',
    reportedAt: '2026-05-20T11:20:00',
    reporterName: 'Siti Rahma',
    reporterDept: 'Logistik',
    locationId: 'LOC-LOADING',
    description: 'Locis tidak terpasang dengan baik saat pemeriksaan (kejadian kedua).',
    driverId: 'D-AGUS',
    categoryIds: ['CAT-LOCIS-NO'],
    priorBeforeCase: { 'CAT-LOCIS-NO': 1 },
    evidenceCount: 1,
    witnesses: 'Petugas loading',
    status: 'sanctioned',
    sanctionAt: '2026-05-20T11:45:00',
    sanctionBy: 'Siti Rahma (PIC Logistik)',
    audit: [
      { at: '2026-05-20T11:20:00', actor: 'Siti Rahma (PIC Logistik)', action: 'Membuat laporan' },
      { at: '2026-05-20T11:45:00', actor: 'Siti Rahma (PIC Logistik)', action: 'Eksekusi langsung sanksi SP-2 (kejadian ke-2)' },
    ],
  },
  {
    id: 'KSS-2026-005',
    reportedAt: '2026-05-28T07:50:00',
    reporterName: 'Budi Santoso',
    reporterDept: 'Security',
    locationId: 'LOC-GATE',
    description: 'Locis ditemukan rusak bekas tusukan saat pemeriksaan gerbang.',
    driverId: 'D-EKO',
    categoryIds: ['CAT-LOCIS-TUSUK'],
    evidenceCount: 1,
    witnesses: 'Petugas gerbang',
    status: 'open',
    audit: [{ at: '2026-05-28T07:50:00', actor: 'Budi Santoso (PIC Security)', action: 'Membuat laporan' }],
  },
  {
    id: 'KSS-2026-006',
    reportedAt: '2026-04-15T14:10:00',
    reporterName: 'Siti Rahma',
    reporterDept: 'Logistik',
    locationId: 'LOC-GATE',
    description: 'Kendaraan menabrak trotoar di area pabrik (insiden minor).',
    driverId: 'D-HENDRA',
    categoryIds: ['CAT-INSIDEN-MINOR'],
    evidenceCount: 2,
    witnesses: 'Petugas gerbang',
    status: 'closed',
    sanctionAt: '2026-04-15T14:40:00',
    sanctionBy: 'Siti Rahma (PIC Logistik)',
    audit: [
      { at: '2026-04-15T14:10:00', actor: 'Siti Rahma (PIC Logistik)', action: 'Membuat laporan' },
      { at: '2026-04-15T14:40:00', actor: 'Siti Rahma (PIC Logistik)', action: 'Eksekusi SP-1 (bersyarat) + ganti rugi' },
      { at: '2026-04-22T09:00:00', actor: 'Sistem', action: 'Ganti rugi dibayar — kasus ditutup' },
    ],
  },
  {
    id: 'KSS-2026-007',
    reportedAt: '2026-05-18T16:30:00',
    reporterName: 'Budi Santoso',
    reporterDept: 'Security',
    locationId: 'LOC-WB',
    description: 'Dugaan pemberian uang kepada petugas timbang (tipping).',
    driverId: 'D-FAJAR',
    categoryIds: ['CAT-TIPPING'],
    evidenceCount: 0,
    witnesses: '-',
    status: 'rejected',
    approval: { decision: 'rejected', decidedBy: 'Eko Prasetyo (EHFS)', decidedAt: '2026-05-19T09:20:00', comment: 'Bukti tidak memadai. Tidak ada rekaman maupun saksi. Ditolak.' },
    audit: [
      { at: '2026-05-18T16:30:00', actor: 'Budi Santoso (PIC Security)', action: 'Membuat laporan' },
      { at: '2026-05-19T09:20:00', actor: 'Eko Prasetyo (EHFS)', action: 'Menolak laporan (bukti tidak memadai)' },
    ],
  },
  {
    id: 'KSS-2026-008',
    reportedAt: '2026-03-12T05:40:00',
    reporterName: 'Budi Santoso',
    reporterDept: 'Security',
    locationId: 'LOC-WB',
    description: 'Tangki BBM truk dimodifikasi untuk menyembunyikan muatan.',
    driverId: 'D-RUDI',
    categoryIds: ['CAT-MANIP'],
    evidenceCount: 3,
    witnesses: 'Patroli, CCTV',
    status: 'sanctioned',
    sanctionAt: '2026-03-13T08:05:00',
    sanctionBy: 'Eko Prasetyo (EHFS)',
    approval: { decision: 'approved', decidedBy: 'Eko Prasetyo (EHFS)', decidedAt: '2026-03-13T08:00:00' },
    audit: [
      { at: '2026-03-12T05:40:00', actor: 'Budi Santoso (PIC Security)', action: 'Membuat laporan' },
      { at: '2026-03-13T08:05:00', actor: 'Eko Prasetyo (EHFS)', action: 'Menyetujui & blacklist permanen' },
    ],
  },
  {
    id: 'KSS-2026-009',
    reportedAt: '2026-05-27T15:00:00',
    reporterName: 'Siti Rahma',
    reporterDept: 'Logistik',
    locationId: 'LOC-LOADING',
    description: 'Supir melawan petugas security saat ditegur (kejadian indisipliner kedua).',
    driverId: 'D-JOKO',
    categoryIds: ['CAT-INDIS-SEC'],
    priorBeforeCase: { 'CAT-INDIS-SEC': 1 },
    evidenceCount: 2,
    witnesses: 'Petugas security',
    status: 'in_review',
    slaDueAt: '2026-05-29T15:00:00',
    audit: [
      { at: '2026-05-27T15:00:00', actor: 'Siti Rahma (PIC Logistik)', action: 'Membuat laporan' },
      { at: '2026-05-27T15:01:00', actor: 'Sistem', action: 'Indisipliner bertahap 2× → kejadian ke-2 → blacklist → antrian EHFS' },
    ],
  },
  {
    id: 'KSS-2026-010',
    reportedAt: '2026-05-10T10:25:00',
    reporterName: 'Budi Santoso',
    reporterDept: 'Security',
    locationId: 'LOC-WB',
    description: 'Supir memberi uang kepada petugas timbang (tipping).',
    driverId: 'D-IWAN',
    categoryIds: ['CAT-TIPPING'],
    evidenceCount: 2,
    witnesses: 'Petugas K3',
    status: 'sanctioned',
    sanctionAt: '2026-05-11T09:05:00',
    sanctionBy: 'Eko Prasetyo (EHFS)',
    approval: { decision: 'approved', decidedBy: 'Eko Prasetyo (EHFS)', decidedAt: '2026-05-11T09:00:00', comment: 'Tipping = blacklist langsung.' },
    audit: [
      { at: '2026-05-10T10:25:00', actor: 'Budi Santoso (PIC Security)', action: 'Membuat laporan' },
      { at: '2026-05-11T09:05:00', actor: 'Eko Prasetyo (EHFS)', action: 'Menyetujui & blacklist permanen' },
    ],
  },
]

export function buildInitialCases(): ViolationCase[] {
  return CASE_SEEDS.map(buildCase)
}

// Re-export so callers can derive prior counts without importing the engine.
export { priorCountsFromHistory }
