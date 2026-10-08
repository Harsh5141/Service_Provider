import { Routes, Route } from 'react-router-dom'

// Layouts
import PublicLayout   from '@/layouts/PublicLayout'
import DashboardLayout from '@/layouts/DashboardLayout'
import AdminLayout    from '@/layouts/AdminLayout'
import ProviderLayout from '@/layouts/ProviderLayout'

// Guards
import ProtectedRoute from '@/components/routing/ProtectedRoute'
import RoleRoute      from '@/components/routing/RoleRoute'

// Public pages
import LandingPage    from '@/features/landing/LandingPage'
import LoginPage      from '@/features/auth/LoginPage'
import RegisterPage   from '@/features/auth/RegisterPage'
import NotFoundPage   from '@/pages/NotFoundPage'

// User pages
import UserDashboard       from '@/features/user/dashboard/UserDashboard'
import CreateRequestPage   from '@/features/user/requests/CreateRequestPage'
import RequestDetailPage   from '@/features/user/requests/RequestDetailPage'
import RequestListPage     from '@/features/user/requests/RequestListPage'
import ServiceHistoryPage  from '@/features/user/history/ServiceHistoryPage'
import ProfilePage         from '@/features/user/profile/ProfilePage'
import PaymentPage         from '@/features/user/payment/PaymentPage'

// Provider pages
import ProviderDashboard   from '@/features/provider/dashboard/ProviderDashboard'
import ProviderJobsPage    from '@/features/provider/jobs/ProviderJobsPage'
import ProviderJobDetail   from '@/features/provider/jobs/ProviderJobDetail'
import ProviderEarnings    from '@/features/provider/earnings/ProviderEarnings'
import ProviderProfilePage from '@/features/provider/profile/ProviderProfilePage'
import ProviderRegisterPage from '@/features/provider/auth/ProviderRegisterPage'

// Admin pages
import AdminDashboard      from '@/features/admin/dashboard/AdminDashboard'
import AdminUsers          from '@/features/admin/users/AdminUsers'
import AdminProviders      from '@/features/admin/providers/AdminProviders'
import AdminRequests       from '@/features/admin/requests/AdminRequests'
import AdminServices       from '@/features/admin/services/AdminServices'
import AdminPayments       from '@/features/admin/payments/AdminPayments'
import AdminReviews        from '@/features/admin/reviews/AdminReviews'
import AdminComplaints     from '@/features/admin/complaints/AdminComplaints'

export default function App() {
  return (
    <Routes>
      {/* ── Public routes ─────────────────────────────────────────────── */}
      <Route element={<PublicLayout />}>
        <Route index element={<LandingPage />} />
        <Route path="login"             element={<LoginPage />} />
        <Route path="register"          element={<RegisterPage />} />
        <Route path="register/provider" element={<ProviderRegisterPage />} />
      </Route>

      {/* ── Authenticated user routes ──────────────────────────────────── */}
      <Route element={<ProtectedRoute />}>
        <Route element={<RoleRoute allowedRoles={['User']} />}>
          <Route element={<DashboardLayout />}>
            <Route path="dashboard"                  element={<UserDashboard />} />
            <Route path="requests"                   element={<RequestListPage />} />
            <Route path="requests/new"               element={<CreateRequestPage />} />
            <Route path="requests/:id"               element={<RequestDetailPage />} />
            <Route path="requests/:id/pay"           element={<PaymentPage />} />
            <Route path="service-history"            element={<ServiceHistoryPage />} />
            <Route path="profile"                    element={<ProfilePage />} />
          </Route>
        </Route>

        {/* ── Provider routes ────────────────────────────────────────── */}
        <Route element={<RoleRoute allowedRoles={['Provider']} />}>
          <Route element={<ProviderLayout />}>
            <Route path="provider/dashboard" element={<ProviderDashboard />} />
            <Route path="provider/jobs"      element={<ProviderJobsPage />} />
            <Route path="provider/jobs/:id"  element={<ProviderJobDetail />} />
            <Route path="provider/earnings"  element={<ProviderEarnings />} />
            <Route path="provider/profile"   element={<ProviderProfilePage />} />
          </Route>
        </Route>

        {/* ── Admin routes ───────────────────────────────────────────── */}
        <Route element={<RoleRoute allowedRoles={['Admin']} />}>
          <Route element={<AdminLayout />}>
            <Route path="admin"                   element={<AdminDashboard />} />
            <Route path="admin/users"             element={<AdminUsers />} />
            <Route path="admin/providers"         element={<AdminProviders />} />
            <Route path="admin/requests"          element={<AdminRequests />} />
            <Route path="admin/services"          element={<AdminServices />} />
            <Route path="admin/payments"          element={<AdminPayments />} />
            <Route path="admin/reviews"           element={<AdminReviews />} />
            <Route path="admin/complaints"        element={<AdminComplaints />} />
          </Route>
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
