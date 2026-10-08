import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Clock, MapPin, Phone,
  ChevronRight, PlusCircle, Calendar,
  Search, Trash2, RefreshCw,
  CheckCircle2, AlertTriangle, ShieldCheck,
  Zap, Droplets, Wind, Sparkles, Hammer, Paintbrush,
  Tv, Flame, Camera, ShieldAlert,
  Copy, Check, X, RotateCcw, Wrench
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '@/lib/apiClient'

interface RequestItem {
  id: number
  serviceId: number
  serviceName: string
  categoryName: string
  providerId?: number
  providerName?: string
  providerPhone?: string
  providerRating?: number
  providerExperienceYears?: number
  addressText?: string
  city?: string
  state?: string
  postalCode?: string
  status: number | string
  statusText?: string
  scheduledDate: string
  preferredTimeSlot: string
  problemDescription: string
  estimatedCost: number
  distanceKm?: number
  estimatedArrivalMinutes?: number
  createdAt: string
  updatedAt?: string
}

export default function RequestListPage() {
  const navigate = useNavigate()
  const [requests, setRequests] = useState<RequestItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'>('ALL')
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [copiedId, setCopiedId] = useState<number | null>(null)

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [bookingToDelete, setBookingToDelete] = useState<RequestItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchMyRequests = async (showLoading = false) => {
    if (showLoading) setRefreshing(true)
    try {
      const res = await api.get('/requests/my')
      if (res.data?.data && Array.isArray(res.data.data)) {
        setRequests(res.data.data)
      } else {
        setRequests([])
      }
    } catch (err) {
      console.error('Error fetching requests', err)
      setRequests([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchMyRequests()
    const pollInterval = setInterval(() => fetchMyRequests(false), 4000)
    window.addEventListener('storage', () => fetchMyRequests(false))
    window.addEventListener('fixmate_job_updated', () => fetchMyRequests(false))
    return () => {
      clearInterval(pollInterval)
      window.removeEventListener('storage', () => fetchMyRequests(false))
      window.removeEventListener('fixmate_job_updated', () => fetchMyRequests(false))
    }
  }, [])

  // Helper to normalize status string
  const getNormalizedStatus = (req: RequestItem): string => {
    if (req.statusText) return req.statusText.toLowerCase()
    if (typeof req.status === 'string') return req.status.toLowerCase()
    
    // Fallback based on enum numbers if status is numeric
    switch (Number(req.status)) {
      case 1: return 'created'
      case 2: return 'providerassigned'
      case 3: return 'provideraccepted'
      case 4: return 'ontheway'
      case 5: return 'arrived'
      case 6: return 'invoiced'
      case 7: return 'inprogress'
      case 8: return 'pendingapproval'
      case 9: return 'completed'
      case 10: return 'cancelled'
      case 11: return 'rejected'
      case 12: return 'assigned'
      case 13: return 'pending'
      default: return 'created'
    }
  }

  // Copy booking ID helper
  const handleCopyId = (id: number) => {
    navigator.clipboard.writeText(`#${id}`)
    setCopiedId(id)
    toast.success(`Booking ID #${id} copied!`)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // Open delete modal
  const openDeleteModal = (req: RequestItem, e: React.MouseEvent) => {
    e.stopPropagation()
    setBookingToDelete(req)
    setDeleteModalOpen(true)
  }

  // Confirm delete request
  const handleConfirmDelete = async () => {
    if (!bookingToDelete) return
    setIsDeleting(true)
    try {
      const res = await api.delete(`/requests/${bookingToDelete.id}`)
      if (res.data?.success || res.status === 200) {
        toast.success(`Booking #${bookingToDelete.id} deleted successfully`)
        // Optimistically update list
        setRequests((prev) => prev.filter((r) => r.id !== bookingToDelete.id))
        setDeleteModalOpen(false)
        setBookingToDelete(null)
        window.dispatchEvent(new Event('fixmate_job_updated'))
      } else {
        toast.error(res.data?.message || 'Failed to delete booking')
      }
    } catch (err: any) {
      console.error('Delete error', err)
      const errorMsg = err?.response?.data?.message || 'Failed to delete booking'
      toast.error(errorMsg)
    } finally {
      setIsDeleting(false)
    }
  }

  // Category Icon Resolver
  const getCategoryIcon = (categoryName: string) => {
    const name = categoryName?.toLowerCase() || ''
    if (name.includes('electr') || name.includes('power')) return <Zap size={16} className="text-amber-500" />
    if (name.includes('plumb') || name.includes('sanitar')) return <Droplets size={16} className="text-cyan-500" />
    if (name.includes('ac') || name.includes('hvac') || name.includes('cool')) return <Wind size={16} className="text-sky-500" />
    if (name.includes('clean') || name.includes('deep')) return <Sparkles size={16} className="text-teal-500" />
    if (name.includes('carpent') || name.includes('furnitur')) return <Hammer size={16} className="text-orange-500" />
    if (name.includes('paint') || name.includes('wall')) return <Paintbrush size={16} className="text-rose-500" />
    if (name.includes('appliance') || name.includes('tv') || name.includes('refrigerat')) return <Tv size={16} className="text-indigo-500" />
    if (name.includes('pest') || name.includes('disinfect')) return <ShieldAlert size={16} className="text-red-500" />
    if (name.includes('purifier') || name.includes('geyser') || name.includes('ro')) return <Flame size={16} className="text-emerald-500" />
    if (name.includes('cctv') || name.includes('smart') || name.includes('camera')) return <Camera size={16} className="text-purple-500" />
    return <Wrench size={16} className="text-blue-500" />
  }

  // Status Badge Component
  const renderStatusBadge = (req: RequestItem) => {
    const status = getNormalizedStatus(req)
    switch (status) {
      case 'created':
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200/80 px-3 py-1 text-xs font-bold text-amber-800 shadow-2xs">
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
            Searching Provider
          </span>
        )
      case 'providerassigned':
      case 'assigned':
      case 'provideraccepted':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-xs font-bold text-blue-700 shadow-2xs">
            <span className="h-2 w-2 rounded-full bg-blue-600" />
            Specialist Assigned
          </span>
        )
      case 'ontheway':
      case 'arrived':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 border border-indigo-200 px-3 py-1 text-xs font-bold text-indigo-700 shadow-2xs animate-pulse">
            <span className="h-2 w-2 rounded-full bg-indigo-600" />
            Technician On The Way
          </span>
        )
      case 'inprogress':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 border border-purple-200 px-3 py-1 text-xs font-bold text-purple-700 shadow-2xs">
            <span className="h-2 w-2 rounded-full bg-purple-600 animate-pulse" />
            Work In Progress
          </span>
        )
      case 'completed':
      case 'paid':
      case 'reviewed':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-700 shadow-2xs">
            <CheckCircle2 size={13} className="text-emerald-600" />
            Completed
          </span>
        )
      case 'cancelled':
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 border border-rose-200 px-3 py-1 text-xs font-bold text-rose-700 shadow-2xs">
            <X size={13} className="text-rose-600" />
            Cancelled
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-700">
            {req.statusText || status}
          </span>
        )
    }
  }

  // Summary Metrics Computation
  const metrics = useMemo(() => {
    const total = requests.length
    let active = 0
    let completed = 0
    let cancelled = 0
    let totalSpent = 0

    requests.forEach((r) => {
      const st = getNormalizedStatus(r)
      if (['created', 'pending', 'providerassigned', 'assigned', 'provideraccepted', 'ontheway', 'arrived', 'inprogress'].includes(st)) {
        active++
      } else if (['completed', 'paid', 'reviewed'].includes(st)) {
        completed++
        totalSpent += r.estimatedCost || 0
      } else if (['cancelled', 'rejected'].includes(st)) {
        cancelled++
      }
    })

    return { total, active, completed, cancelled, totalSpent }
  }, [requests])

  // Extract unique categories for filter
  const uniqueCategories = useMemo(() => {
    const set = new Set<string>()
    requests.forEach((r) => {
      if (r.categoryName) set.add(r.categoryName)
    })
    return Array.from(set)
  }, [requests])

  // Filtered Requests
  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      const status = getNormalizedStatus(r)

      // Tab filter
      if (statusFilter === 'ACTIVE') {
        if (!['created', 'pending', 'providerassigned', 'assigned', 'provideraccepted', 'ontheway', 'arrived', 'inprogress'].includes(status)) {
          return false
        }
      } else if (statusFilter === 'COMPLETED') {
        if (!['completed', 'paid', 'reviewed'].includes(status)) {
          return false
        }
      } else if (statusFilter === 'CANCELLED') {
        if (!['cancelled', 'rejected'].includes(status)) {
          return false
        }
      }

      // Category filter
      if (selectedCategory !== 'ALL' && r.categoryName !== selectedCategory) {
        return false
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim()
        const matchId = `#${r.id}`.includes(query) || r.id.toString().includes(query)
        const matchService = r.serviceName?.toLowerCase().includes(query)
        const matchCategory = r.categoryName?.toLowerCase().includes(query)
        const matchProvider = r.providerName?.toLowerCase().includes(query)
        const matchAddress = r.addressText?.toLowerCase().includes(query)
        const matchDesc = r.problemDescription?.toLowerCase().includes(query)
        if (!matchId && !matchService && !matchCategory && !matchProvider && !matchAddress && !matchDesc) {
          return false
        }
      }

      return true
    })
  }, [requests, statusFilter, selectedCategory, searchQuery])

  return (
    <div className="space-y-8 pb-16">
      {/* ── 1. Top Header Banner ────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-900 p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute -right-10 -top-10 h-60 w-60 rounded-full bg-blue-500/20 blur-3xl pointer-events-none" />
        <div className="absolute right-1/3 -bottom-10 h-48 w-48 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur-md text-blue-200 border border-white/10">
              <ShieldCheck size={14} className="text-emerald-400" />
              <span>FixMate Guaranteed Home Services</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              My Service Bookings
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              Track live technician dispatches, view invoice records, or cancel & delete bookings anytime.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => fetchMyRequests(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 border border-white/15 px-3.5 py-2.5 text-xs font-bold text-white hover:bg-white/20 transition backdrop-blur-md disabled:opacity-50"
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
            <Link
              to="/requests/new"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-lg shadow-blue-500/30 hover:from-blue-600 hover:to-indigo-700 transition"
            >
              <PlusCircle size={16} /> Book New Service
            </Link>
          </div>
        </div>
      </div>

      {/* ── 2. Metric Summary Cards ────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold">Total Bookings</span>
            <div className="h-8 w-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Clock size={16} />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-gray-900">{metrics.total}</div>
          <p className="text-[11px] text-gray-500 mt-0.5">All scheduled repairs</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold">In-Progress / Active</span>
            <div className="h-8 w-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Zap size={16} />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-amber-600 flex items-center gap-2">
            {metrics.active}
            {metrics.active > 0 && (
              <span className="inline-flex h-2.5 w-2.5 rounded-full bg-amber-500 animate-ping" />
            )}
          </div>
          <p className="text-[11px] text-gray-500 mt-0.5">Live dispatch & pending work</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold">Completed Services</span>
            <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-600">{metrics.completed}</div>
          <p className="text-[11px] text-gray-500 mt-0.5">Successfully serviced</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold">Warranty Protected</span>
            <div className="h-8 w-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <ShieldCheck size={16} />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-purple-700">30 Days</div>
          <p className="text-[11px] text-gray-500 mt-0.5">Post-repair coverage active</p>
        </div>
      </div>

      {/* ── 3. Filters & Search Bar ────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
        {/* Status Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { key: 'ALL', label: 'All Bookings', count: metrics.total },
            { key: 'ACTIVE', label: 'Active & In-Progress', count: metrics.active },
            { key: 'COMPLETED', label: 'Completed', count: metrics.completed },
            { key: 'CANCELLED', label: 'Cancelled', count: metrics.cancelled }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key as any)}
              className={`rounded-xl px-3.5 py-2 text-xs font-bold transition flex items-center gap-2 ${
                statusFilter === tab.key
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`rounded-md px-1.5 py-0.5 text-[10px] font-extrabold ${
                  statusFilter === tab.key ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search & Category Filter */}
        <div className="flex items-center gap-2.5">
          {uniqueCategories.length > 0 && (
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-700 outline-none focus:border-blue-500 focus:bg-white"
            >
              <option value="ALL">All Domains ({uniqueCategories.length})</option>
              {uniqueCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}

          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by ID, name, pro..."
              className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-8 pr-7 py-2 text-xs text-gray-800 placeholder-gray-400 outline-none focus:border-blue-500 focus:bg-white transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── 4. Bookings List ───────────────────────────────────────────── */}
      {loading ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center space-y-3">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="text-xs font-semibold text-gray-500">Loading your service bookings...</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-12 sm:p-16 text-center space-y-4 shadow-xs">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <Clock size={32} />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-lg font-bold text-gray-900">No service bookings found</h3>
            <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
              {searchQuery || selectedCategory !== 'ALL' || statusFilter !== 'ALL'
                ? 'No bookings match your current search and filter criteria. Try clearing filters.'
                : 'You have no active or previous bookings. Get certified technicians in Valsad within 45 minutes.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {(searchQuery || selectedCategory !== 'ALL' || statusFilter !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchQuery('')
                  setSelectedCategory('ALL')
                  setStatusFilter('ALL')
                }}
                className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 transition"
              >
                Reset Filters
              </button>
            )}
            <Link
              to="/requests/new"
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-blue-700 transition"
            >
              <PlusCircle size={14} /> Book a Service Now
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((req) => {
            const statusNorm = getNormalizedStatus(req)
            const isCompleted = ['completed', 'paid', 'reviewed'].includes(statusNorm)
            const isCancelled = ['cancelled', 'rejected'].includes(statusNorm)

            return (
              <div
                key={req.id}
                className="group relative overflow-hidden rounded-2xl border border-gray-200/90 bg-white p-5 sm:p-6 transition-all duration-200 hover:border-blue-400 hover:shadow-lg space-y-4.5"
              >
                {/* Status Indicator Stripe */}
                <div
                  className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                    isCompleted
                      ? 'bg-emerald-500'
                      : isCancelled
                      ? 'bg-rose-400'
                      : statusNorm === 'inprogress'
                      ? 'bg-purple-500'
                      : statusNorm === 'ontheway'
                      ? 'bg-indigo-500'
                      : 'bg-blue-500'
                  }`}
                />

                {/* Card Top: ID, Category, Service Name, Status Badge */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-gray-100 pb-4">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Click to Copy ID */}
                      <button
                        onClick={() => handleCopyId(req.id)}
                        className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2 py-0.5 text-xs font-extrabold text-blue-700 hover:bg-blue-100 transition group/id"
                        title="Click to copy booking ID"
                      >
                        <span>#{req.id}</span>
                        {copiedId === req.id ? (
                          <Check size={11} className="text-emerald-600" />
                        ) : (
                          <Copy size={11} className="text-blue-400 group-hover/id:text-blue-700" />
                        )}
                      </button>

                      {/* Category Badge */}
                      <span className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-700">
                        {getCategoryIcon(req.categoryName)}
                        <span>{req.categoryName || 'General Service'}</span>
                      </span>

                      <span className="text-[11px] text-gray-400">
                        Booked on {new Date(req.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-gray-900 group-hover:text-blue-600 transition">
                      {req.serviceName}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 self-start">
                    {renderStatusBadge(req)}
                  </div>
                </div>

                {/* Card Middle Grid: Date/Slot, Location, Cost */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs text-gray-600">
                  <div className="flex items-center gap-2.5 rounded-xl bg-gray-50/80 p-2.5 border border-gray-100">
                    <Calendar size={15} className="text-blue-600 shrink-0" />
                    <div>
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Scheduled Slot</p>
                      <p className="font-bold text-gray-800">
                        {new Date(req.scheduledDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}{' '}
                        · {req.preferredTimeSlot}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 rounded-xl bg-gray-50/80 p-2.5 border border-gray-100">
                    <MapPin size={15} className="text-rose-500 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Service Location</p>
                      <p className="font-bold text-gray-800 truncate" title={req.addressText}>
                        {req.addressText ? `${req.addressText}, ${req.city || 'Valsad'}` : 'Saved Address, Valsad'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 rounded-xl bg-gray-50/80 p-2.5 border border-gray-100">
                    <div>
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider text-left sm:text-right">Upfront Total</p>
                      <p className="text-base font-extrabold text-emerald-600">
                        ₹{req.estimatedCost}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Problem Description Preview (if any) */}
                {req.problemDescription && (
                  <div className="rounded-xl bg-slate-50 p-2.5 text-xs text-gray-600 border border-slate-100 flex items-start gap-2">
                    <span className="font-bold text-gray-700 shrink-0">Issue Note:</span>
                    <span className="italic text-gray-600 line-clamp-1">{req.problemDescription}</span>
                  </div>
                )}

                {/* Provider Assignment Card OR Radar Broadcast Notice */}
                {req.providerName ? (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl bg-gradient-to-r from-blue-50/70 via-sky-50/50 to-indigo-50/70 p-3.5 border border-blue-100/80 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white font-extrabold text-xs shadow-xs">
                        {req.providerName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="font-bold text-gray-900">{req.providerName}</p>
                          <span className="rounded-md bg-emerald-100 px-1.5 py-0.2 text-[9px] font-extrabold text-emerald-800">
                            Verified Pro
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500">
                          {req.providerRating ? `⭐ ${req.providerRating.toFixed(1)} Rating` : '⭐ 4.9 Rating'} · {req.providerExperienceYears ? `${req.providerExperienceYears}+ Yrs Exp` : 'Certified Specialist'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center">
                      {req.providerPhone && (
                        <a
                          href={`tel:${req.providerPhone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 shadow-xs transition"
                        >
                          <Phone size={12} /> Call Specialist
                        </a>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 rounded-xl bg-amber-50/60 p-3 border border-amber-100/80 text-xs text-amber-900">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700 shrink-0">
                      <Zap size={16} className="animate-pulse" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold">Automated Specialist Dispatch Active</p>
                      <p className="text-[11px] text-amber-700 truncate">
                        FixMate is notifying top-rated certified partners in Valsad for immediate confirmation.
                      </p>
                    </div>
                  </div>
                )}

                {/* Card Actions Footer */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    {/* Delete Option with Confirmation Trigger */}
                    <button
                      type="button"
                      onClick={(e) => openDeleteModal(req, e)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50/60 px-3.5 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 hover:border-rose-300 transition"
                      title="Delete / Cancel this service booking"
                    >
                      <Trash2 size={13} />
                      <span>Delete Booking</span>
                    </button>

                    {/* Re-book quick action for completed/cancelled */}
                    {(isCompleted || isCancelled) && (
                      <button
                        onClick={() => navigate(`/requests/new?serviceId=${req.serviceId}`)}
                        className="inline-flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 transition"
                      >
                        <RotateCcw size={12} />
                        <span>Book Again</span>
                      </button>
                    )}
                  </div>

                  {/* Primary Track Live Status CTA */}
                  <button
                    onClick={() => navigate(`/requests/${req.id}`)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition"
                  >
                    <span>Track Live Status</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── 5. Delete Confirmation Modal ───────────────────────────────── */}
      {deleteModalOpen && bookingToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 sm:p-7 shadow-2xl border border-gray-100 space-y-5">
            {/* Modal Header */}
            <div className="flex items-start gap-3.5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 shrink-0">
                <Trash2 size={24} />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-extrabold text-gray-900">Delete Service Booking?</h3>
                <p className="text-xs text-gray-500">
                  Are you sure you want to remove this booking from your account records?
                </p>
              </div>
            </div>

            {/* Booking Summary Box */}
            <div className="rounded-2xl bg-gray-50 p-4 border border-gray-200 space-y-2 text-xs">
              <div className="flex justify-between items-center text-gray-600">
                <span className="font-semibold">Booking ID:</span>
                <span className="font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                  #{bookingToDelete.id}
                </span>
              </div>
              <div className="flex justify-between items-center text-gray-600">
                <span className="font-semibold">Service:</span>
                <span className="font-bold text-gray-900">{bookingToDelete.serviceName}</span>
              </div>
              <div className="flex justify-between items-center text-gray-600">
                <span className="font-semibold">Scheduled Date:</span>
                <span>
                  {new Date(bookingToDelete.scheduledDate).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </span>
              </div>
              <div className="flex justify-between items-center text-gray-600 border-t border-gray-200 pt-2 font-bold">
                <span>Total Amount:</span>
                <span className="text-emerald-600 font-extrabold text-sm">₹{bookingToDelete.estimatedCost}</span>
              </div>
            </div>

            <p className="text-xs text-gray-500 bg-amber-50 p-3 rounded-xl border border-amber-200/80 text-amber-800">
              <AlertTriangle size={14} className="inline mr-1 text-amber-600" />
              This will remove the booking request from active technician dispatch and your dashboard history.
            </p>

            {/* Modal Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => {
                  setDeleteModalOpen(false)
                  setBookingToDelete(null)
                }}
                className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
              >
                Keep Booking
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-rose-700 transition disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw size={13} className="animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={13} />
                    <span>Yes, Delete Booking</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
