import { Navigate, Route, Routes } from 'react-router-dom'
import { useStore } from './store/useStore'
import { Shell } from './components/Shell'
import { PrototypeToolbar } from './components/PrototypeToolbar'
import { Landing } from './pages/Landing'
import { PicDashboard } from './pages/pic/PicDashboard'
import { ReportWizard } from './pages/ReportWizard'
import { CaseDetail } from './pages/CaseDetail'
import { EhfsQueue } from './pages/ehfs/EhfsQueue'
import { GateSearch } from './pages/gate/GateSearch'
import { ProcurementDashboard } from './pages/procurement/ProcurementDashboard'
import { VendorDetail } from './pages/procurement/VendorDetail'
import { ManagementDashboard } from './pages/management/ManagementDashboard'

function RequireRole() {
  const role = useStore((s) => s.currentRole)
  if (!role) return <Navigate to="/" replace />
  return (
    <>
      <Shell />
      <PrototypeToolbar />
    </>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route element={<RequireRole />}>
        <Route path="/pic" element={<PicDashboard />} />
        <Route path="/report" element={<ReportWizard />} />
        <Route path="/case/:id" element={<CaseDetail />} />
        <Route path="/ehfs" element={<EhfsQueue />} />
        <Route path="/gate" element={<GateSearch />} />
        <Route path="/procurement" element={<ProcurementDashboard />} />
        <Route path="/procurement/vendor/:id" element={<VendorDetail />} />
        <Route path="/management" element={<ManagementDashboard />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
