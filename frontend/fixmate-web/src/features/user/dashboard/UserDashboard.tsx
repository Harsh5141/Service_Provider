import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAppSelector } from '@/hooks/useAppSelector'
import api from '@/lib/apiClient'
import {
  Zap, Droplets, Wind, Sparkles, Hammer, Paintbrush,
  Clock, ShieldCheck, PlusCircle, ArrowRight,
  Tv, RefreshCw, Flame, Camera, ShieldAlert, Wrench,
  Search, Star, MapPin, CheckCircle2, Phone,
  Sparkle, Award, ArrowUpRight
} from 'lucide-react'

interface ServiceCategory {
  id: number
  name: string
  slug: string
  description: string
  iconName: string
  services: ServiceItem[]
}

interface ServiceItem {
  id: number
  categoryId: number
  categoryName: string
  name: string
  description: string
  basePrice: number
  estimatedDurationMinutes: number
  imageUrl?: string
}

interface PublicProvider {
  id: number
  userId: number
  name: string
  email: string
  phone: string
  bio: string
  specialization: string
  experienceYears: number
  ratingAverage: number
  ratingCount: number
  city: string
  postalCode: string
  skills: string[]
  categoryId: number
}

interface ActiveRequest {
  id: number
  serviceName: string
  categoryName: string
  providerName?: string
  providerPhone?: string
  statusText: string
  status: number | string
  scheduledDate: string
  preferredTimeSlot: string
  estimatedCost: number
}

