import { NavLink, useLocation } from 'react-router-dom'
import { clsx } from 'clsx'
import {
  LayoutDashboard, ListChecks, PlusCircle, History,
  User, Wrench, DollarSign, Star, AlertCircle, Settings,
  Users, ShieldCheck
} from 'lucide-react'

type Role = 'User' | 'Provider' | 'Admin'

const navConfig: Record<Role, { label: string; to: string; icon: React.ReactNode }[]> = {
  User: [
    { label: 'Dashboard', to: '/dashboard', icon: <LayoutDashboard size={18} /> },
    { label: 'My Requests', to: '/requests', icon: <ListChecks size={18} /> },
    { label: 'New Request', to: '/requests/new', icon: <PlusCircle size={18} /> },
    { label: 'Service History', to: '/service-history', icon: <History size={18} /> },
    { label: 'Profile', to: '/profile', icon: <User size={18} /> },
  ],
  Provider: [
    { label: 'Dashboard', to: '/provider/dashboard', icon: <LayoutDashboard size={18} /> },
    { label: 'Jobs', to: '/provider/jobs', icon: <Wrench size={18} /> },
    { label: 'Earnings', to: '/provider/earnings', icon: <DollarSign size={18} /> },
    { label: 'Profile', to: '/provider/profile', icon: <User size={18} /> },
  ],
  Admin: [
    { label: 'Dashboard', to: '/admin', icon: <LayoutDashboard size={18} /> },
    { label: 'Users', to: '/admin/users', icon: <Users size={18} /> },
    { label: 'Providers', to: '/admin/providers', icon: <ShieldCheck size={18} /> },
    { label: 'Requests', to: '/admin/requests', icon: <ListChecks size={18} /> },
    { label: 'Services', to: '/admin/services', icon: <Settings size={18} /> },
    { label: 'Payments', to: '/admin/payments', icon: <DollarSign size={18} /> },
    { label: 'Reviews', to: '/admin/reviews', icon: <Star size={18} /> },
    { label: 'Complaints', to: '/admin/complaints', icon: <AlertCircle size={18} /> },
  ],
}

export default function Sidebar({ role }: { role: Role }) {
  const items = navConfig[role]
  const location = useLocation()

  const isItemActive = (to: string) => {
    const path = location.pathname
    if (to === '/requests') {
      return path === '/requests' || (path.startsWith('/requests/') && path !== '/requests/new')
    }
    if (to === '/provider/jobs') {
      return path === '/provider/jobs' || path.startsWith('/provider/jobs/')
    }
    return path === to
  }

  return (
    <aside className="flex w-64 flex-col border-r border-gray-200 bg-white">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b border-gray-200 px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white font-bold text-sm">
          FM
        </div>
        <span className="text-lg font-bold text-gray-900">FixMate</span>
      </div>

      {/* Nav items */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {items.map((item) => {
          const active = isItemActive(item.to)
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={clsx(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-primary/10 text-primary font-bold'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
              )}
            >
              {item.icon}
              {item.label}
            </NavLink>
          )
        })}
      </nav>
    </aside>
  )
}
