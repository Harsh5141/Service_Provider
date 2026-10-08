import { Navigate, Outlet } from 'react-router-dom'
import { useAppSelector } from '@/hooks/useAppSelector'

interface Props {
  allowedRoles: string[]
}

/// Guards a route subtree for specific roles. Redirects to the user's own dashboard if wrong role.
export default function RoleRoute({ allowedRoles }: Props) {
  const { user } = useAppSelector((s) => s.auth)

  if (!user || !allowedRoles.includes(user.role)) {
    // Redirect to correct home based on actual role
    const home =
      user?.role === 'Admin'    ? '/admin'            :
      user?.role === 'Provider' ? '/provider/dashboard' :
                                  '/dashboard'

    return <Navigate to={home} replace />
  }

  return <Outlet />
}
