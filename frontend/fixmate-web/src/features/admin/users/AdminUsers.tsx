import { useState, useEffect } from 'react'
import { Search, CheckCircle } from 'lucide-react'
import api from '@/lib/apiClient'

interface UserItem {
  id: number
  name: string
  email: string
  phone: string
  role: string
  isActive: boolean
  createdAt: string
}

export default function AdminUsers() {
  const [users, setUsers] = useState<UserItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function loadUsers() {
      setLoading(true)
      try {
        const res = await api.get('/admin/users')
        if (res.data?.data && Array.isArray(res.data.data)) {
          setUsers(res.data.data)
        }
      } catch (err) {
        console.error('Failed to load users from database', err)
      } finally {
        setLoading(false)
      }
    }
    loadUsers()
  }, [])

  const filtered = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Platform Users Directory</h1>
          <p className="text-xs sm:text-sm text-gray-500">Manage registered customers, service partners, and admins</p>
        </div>

        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-xl border border-gray-300 bg-white text-gray-900 font-medium pl-9 pr-4 py-2 text-xs focus:border-blue-600 outline-none w-64 shadow-2xs"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white shadow-2xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-xs text-gray-400">
            Loading platform users from database...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-xs text-gray-400">
            No users found matching search criteria.
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500 uppercase border-b border-gray-100">
              <tr>
                <th className="px-5 py-3">User</th>
                <th className="px-5 py-3">Contact</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white font-bold text-xs">
                        {u.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{u.name}</p>
                        <p className="text-[11px] text-gray-400">ID #{u.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="text-gray-900">{u.email}</p>
                    <p className="text-gray-400">{u.phone}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`rounded-full px-2.5 py-0.5 font-bold text-[10px] ${
                        u.role === 'Admin'
                          ? 'bg-purple-100 text-purple-800'
                          : u.role === 'Provider'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center gap-1 font-semibold ${u.isActive ? 'text-emerald-700' : 'text-gray-400'}`}>
                      <CheckCircle size={12} /> {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right text-gray-500">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