export default function UserDashboard() {
  const navigate = useNavigate()
  const { user } = useAppSelector((state) => state.auth)

  const [categories, setCategories] = useState<ServiceCategory[]>([])
  const [selectedCatId, setSelectedCatId] = useState<number>(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [providers, setProviders] = useState<PublicProvider[]>([])
  const [activeRequests, setActiveRequests] = useState<ActiveRequest[]>([])
  const [defaultAddress, setDefaultAddress] = useState<string>('Valsad, Gujarat (396001)')

  // Equipment passport
  const [appliances] = useState([
    {
      id: 1,
      name: 'Samsung 1.5 Ton 5-Star Split AC',
      category: 'Air Conditioner',
      lastServiced: '12 May 2026',
      serviceDueDays: 14,
      status: 'Seasonal Care Due Soon',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
      serviceId: 13,
      catId: 3
    },
    {
      id: 2,
      name: 'LG 8.0 Kg Front Load Washing Machine',
      category: 'Washing Machine',
      lastServiced: '28 Feb 2026',
      serviceDueDays: 85,
      status: 'Healthy & Calibrated',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      serviceId: 16,
      catId: 4
    },
    {
      id: 3,
      name: 'Kent Grand Plus RO Water Purifier',
      category: 'Water Purifier',
      lastServiced: '10 Jan 2026',
      serviceDueDays: 5,
      status: 'Filter Replacement Recommended',
      badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
      serviceId: 31,
      catId: 9
    }
  ])

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [catsRes, provRes, reqsRes, addrRes] = await Promise.allSettled([
          api.get('/services/categories'),
          api.get('/services/providers'),
          api.get('/requests/my'),
          api.get('/addresses')
        ])

        if (catsRes.status === 'fulfilled' && catsRes.value.data?.data) {
          const list = catsRes.value.data.data
          setCategories(list)
          if (list.length > 0) {
            setSelectedCatId(list[0].id)
          }
        }

        if (provRes.status === 'fulfilled' && provRes.value.data?.data) {
          setProviders(provRes.value.data.data)
        }

        if (reqsRes.status === 'fulfilled' && reqsRes.value.data?.data && Array.isArray(reqsRes.value.data.data)) {
          const allReqs: ActiveRequest[] = reqsRes.value.data.data
          const active = allReqs.filter((r) => {
            const st = (r.statusText || '').toLowerCase()
            return ['created', 'pending', 'providerassigned', 'assigned', 'ontheway', 'inprogress'].includes(st)
          })
          setActiveRequests(active)
        }

        if (addrRes.status === 'fulfilled' && addrRes.value.data?.data && Array.isArray(addrRes.value.data.data)) {
          const addrs = addrRes.value.data.data
          const def = addrs.find((a: any) => a.isDefault) || addrs[0]
          if (def) {
            setDefaultAddress(`${def.street ? def.street + ', ' : ''}${def.city || 'Valsad'} (${def.postalCode || '396001'})`)
          }
        }
      } catch (err) {
        console.error('Failed to load dashboard data', err)
      }
    }
    loadDashboardData()
  }, [])

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  const getCategoryTheme = (iconName: string) => {
    switch (iconName?.toLowerCase()) {
      case 'zap':
        return {
          icon: <Zap size={22} className="text-amber-500" />,
          gradient: 'from-amber-500/10 via-amber-500/5 to-transparent',
          border: 'hover:border-amber-400',
          badge: 'bg-amber-50 text-amber-700 border-amber-200',
          accent: 'text-amber-600'
        }
      case 'droplets':
        return {
          icon: <Droplets size={22} className="text-cyan-500" />,
          gradient: 'from-cyan-500/10 via-cyan-500/5 to-transparent',
          border: 'hover:border-cyan-400',
          badge: 'bg-cyan-50 text-cyan-700 border-cyan-200',
          accent: 'text-cyan-600'
        }
      case 'wind':
        return {
          icon: <Wind size={22} className="text-sky-500" />,
          gradient: 'from-sky-500/10 via-sky-500/5 to-transparent',
          border: 'hover:border-sky-400',
          badge: 'bg-sky-50 text-sky-700 border-sky-200',
          accent: 'text-sky-600'
        }
      case 'tv':
        return {
          icon: <Tv size={22} className="text-indigo-500" />,
          gradient: 'from-indigo-500/10 via-indigo-500/5 to-transparent',
          border: 'hover:border-indigo-400',
          badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
          accent: 'text-indigo-600'
        }
      case 'sparkles':
        return {
          icon: <Sparkles size={22} className="text-purple-500" />,
          gradient: 'from-purple-500/10 via-purple-500/5 to-transparent',
          border: 'hover:border-purple-400',
          badge: 'bg-purple-50 text-purple-700 border-purple-200',
          accent: 'text-purple-600'
        }
      case 'hammer':
        return {
          icon: <Hammer size={22} className="text-orange-500" />,
          gradient: 'from-orange-500/10 via-orange-500/5 to-transparent',
          border: 'hover:border-orange-400',
          badge: 'bg-orange-50 text-orange-700 border-orange-200',
          accent: 'text-orange-600'
        }
      case 'paintbrush':
        return {
          icon: <Paintbrush size={22} className="text-pink-500" />,
          gradient: 'from-pink-500/10 via-pink-500/5 to-transparent',
          border: 'hover:border-pink-400',
          badge: 'bg-pink-50 text-pink-700 border-pink-200',
          accent: 'text-pink-600'
        }
      case 'shieldalert':
      case 'bug':
        return {
          icon: <ShieldAlert size={22} className="text-rose-500" />,
          gradient: 'from-rose-500/10 via-rose-500/5 to-transparent',
          border: 'hover:border-rose-400',
          badge: 'bg-rose-50 text-rose-700 border-rose-200',
          accent: 'text-rose-600'
        }
      case 'flame':
        return {
          icon: <Flame size={22} className="text-teal-500" />,
          gradient: 'from-teal-500/10 via-teal-500/5 to-transparent',
          border: 'hover:border-teal-400',
          badge: 'bg-teal-50 text-teal-700 border-teal-200',
          accent: 'text-teal-600'
        }
      case 'camera':
        return {
          icon: <Camera size={22} className="text-emerald-500" />,
          gradient: 'from-emerald-500/10 via-emerald-500/5 to-transparent',
          border: 'hover:border-emerald-400',
          badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          accent: 'text-emerald-600'
        }
      default:
        return {
          icon: <Wrench size={22} className="text-blue-500" />,
          gradient: 'from-blue-500/10 via-blue-500/5 to-transparent',
          border: 'hover:border-blue-400',
          badge: 'bg-blue-50 text-blue-700 border-blue-200',
          accent: 'text-blue-600'
        }
    }
  }

  // Active category services
  const activeCategory = categories.find((c) => c.id === selectedCatId) || categories[0]

  // Global search filtering
  const allServicesList = categories.flatMap((c) => c.services || [])
  const searchResults = searchQuery.trim()
    ? allServicesList.filter(
        (s) =>
          s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.categoryName?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : []

  return (
    <div className="space-y-8 pb-16">
      {/* ── 1. Top Hero Section with Ambient Glow ───────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-900 p-6 sm:p-10 text-white shadow-2xl">
        {/* Background decorative blurs */}
        <div className="absolute -right-12 -top-12 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl pointer-events-none" />
        <div className="absolute right-1/3 -bottom-20 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
          <div className="space-y-4 max-w-2xl">
            {/* Location & Guarantee Pill */}
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1 text-xs font-semibold backdrop-blur-md text-blue-200 border border-white/10">
                <MapPin size={13} className="text-rose-400 animate-bounce" />
                <span>{defaultAddress}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-300 border border-emerald-500/30">
                <ShieldCheck size={14} className="text-emerald-400" />
                100% Verified Partners
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
              {getGreeting()}, <span className="bg-gradient-to-r from-blue-200 via-sky-200 to-indigo-100 bg-clip-text text-transparent">{user?.name || 'Customer'}</span>! 👋
            </h1>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Book certified electrical, plumbing, AC, cleaning & repair specialists in Valsad with upfront fixed rates and 30-day warranty.
            </p>

            {/* Instant Search Bar */}
            <div className="relative max-w-lg pt-1">
              <div className="relative flex items-center">
                <Search className="absolute left-4 text-slate-400" size={18} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search any repair (e.g. AC Foam Jet, Tap Repair, CCTV, Bed Assembly)..."
                  className="w-full rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 pl-11 pr-4 py-3.5 text-xs sm:text-sm text-white placeholder-slate-400 outline-none focus:bg-white focus:text-gray-900 focus:placeholder-gray-400 focus:ring-4 focus:ring-blue-500/30 transition-all shadow-inner"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 text-xs font-bold bg-white/20 hover:bg-white/30 text-white rounded-lg px-2 py-1"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Search Dropdown Overlay */}
              {searchQuery.trim() && (
                <div className="absolute left-0 right-0 top-full mt-2 z-50 rounded-2xl border border-gray-200 bg-white shadow-2xl p-2 max-h-72 overflow-y-auto space-y-1">
                  {searchResults.length === 0 ? (
                    <div className="p-4 text-center text-xs text-gray-500">
                      No services matching "{searchQuery}". Try searching "AC", "Fan", or "Tap".
                    </div>
                  ) : (
                    searchResults.map((svc) => (
                      <button
                        key={svc.id}
                        onClick={() => {
                          setSearchQuery('')
                          navigate(`/requests/new?serviceId=${svc.id}&categoryId=${svc.categoryId}`)
                        }}
                        className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-blue-50 text-left transition text-xs group cursor-pointer"
                      >
                        <div>
                          <p className="font-bold text-gray-900 group-hover:text-blue-600">{svc.name}</p>
                          <p className="text-[11px] text-gray-500">{svc.categoryName} · ~{svc.estimatedDurationMinutes} mins</p>
                        </div>
                        <span className="font-extrabold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
                          ₹{svc.basePrice}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Quick CTA Action Hub */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
            <Link
              to="/requests/new"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-500/30 transition-all hover:from-blue-600 hover:to-indigo-700 hover:scale-[1.02] active:scale-95"
            >
              <PlusCircle size={18} />
              <span>Book New Service</span>
            </Link>

            <Link
              to="/requests"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/10 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur-md border border-white/15 transition-all hover:bg-white/20 hover:border-white/30"
            >
              <span>My Service Bookings</span>
              {activeRequests.length > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[11px] font-bold text-white animate-pulse">
                  {activeRequests.length}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Value Props Strip */}
        <div className="relative z-10 mt-8 pt-6 border-t border-white/10 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/20 text-blue-300">
              <Clock size={16} />
            </div>
            <div>
              <p className="font-bold text-white">Under 45 Mins</p>
              <p className="text-[11px] text-slate-300">Fast Local Dispatch</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-300">
              <Award size={16} />
            </div>
            <div>
              <p className="font-bold text-white">30-Day Guarantee</p>
              <p className="text-[11px] text-slate-300">Free Re-work Protection</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/20 text-amber-300">
              <Sparkle size={16} />
            </div>
            <div>
              <p className="font-bold text-white">Flat ₹50 OFF</p>
              <p className="text-[11px] text-slate-300">Coupon: FIRST50</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-500/20 text-purple-300">
              <ShieldCheck size={16} />
            </div>
            <div>
              <p className="font-bold text-white">Verified Pros</p>
              <p className="text-[11px] text-slate-300">Police & Skill Checked</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. Live Active Booking Tracker (If Active Request Exists) ───────── */}
      {activeRequests.length > 0 && (
        <div className="rounded-3xl border border-blue-200 bg-gradient-to-r from-blue-50 via-indigo-50/50 to-white p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-blue-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
              </span>
              <h2 className="text-sm sm:text-base font-extrabold text-blue-950">
                Live Active Booking (#{activeRequests[0].id})
              </h2>
              <span className="rounded-full bg-blue-600 text-white text-[10px] font-bold px-2.5 py-0.5 uppercase tracking-wider">
                {activeRequests[0].statusText}
              </span>
            </div>

            <button
              onClick={() => navigate(`/requests/${activeRequests[0].id}`)}
              className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:text-blue-800 transition"
            >
              <span>Track Live Job & View OTP</span>
              <ArrowRight size={13} />
            </button>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-gray-900">{activeRequests[0].serviceName}</h3>
              <p className="text-xs text-gray-500">{activeRequests[0].categoryName} · Scheduled for {activeRequests[0].preferredTimeSlot}</p>
            </div>

            {activeRequests[0].providerName && (
              <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-2xl p-3 shadow-2xs">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white font-bold text-xs">
                  {activeRequests[0].providerName.charAt(0)}
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900">{activeRequests[0].providerName}</p>
                  <p className="text-[10px] text-emerald-600 font-semibold">Assigned Specialist</p>
                </div>
                {activeRequests[0].providerPhone && (
                  <a
                    href={`tel:${activeRequests[0].providerPhone}`}
                    className="ml-2 inline-flex items-center gap-1 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 text-xs font-bold hover:bg-emerald-100"
                  >
                    <Phone size={12} /> Call
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── 3. 10 Service Categories Grid (Rich Bento Style) ────────────────── */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-extrabold text-gray-900">Explore Service Categories</h2>
            <p className="text-xs text-gray-500">Certified local professionals across all home repair domains</p>
          </div>
          <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-100 self-start sm:self-auto">
            10 Domain Categories · 30 Fixed-Price Services
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5 sm:gap-4">
          {categories.map((cat) => {
            const theme = getCategoryTheme(cat.iconName)
            const isSelected = cat.id === selectedCatId

            return (
              <div
                key={cat.id}
                onClick={() => {
                  setSelectedCatId(cat.id)
                  // Smooth scroll to services explorer
                  const el = document.getElementById('services-explorer')
                  if (el) el.scrollIntoView({ behavior: 'smooth' })
                }}
                className={`group relative flex flex-col justify-between rounded-2xl border p-4 sm:p-5 transition-all duration-300 cursor-pointer overflow-hidden ${
                  isSelected
                    ? 'border-blue-600 bg-gradient-to-br from-blue-50/80 via-indigo-50/30 to-white ring-2 ring-blue-500/20 shadow-md -translate-y-1'
                    : `border-gray-200 bg-white hover:shadow-lg hover:-translate-y-1 ${theme.border}`
                }`}
              >
                <div className="space-y-3">
                  {/* Icon badge with gradient glow */}
                  <div className="flex items-center justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-50 border border-gray-100 group-hover:scale-110 group-hover:shadow-sm transition-all">
                      {theme.icon}
                    </div>
                    <span className="text-[10px] font-bold text-gray-400 group-hover:text-blue-600 transition">
                      {cat.services?.length || 3} pkgs
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-gray-900 group-hover:text-blue-600 transition line-clamp-1">
                      {cat.name}
                    </h3>
                    <p className="mt-1 text-[11px] text-gray-500 line-clamp-2 leading-relaxed">
                      {cat.description}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] font-bold text-blue-600">
                  <span>View Services</span>
                  <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── 4. Category Services Explorer Section ───────────────────────────── */}
      <div id="services-explorer" className="space-y-5 rounded-3xl border border-gray-200 bg-white p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-lg bg-blue-100 p-1.5 text-blue-700">
                {getCategoryTheme(activeCategory?.iconName || '').icon}
              </span>
              <h2 className="text-xl font-extrabold text-gray-900">
                {activeCategory?.name || 'Electrical & Power Solutions'}
              </h2>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              {activeCategory?.description || 'All repairs backed by 30-day FixMate warranty guarantee'}
            </p>
          </div>

          <button
            onClick={() => navigate(`/requests/new?categoryId=${activeCategory?.id}`)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 px-4 py-2.5 text-xs font-bold transition self-start sm:self-auto cursor-pointer"
          >
            <span>View All Category Technicians</span>
            <ArrowUpRight size={14} />
          </button>
        </div>

        {/* Services Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {activeCategory?.services.map((svc) => (
            <div
              key={svc.id}
              className="group flex flex-col justify-between rounded-2xl border border-gray-200 bg-gray-50/50 p-5 transition-all hover:bg-white hover:border-blue-300 hover:shadow-lg hover:-translate-y-1"
            >
              <div className="space-y-3.5">
                <div className="flex items-start justify-between gap-2">
                  <span className="rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-extrabold px-2.5 py-0.5">
                    Fixed ₹{svc.basePrice}
                  </span>
                  <span className="text-[11px] text-gray-400 font-semibold line-through">
                    ₹{Math.round(svc.basePrice * 1.3)}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition">
                    {svc.name}
                  </h3>
                  <p className="mt-1.5 text-xs text-gray-500 leading-relaxed">
                    {svc.description}
                  </p>
                </div>

                {/* Inclusion features */}
                <div className="space-y-1.5 pt-1 text-[11px] text-gray-600">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                    <span>Inspection & diagnosis included</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                    <span>30-Day FixMate post-service warranty</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-gray-200 flex items-center justify-between">
                <span className="inline-flex items-center gap-1 text-[11px] text-gray-500 font-semibold">
                  <Clock size={13} className="text-gray-400" />
                  ~{svc.estimatedDurationMinutes} mins
                </span>
                <button
                  onClick={() => navigate(`/requests/new?serviceId=${svc.id}&categoryId=${svc.categoryId}`)}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition cursor-pointer"
                >
                  Book Service
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 5. Top Verified Specialists in Your Area ────────────────────────── */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-extrabold text-gray-900">Certified Partners in Valsad</h2>
            <p className="text-xs text-gray-500">Top rated professionals ready for immediate dispatch</p>
          </div>
          <Link
            to="/requests/new"
            className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700"
          >
            <span>View All Partners</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {providers.slice(0, 4).map((prov) => (
            <div
              key={prov.id}
              className="rounded-2xl border border-gray-200 bg-white p-5 space-y-3.5 hover:shadow-md hover:border-blue-300 transition flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-bold text-xs shadow-2xs">
                      {prov.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-gray-900">{prov.name}</h4>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">
                        Verified Pro
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="flex items-center gap-1 font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                    <Star size={12} className="fill-amber-400 text-amber-400" />
                    {prov.ratingAverage.toFixed(2)}
                  </span>
                  <span className="text-gray-400">·</span>
                  <span className="text-gray-600 font-medium">{prov.experienceYears}+ Yrs Exp</span>
                </div>

                <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed">
                  {prov.bio}
                </p>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                <span className="text-[10px] text-gray-400 font-semibold">
                  {prov.city} · 15km
                </span>
                <button
                  onClick={() => navigate(`/requests/new?categoryId=${prov.categoryId}`)}
                  className="rounded-lg bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 px-3 py-1.5 text-xs font-bold transition cursor-pointer"
                >
                  Book Direct
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 6. Digital Household Passport & Maintenance Passport ───────────── */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-extrabold text-gray-900">My Household Equipment Hub</h2>
            <p className="text-xs text-gray-500">Track appliance health, service schedules, and preventative care</p>
          </div>
          <Link
            to="/service-history"
            className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700"
          >
            <span>Complete Equipment Records</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {appliances.map((app) => (
            <div
              key={app.id}
              className="rounded-2xl border border-gray-200 bg-white p-5 space-y-4 shadow-2xs hover:border-gray-300 transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
                    <Tv size={20} />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-gray-900">{app.name}</h4>
                    <p className="text-[11px] text-gray-500">{app.category}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-gray-50 p-3 text-xs space-y-2">
                <div className="flex justify-between text-gray-600">
                  <span>Last Inspection:</span>
                  <span className="font-semibold text-gray-900">{app.lastServiced}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Status:</span>
                  <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] border ${app.badgeColor}`}>
                    {app.status}
                  </span>
                </div>
              </div>

              <button
                onClick={() => navigate(`/requests/new?serviceId=${app.serviceId}&categoryId=${app.catId}`)}
                className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 py-2.5 text-xs font-bold text-gray-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition cursor-pointer"
              >
                <RefreshCw size={13} />
                <span>Schedule Routine Checkup</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
