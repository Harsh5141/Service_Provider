import { useState, useEffect } from 'react'
import { Star, MapPin, Radio, CheckCircle2, XCircle, Layers } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '@/lib/apiClient'

interface ProviderItem {
  id: number
  userId: number
  name: string
  email: string
  phone: string
  bio: string
  experienceYears: number
  ratingAverage: number
  ratingCount: number
  status: string
  isAvailable: boolean
  serviceRadiusKm?: number
  city?: string
  postalCode?: string
  primaryCategory?: string
  categories?: string[]
  skills?: string[]
}

const DEMO_PROVIDERS: ProviderItem[] = [
  {
    id: 1,
    userId: 101,
    name: 'Rajesh Kumar',
    email: 'rajesh@fixmate.test',
    phone: '+91 98765 43210',
    bio: 'Certified master electrician and HVAC specialist with 8+ years experience.',
    experienceYears: 8,
    ratingAverage: 4.85,
    ratingCount: 142,
    status: 'Active',
    isAvailable: true,
    serviceRadiusKm: 15,
    city: 'Valsad',
    postalCode: '396001',
    primaryCategory: 'Electrical & Power',
    categories: ['Electrical & Power', 'AC & Appliance Repair'],
    skills: ['AC Repair & Servicing', 'Electrical & Wiring', 'Appliance Repair']
  },
  {
    id: 2,
    userId: 102,
    name: 'Amit Singh',
    email: 'amit@fixmate.test',
    phone: '+91 98765 43214',
    bio: 'Professional plumber & drainage specialist with 5 years experience.',
    experienceYears: 5,
    ratingAverage: 4.88,
    ratingCount: 89,
    status: 'Active',
    isAvailable: true,
    serviceRadiusKm: 10,
    city: 'Valsad',
    postalCode: '396001',
    primaryCategory: 'Plumbing & Sanitary',
    categories: ['Plumbing & Sanitary', 'Home Cleaning & Pest'],
    skills: ['Plumbing & Drainage', 'Home Deep Cleaning']
  },
  {
    id: 3,
    userId: 103,
    name: 'Vikram Joshi',
    email: 'vikram.j@gmail.com',
    phone: '+91 98765 43220',
    bio: 'AC & Refrigeration technician with 6 years experience.',
    experienceYears: 6,
    ratingAverage: 4.70,
    ratingCount: 22,
    status: 'PendingApproval',
    isAvailable: true,
    serviceRadiusKm: 12,
    city: 'Valsad',
    postalCode: '396002',
    primaryCategory: 'AC & Appliance Repair',
    categories: ['AC & Appliance Repair'],
    skills: ['AC Repair & Servicing']
  }
]

