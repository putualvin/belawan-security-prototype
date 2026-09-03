import type { ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useStore } from './store/useStore'
import { Shell } from './components/Shell'
import { Landing } from './pages/Landing'
import { PicDashboard } from './pages/pic/PicDashboard'
import { ReportWizard } from './pages/ReportWizard'
import { CaseDetail } from './pages/CaseDetail'
import { EhfsQueue } from './pages/ehfs/EhfsQueue'
import { GateSearch } from './pages/gate/GateSearch'
import { GateReentryReport } from './pages/gate/GateReentryReport'
import { ProcurementDashboard } from './pages/procurement/ProcurementDashboard'
import { VendorDetail } from './pages/procurement/VendorDetail'
import { ManagementDashboard } from './pages/management/ManagementDashboard'
import type { RoleKey } from './types'
import { ROLES } from './data/mockData'

function RoleAccess({ roles, children }: { roles: RoleKey[]; children: ReactNode }) {
  const currentRole = useStore((s) => s.currentRole)
  const active = currentRole ? ROLES.find((role) => role.key === currentRole) : undefined
  if (!currentRole || !roles.includes(currentRole)) return <Navigate to={active?.home ?? '/'} replace />
  return children
}

function RequireRole() {
  const role = useStore((s) => s.currentRole)
  if (!role) return <Navigate to="/" replace />
  return (
    <>
      <Shell />
    </>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route element={<RequireRole />}>
        <Route path="/pic" element={<RoleAccess roles={['PIC']}><PicDashboard /></RoleAccess>} />
        <Route path="/report" element={<RoleAccess roles={['PIC', 'GATE']}><ReportWizard /></RoleAccess>} />
        <Route path="/case/:id" element={<RoleAccess roles={['PIC', 'EHFS']}><CaseDetail /></RoleAccess>} />
        <Route path="/ehfs" element={<RoleAccess roles={['EHFS']}><EhfsQueue /></RoleAccess>} />
        <Route path="/gate" element={<RoleAccess roles={['GATE']}><GateSearch /></RoleAccess>} />
        <Route path="/gate/reentry" element={<RoleAccess roles={['GATE']}><GateReentryReport /></RoleAccess>} />
        <Route path="/procurement" element={<RoleAccess roles={['PROCUREMENT']}><ProcurementDashboard /></RoleAccess>} />
        <Route path="/procurement/vendor/:id" element={<RoleAccess roles={['PROCUREMENT']}><VendorDetail /></RoleAccess>} />
        <Route path="/management" element={<RoleAccess roles={['MANAGEMENT']}><ManagementDashboard /></RoleAccess>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
