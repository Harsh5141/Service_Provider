import { Bell, ChevronDown } from 'lucide-react'
import { useAppSelector }  from '@/hooks/useAppSelector'
import { useAppDispatch }  from '@/hooks/useAppDispatch'
import { logout }          from '@/features/auth/authSlice'

export default function Topbar() {
  const dispatch = useAppDispatch()
  const { user } = useAppSelector((s) => s.auth)
  const unread   = useAppSelector((s) => s.notifications.unreadCount)

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
      <div /> {/* Left spacer */}

      <div className="flex items-center gap-4">
        {/* Notification bell */}
        <button className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100">
          <Bell size={20} />
          {unread > 0 && (
            <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-[10px] font-bold text-white">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>

        {/* User menu */}
        <button
          className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
          onClick={() => dispatch(logout())}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white text-xs font-bold">
            {user?.name?.charAt(0).toUpperCase() ?? 'U'}
          </div>
          <span className="hidden sm:block">{user?.name}</span>
          <ChevronDown size={14} />
        </button>
      </div>
    </header>
  )
}