export default function AdminProviders() {
  const [providers, setProviders] = useState<ProviderItem[]>(DEMO_PROVIDERS)
  const [loading, setLoading] = useState(false)

  const loadProviders = async () => {
    setLoading(true)
    try {
      const res = await api.get('/admin/providers')
      if (res.data?.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
        setProviders(res.data.data)
      }
    } catch (err) {
      console.warn('Using fallback admin providers list', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProviders()
  }, [])

  const handleToggleStatus = async (id: number, currentStatus: string | number) => {
    const statusStr = String(currentStatus).toLowerCase()
    const isCurrentlyActive = statusStr === 'active' || currentStatus === 2
    const nextStatus = isCurrentlyActive ? 'Suspended' : 'Active'
    try {
      await api.put(`/admin/providers/${id}/status`, { status: nextStatus })
      setProviders((prev) => prev.map((p) => (p.id === id || p.userId === id) ? { ...p, status: nextStatus } : p))
      toast.success(`Provider status updated to ${nextStatus}`)
      await loadProviders()
    } catch (err: any) {
      console.error('Failed to update provider status:', err)
      toast.error(err?.response?.data?.message || 'Failed to update provider status')
    }
  }

  const getStatusLabel = (status: string | number) => {
    const str = String(status).toLowerCase()
    if (str === 'active' || status === 2) return 'Active'
    if (str === 'pendingapproval' || str === 'pending' || status === 1) return 'PendingApproval'
    if (str === 'suspended' || status === 3) return 'Suspended'
    if (str === 'rejected' || status === 4) return 'Rejected'
    return String(status)
  }

  const getProviderCategory = (p: ProviderItem) => {
    if (p.primaryCategory && p.primaryCategory !== 'Home Services') return p.primaryCategory
    if (p.categories && p.categories.length > 0) return p.categories[0]

    // Auto-detect from skills if not explicitly set
    const skillStr = (p.skills || []).join(' ').toLowerCase()
    if (
      skillStr.includes('electric') ||
      skillStr.includes('switchboard') ||
      skillStr.includes('wiring') ||
      skillStr.includes('fan') ||
      skillStr.includes('fuse')
    ) {
      return 'Electrical & Power'
    }
    if (
      skillStr.includes('drain') ||
      skillStr.includes('plumb') ||
      skillStr.includes('pipe') ||
      skillStr.includes('tap') ||
      skillStr.includes('sink') ||
      skillStr.includes('toilet')
    ) {
      return 'Plumbing & Sanitary'
    }
    if (
      skillStr.includes('ac ') ||
      skillStr.includes('air') ||
      skillStr.includes('appliance') ||
      skillStr.includes('refrigerat') ||
      skillStr.includes('washing')
    ) {
      return 'AC & Appliance Repair'
    }
    if (
      skillStr.includes('clean') ||
      skillStr.includes('pest') ||
      skillStr.includes('shampoo') ||
      skillStr.includes('sofa') ||
      skillStr.includes('bathroom')
    ) {
      return 'Home Cleaning & Pest'
    }
    return p.primaryCategory || 'Home & Local Services'
  }

  const getCategoryBadgeColor = (categoryName: string) => {
    const cat = categoryName.toLowerCase()
    if (cat.includes('electric') || cat.includes('power')) {
      return 'bg-indigo-50 text-indigo-700 border-indigo-200'
    }
    if (cat.includes('plumb') || cat.includes('sanitary')) {
      return 'bg-cyan-50 text-cyan-700 border-cyan-200'
    }
    if (cat.includes('ac') || cat.includes('appliance')) {
      return 'bg-blue-50 text-blue-700 border-blue-200'
    }
    if (cat.includes('clean') || cat.includes('pest')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    }
    return 'bg-slate-100 text-slate-700 border-slate-200'
  }

  return (
    <div className="space-y-6 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Service Partners & Coverage Areas</h1>
          <p className="text-xs sm:text-sm text-gray-500">
            Monitor partner categories, skills, service radiuses, verified base locations, and approval statuses
          </p>
        </div>
        <button
          onClick={loadProviders}
          className="rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 cursor-pointer self-start"
        >
          {loading ? 'Refreshing...' : 'Refresh List'}
        </button>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500 uppercase border-b border-gray-100">
              <tr>
                <th className="px-5 py-3 font-bold">Partner Profile</th>
                <th className="px-5 py-3 font-bold">Category</th>
                <th className="px-5 py-3 font-bold">Skills & Specialties</th>
                <th className="px-5 py-3 font-bold">Service Area & Radius</th>
                <th className="px-5 py-3 font-bold">Rating & Availability</th>
                <th className="px-5 py-3 font-bold">Status</th>
                <th className="px-5 py-3 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {providers.map((p) => {
                const label = getStatusLabel(p.status)
                const isActive = label === 'Active'
                const isPending = label === 'PendingApproval'
                const primaryCat = getProviderCategory(p)

                return (
                  <tr key={p.id} className="hover:bg-gray-50 transition">
                    <td className="px-5 py-4">
                      <p className="font-bold text-sm text-gray-900">{p.name}</p>
                      <p className="text-[11px] text-gray-500">
                        {p.email} · {p.phone}
                      </p>
                      <p className="text-[11px] text-gray-400 line-clamp-1 mt-0.5">{p.bio}</p>
                    </td>
                    <td className="px-5 py-4">
                      <div className="space-y-1 max-w-[170px]">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold border ${getCategoryBadgeColor(
                            primaryCat
                          )}`}
                        >
                          <Layers size={13} className="shrink-0" />
                          <span className="truncate">{primaryCat}</span>
                        </span>
                        {p.categories && p.categories.length > 1 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {p.categories
                              .filter((c) => c !== primaryCat)
                              .map((extraCat) => (
                                <span
                                  key={extraCat}
                                  className="text-[10px] text-gray-600 font-semibold bg-gray-100 border border-gray-200 px-1.5 py-0.5 rounded-md"
                                >
                                  +{extraCat}
                                </span>
                              ))}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {p.skills && p.skills.length > 0 ? (
                          p.skills.map((skill) => (
                            <span
                              key={skill}
                              className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700"
                            >
                              {skill}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-400 text-[11px]">General Servicing</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="space-y-1">
                        <p className="flex items-center gap-1 font-semibold text-gray-800 text-xs">
                          <MapPin size={12} className="text-blue-600" />
                          {p.city ?? 'Valsad'} - {p.postalCode ?? '396001'}
                        </p>
                        <p className="flex items-center gap-1 text-[11px] text-emerald-700 font-bold">
                          <Radio size={12} /> Radius: {p.serviceRadiusKm ?? 15} KM
                        </p>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 font-bold text-gray-900">
                          <Star size={13} className="fill-amber-500 text-amber-500" />
                          <span>{p.ratingAverage}</span>
                          <span className="text-gray-400 font-normal">({p.ratingCount} reviews)</span>
                        </div>
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold ${
                            p.isAvailable ? 'text-emerald-700' : 'text-gray-400'
                          }`}
                        >
                          {p.isAvailable ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                          {p.isAvailable ? 'Available for Jobs' : 'Offline / Busy'}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-2.5 py-0.5 font-bold text-[10px] ${
                          isActive
                            ? 'bg-emerald-100 text-emerald-800'
                            : isPending
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {label}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => handleToggleStatus(p.id, p.status)}
                        className={`rounded-xl px-3 py-1.5 font-bold text-xs shadow-2xs transition cursor-pointer ${
                          isActive
                            ? 'border border-gray-300 text-gray-700 hover:bg-gray-100'
                            : 'bg-emerald-600 text-white hover:bg-emerald-700'
                        }`}
                      >
                        {isActive ? 'Suspend' : 'Approve Partner'}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
