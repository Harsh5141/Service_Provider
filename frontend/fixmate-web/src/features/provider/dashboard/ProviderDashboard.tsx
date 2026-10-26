import { useState, useEffect } from 'react'
import {
  DollarSign, Wrench, Star, CheckCircle, Clock,
  MapPin, Phone, Check, X, Lock,
  TrendingUp, Navigation, Plus, PackageCheck, Trash2,
  Camera, Upload, FileImage
} from 'lucide-react'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts'
import api from '@/lib/apiClient'
import toast from 'react-hot-toast'
import { getRequestOtp } from '@/lib/otpUtils'
import {
  getAdditionalQuote, saveAdditionalQuote, AdditionalServiceQuote, AdditionalPartItem
} from '@/lib/additionalServicesStorage'

const EARNINGS_CHART_DATA = [
  { day: 'Mon', earnings: 1200, jobs: 3 },
  { day: 'Tue', earnings: 1850, jobs: 4 },
  { day: 'Wed', earnings: 1450, jobs: 3 },
  { day: 'Thu', earnings: 2100, jobs: 5 },
  { day: 'Fri', earnings: 1600, jobs: 4 },
  { day: 'Sat', earnings: 2800, jobs: 6 },
  { day: 'Sun', earnings: 2400, jobs: 5 }
]

export default function ProviderDashboard() {
  const [isOnline, setIsOnline] = useState(true)
  const [togglingOnline, setTogglingOnline] = useState(false)
  const [otpInput, setOtpInput] = useState('')

  // Active Job State loaded dynamically from DB
  const [activeJob, setActiveJob] = useState<any>(null)
  const [incomingJobs, setIncomingJobs] = useState<any[]>([])
  const [todayEarnings, setTodayEarnings] = useState<number>(1450)
  const [totalEarnings, setTotalEarnings] = useState<number>(28400)
  const [completedJobsCount, setCompletedJobsCount] = useState<number>(42)

  // Additional Services & Spare Part Replacement State
  const [activeQuote, setActiveQuote] = useState<AdditionalServiceQuote | null>(null)
  const [showAddPartModal, setShowAddPartModal] = useState(false)
  const [modalParts, setModalParts] = useState<Array<{
    tempId: string
    name: string
    price: string
    imageUrl: string
    reason: string
  }>>([
    {
      tempId: '1',
      name: '',
      price: '',
      imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=300&auto=format&fit=crop&q=80',
      reason: ''
    }
  ])
  const [additionalLaborCharge, setAdditionalLaborCharge] = useState('')
  // Service Details Changes
  const [serviceNameChange, setServiceNameChange] = useState('')
  const [serviceScopeNotes, setServiceScopeNotes] = useState('')
  const [revisedEstimatedMinutes, setRevisedEstimatedMinutes] = useState('')
  const [extraServicesList, setExtraServicesList] = useState<Array<{
    tempId: string
    title: string
    charge: string
    description: string
  }>>([])

  // Sync quote when activeJob changes or quote is updated
  useEffect(() => {
    if (!activeJob?.id) {
      setActiveQuote(null)
      return
    }
    const loadQuote = () => {
      const q = getAdditionalQuote(activeJob.id)
      setActiveQuote(q)
    }
    loadQuote()
    const handleQuoteUpdate = (e: any) => {
      if (e?.detail?.jobId === activeJob.id || !e?.detail?.jobId) {
        loadQuote()
      }
    }
    window.addEventListener('fixmate_quote_updated', handleQuoteUpdate)
    window.addEventListener('storage', loadQuote)
    return () => {
      window.removeEventListener('fixmate_quote_updated', handleQuoteUpdate)
      window.removeEventListener('storage', loadQuote)
    }
  }, [activeJob?.id])

  // Fetch real provider dashboard data from Database API
  useEffect(() => {
    const fetchDashboardFromDb = async () => {
      try {
        const res = await api.get('/provider/dashboard')
        if (res.data?.data) {
          const d = res.data.data
          setIsOnline(d.isAvailable ?? true)
          setTodayEarnings(d.todayEarnings ?? 1450)
          setTotalEarnings(d.totalEarnings ?? 28400)
          setCompletedJobsCount(d.completedJobsCount ?? 42)

          // Load active request from DB
          const activeList: any[] = d.activeRequests || []
          if (activeList.length > 0) {
            const top = activeList[0]
            const isComp = localStorage.getItem(`fixmate_active_job_completed_${top.id}`) === 'true'
            const stStr = (top.status || top.statusText || '').toString().toLowerCase()
            const isDone = stStr.includes('completed') || stStr.includes('paid') || stStr.includes('reviewed')

            if (!isComp && !isDone) {
              const currentStatus = (stStr.includes('inprogress') || stStr.includes('in progress'))
                ? 'InProgress'
                : 'OnTheWay'

              setActiveJob({
                id: top.id,
                status: currentStatus,
                customerName: top.customerName || 'Customer',
                customerPhone: top.customerPhone || '+91 98765 43210',
                address: top.addressText || `${top.city || ''} ${top.state || ''} ${top.postalCode || ''}`.trim() || 'Service Location',
                serviceName: top.serviceName || 'Home Maintenance Service',
                scheduledSlot: top.preferredTimeSlot || 'Today, Scheduled Slot',
                payout: top.estimatedCost ? Number(top.estimatedCost) * 0.85 : 465.00,
                otp: getRequestOtp(top.id)
              })
            } else {
              setActiveJob(null)
            }
          } else {
            setActiveJob(null)
          }

          // Load incoming requests from DB, filtering out locally declined jobs
          const declinedIds: number[] = JSON.parse(localStorage.getItem('fixmate_declined_jobs') || '[]')
          const incomingList: any[] = (d.incomingRequests || []).filter((j: any) => !declinedIds.includes(j.id))

          if (incomingList.length > 0) {
            setIncomingJobs(incomingList.map((j) => ({
              id: j.id,
              serviceName: j.serviceName || 'Service Request',
              category: j.categoryName || 'General',
              customerName: j.customerName || 'Customer',
              customerPhone: j.customerPhone || '',
              distance: j.distanceKm ? `${j.distanceKm.toFixed(1)} km away` : '2.5 km away',
              address: j.addressText || `${j.city || ''} ${j.state || ''} ${j.postalCode || ''}`.trim() || 'Service Location',
              slot: j.preferredTimeSlot || 'Scheduled Slot',
              payout: j.estimatedCost ? Math.round(Number(j.estimatedCost) * 0.85 * 100) / 100 : 340.00,
              isLocked: Boolean(j.isLocked),
              lockedBy: j.lockedByProviderName || 'Another Partner'
            })))
          } else {
            setIncomingJobs([])
          }
        }
      } catch (err) {
        console.error('Failed to load provider dashboard from DB', err)
      }
    }

    fetchDashboardFromDb()
    window.addEventListener('storage', fetchDashboardFromDb)
    window.addEventListener('fixmate_job_updated', fetchDashboardFromDb)
    return () => {
      window.removeEventListener('storage', fetchDashboardFromDb)
      window.removeEventListener('fixmate_job_updated', fetchDashboardFromDb)
    }
  }, [])

  const toggleAvailability = async () => {
    setTogglingOnline(true)
    try {
      const nextState = !isOnline
      await api.put('/provider/availability', { isAvailable: nextState })
      setIsOnline(nextState)
      toast.success(nextState ? 'You are now ONLINE and visible to nearby customers!' : 'You are now OFFLINE.')
    } catch (err) {
      setIsOnline(!isOnline)
      toast.success(!isOnline ? 'Online status updated' : 'Offline status updated')
    } finally {
      setTogglingOnline(false)
    }
  }

  const handleAcceptIncoming = async (jobId: number) => {
    try {
      const res = await api.put(`/provider/jobs/${jobId}/accept`)
      setIncomingJobs((prev) => prev.filter((j) => j.id !== jobId))

      // Lock job to active state
      const targetJob = incomingJobs.find((j) => j.id === jobId)
      if (targetJob) {
        setActiveJob({
          id: jobId,
          status: 'OnTheWay',
          customerName: targetJob.customerName || 'Customer',
          customerPhone: targetJob.customerPhone || '+91 98765 43210',
          address: targetJob.address || 'Service Location',
          serviceName: targetJob.serviceName || 'Home Service',
          scheduledSlot: targetJob.slot || 'Scheduled Slot',
          payout: targetJob.payout || 465.00,
          otp: getRequestOtp(jobId)
        })
      }

      window.dispatchEvent(new Event('fixmate_job_updated'))
      toast.success(res.data?.message || `Job #${jobId} accepted! Locked to your account.`)
    } catch (err: any) {
      setIncomingJobs((prev) => prev.filter((j) => j.id !== jobId))
      if (err?.response?.status === 409) {
        toast.error(`Job #${jobId} was already accepted by another technician! Job locked.`)
      } else {
        toast.error(err?.response?.data?.message || 'Failed to accept job. It may no longer be available.')
      }
    }
  }

  const handleDeclineIncoming = async (jobId: number) => {
    try {
      const declinedIds: number[] = JSON.parse(localStorage.getItem('fixmate_declined_jobs') || '[]')
      if (!declinedIds.includes(jobId)) {
        declinedIds.push(jobId)
        localStorage.setItem('fixmate_declined_jobs', JSON.stringify(declinedIds))
      }
      setIncomingJobs((prev) => prev.filter((j) => j.id !== jobId))
      await api.put(`/provider/jobs/${jobId}/reject`)
      toast('Job declined and removed from queue.', { icon: 'ℹ️' })
    } catch {
      setIncomingJobs((prev) => prev.filter((j) => j.id !== jobId))
      toast('Job declined and removed from queue.', { icon: 'ℹ️' })
    }
  }

  const handleDeclineAll = async () => {
    if (incomingJobs.length === 0) return
    const idsToDecline = incomingJobs.map((j) => j.id)
    const declinedIds: number[] = JSON.parse(localStorage.getItem('fixmate_declined_jobs') || '[]')
    const updatedDeclined = Array.from(new Set([...declinedIds, ...idsToDecline]))
    localStorage.setItem('fixmate_declined_jobs', JSON.stringify(updatedDeclined))
    setIncomingJobs([])

    for (const id of idsToDecline) {
      try {
        await api.put(`/provider/jobs/${id}/reject`)
      } catch {
        // ignore individual rejection failure
      }
    }
    toast.success('All incoming job requests declined and cleared from your dashboard.')
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    const expectedOtp = activeJob?.otp || getRequestOtp(activeJob?.id)
    if (otpInput.trim() === expectedOtp) {
      const jobId = activeJob?.id || 104
      // Transition strictly to InProgress (Step 4) - do NOT jump to Completed
      setActiveJob((prev: any) => prev ? ({ ...prev, status: 'InProgress' }) : prev)

      try {
        await api.put(`/provider/jobs/${jobId}/status`, { status: 4, note: 'Customer OTP verified, work started' })
      } catch (err) {
        console.error('Error updating status to in-progress', err)
      }

      try {
        localStorage.setItem(`fixmate_active_job_status_${jobId}`, JSON.stringify({
          status: 'InProgress',
          step: 4,
          statusText: 'In Progress'
        }))
        localStorage.setItem('fixmate_last_job_sync', Date.now().toString())
        window.dispatchEvent(new Event('fixmate_job_updated'))
      } catch (e) {
        // localStorage fallback
      }
      toast.success('Customer OTP verified! Service is now In Progress.')
    } else {
      toast.error('Invalid OTP. Please ask customer for the correct 4-digit start OTP.')
    }
  }

  const handleCancelJob = async () => {
    const jobId = activeJob?.id || 104
    try {
      await api.put(`/provider/jobs/${jobId}/cancel`, { reason: 'Technician unavailable' })
    } catch { }

    try {
      localStorage.setItem(`fixmate_active_job_status_${jobId}`, JSON.stringify({
        status: 'Created',
        step: 1,
        statusText: 'Re-enabled for all providers'
      }))
      localStorage.removeItem(`fixmate_active_job_completed_${jobId}`)
      localStorage.setItem('fixmate_last_job_sync', Date.now().toString())
      window.dispatchEvent(new Event('fixmate_job_updated'))
    } catch { }

    toast.error(`Job #${jobId} cancelled. Lock released and request re-enabled for all providers.`)
    setActiveJob(null)
  }

  const handleCompleteJob = async () => {
    const jobId = activeJob?.id || 104
    setActiveJob((prev: any) => prev ? ({ ...prev, status: 'Completed' }) : prev)

    try {
      await api.put(`/provider/jobs/${jobId}/status`, { status: 5, note: 'Provider completed job' })
    } catch (err) {
      console.error('Error completing job', err)
    }

    try {
      localStorage.setItem(`fixmate_active_job_status_${jobId}`, JSON.stringify({
        status: 'Completed',
        step: 5,
        statusText: 'Completed'
      }))
      localStorage.setItem(`fixmate_active_job_completed_${jobId}`, 'true')
      localStorage.setItem('fixmate_last_job_sync', Date.now().toString())
      window.dispatchEvent(new Event('fixmate_job_updated'))
    } catch (e) {
      // localStorage fallback
    }
    toast.success('Job marked as Completed! Payout added to your balance.')
    setTimeout(() => {
      setActiveJob(null)
    }, 2000)
  }

  const handleAddPartRow = () => {
    setModalParts((prev) => [
      ...prev,
      {
        tempId: Date.now().toString(),
        name: '',
        price: '',
        imageUrl: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=300&auto=format&fit=crop&q=80',
        reason: ''
      }
    ])
  }

  const handleRemovePartRow = (tempId: string) => {
    if (modalParts.length <= 1) {
      toast.error('At least one part is required')
      return
    }
    setModalParts((prev) => prev.filter((p) => p.tempId !== tempId))
  }

  const handleUpdatePartRow = (tempId: string, field: 'name' | 'price' | 'imageUrl' | 'reason', val: string) => {
    setModalParts((prev) =>
      prev.map((p) => (p.tempId === tempId ? { ...p, [field]: val } : p))
    )
  }

  const handleFileCapture = (tempId: string, file: File | null) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose a valid image file')
      return
    }
    // Limit to reasonable preview size
    if (file.size > 8 * 1024 * 1024) {
      toast.error('Image size should be under 8MB')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string
      if (dataUrl) {
        handleUpdatePartRow(tempId, 'imageUrl', dataUrl)
        toast.success('Product photo captured from camera/device!')
      }
    }
    reader.onerror = () => {
      toast.error('Failed to read image file')
    }
    reader.readAsDataURL(file)
  }

  const handleAddSparePartQuote = (e: React.FormEvent) => {
    e.preventDefault()

    // Validate all rows
    const validPartsToAdd: AdditionalPartItem[] = []
    for (const p of modalParts) {
      if (!p.name.trim()) {
        toast.error('All added parts must have a product name')
        return
      }
      const priceNum = parseFloat(p.price) || 0
      if (priceNum <= 0) {
        toast.error(`Please enter a valid price for "${p.name || 'part'}"`)
        return
      }
      validPartsToAdd.push({
        id: (Date.now() + Math.random()).toString(),
        name: p.name.trim(),
        price: priceNum,
        imageUrl: p.imageUrl.trim() || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=300&auto=format&fit=crop&q=80',
        reason: p.reason.trim() || 'Component worn out / replaced during diagnosis'
      })
    }

    // Parse extra services
    const extraServicesFormatted = extraServicesList
      .filter((s) => s.title.trim() && (parseFloat(s.charge) || 0) > 0)
      .map((s) => ({
        id: s.tempId,
        title: s.title.trim(),
        charge: parseFloat(s.charge) || 0,
        description: s.description.trim()
      }))

    const extraServicesTotal = extraServicesFormatted.reduce((acc, s) => acc + s.charge, 0)
    const currentParts: AdditionalPartItem[] = activeQuote ? [...activeQuote.parts] : []
    const updatedParts = [...currentParts, ...validPartsToAdd]
    const laborNum = parseFloat(additionalLaborCharge) || (activeQuote?.additionalLaborCharge || 0)
    const partsTotal = updatedParts.reduce((sum, p) => sum + p.price, 0)
    const totalAdditional = partsTotal + laborNum + extraServicesTotal

    const updatedQuote: AdditionalServiceQuote = {
      jobId: activeJob.id,
      status: 'PENDING_APPROVAL',
      parts: updatedParts,
      additionalLaborCharge: laborNum,
      totalAdditionalAmount: totalAdditional,
      proposedAt: new Date().toISOString(),
      notes: validPartsToAdd.map((p) => p.reason).filter(Boolean).join('; ') || undefined,
      serviceNameChange: serviceNameChange.trim() || undefined,
      serviceScopeNotes: serviceScopeNotes.trim() || undefined,
      revisedEstimatedMinutes: revisedEstimatedMinutes ? parseInt(revisedEstimatedMinutes, 10) : undefined,
      extraServices: extraServicesFormatted.length > 0 ? extraServicesFormatted : undefined
    }

    saveAdditionalQuote(updatedQuote)
    setActiveQuote(updatedQuote)
    toast.success(`Service details & ${validPartsToAdd.length} part(s) updated! Sent to customer for approval.`)
    setShowAddPartModal(false)
    setModalParts([
      {
        tempId: Date.now().toString(),
        name: '',
        price: '',
        imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=300&auto=format&fit=crop&q=80',
        reason: ''
      }
    ])
    setAdditionalLaborCharge('')
    setServiceNameChange('')
    setServiceScopeNotes('')
    setRevisedEstimatedMinutes('')
    setExtraServicesList([])
  }

  const handleRemovePart = (partId: string) => {
    if (!activeQuote) return
    const updatedParts = activeQuote.parts.filter((p) => p.id !== partId)
    const partsTotal = updatedParts.reduce((sum, p) => sum + p.price, 0)
    const totalAdditional = partsTotal + activeQuote.additionalLaborCharge

    const updatedQuote: AdditionalServiceQuote = {
      ...activeQuote,
      parts: updatedParts,
      totalAdditionalAmount: totalAdditional
    }
    saveAdditionalQuote(updatedQuote)
    setActiveQuote(updatedQuote)
    toast.success('Spare part removed from quote')
  }

  return (
    <div className="space-y-8 pb-16">
      {/* ── Top Header Banner with Online Toggle ───────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-900 p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute -right-10 -top-10 h-60 w-60 rounded-full bg-blue-500/20 blur-3xl pointer-events-none" />
        <div className="absolute right-1/3 -bottom-10 h-48 w-48 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur-md text-blue-200 border border-white/10">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                FixMate Partner Command OS
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/20 px-2.5 py-0.5 text-[11px] font-extrabold text-blue-300 border border-blue-500/30">
                FM-PRO-16
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Partner Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              Manage incoming local repair broadcasts, track live technician dispatch, and view daily earnings.
            </p>
          </div>

          {/* Availability Switch */}
          <div className="flex items-center gap-3 rounded-2xl bg-white/15 p-2.5 sm:px-4 sm:py-2.5 border border-white/20 backdrop-blur-md">
            <div className="text-right">
              <p className="text-xs font-bold text-white">
                {isOnline ? 'Online (Accepting Jobs)' : 'Offline (Paused)'}
              </p>
              <p className="text-[10px] text-blue-200">
                {isOnline ? 'Active in Valsad · 15km Radius' : 'Not receiving job broadcasts'}
              </p>
            </div>

            <button
              type="button"
              disabled={togglingOnline}
              onClick={toggleAvailability}
              className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                isOnline ? 'bg-emerald-500 shadow-lg shadow-emerald-500/40' : 'bg-slate-600'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  isOnline ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* ── Metric KPI Bento Cards ────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Today's Payout with Daily Goal */}
        <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 shadow-xs transition hover:shadow-md hover:border-emerald-200">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Today's Payout</span>
            <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <DollarSign size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-gray-900 tracking-tight">₹{todayEarnings.toFixed(2)}</div>
          <div className="mt-2.5 space-y-1">
            <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500">
              <span>Goal: ₹3,000</span>
              <span className="text-emerald-600 font-bold">{Math.round((todayEarnings / 3000) * 100)}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                style={{ width: `${Math.min(100, Math.round((todayEarnings / 3000) * 100))}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card 2: This Month */}
        <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 shadow-xs transition hover:shadow-md hover:border-blue-200">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">This Month</span>
            <div className="h-8 w-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-blue-700 tracking-tight">₹{totalEarnings.toFixed(2)}</div>
          <div className="mt-2 flex items-center justify-between text-[11px]">
            <span className="text-slate-500 font-medium">{completedJobsCount} jobs completed</span>
            <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-blue-700">Top Pro</span>
          </div>
        </div>

        {/* Card 3: Customer Rating */}
        <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 shadow-xs transition hover:shadow-md hover:border-amber-200">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Customer Rating</span>
            <div className="h-8 w-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Star size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600 flex items-center gap-1.5 tracking-tight">
            4.95 <span className="text-base">⭐</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px]">
            <span className="text-slate-500 font-medium">142 verified reviews</span>
            <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">99.2% Positive</span>
          </div>
        </div>

        {/* Card 4: Acceptance Rate */}
        <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 shadow-xs transition hover:shadow-md hover:border-purple-200">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Acceptance Rate</span>
            <div className="h-8 w-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <CheckCircle size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-purple-700 tracking-tight">98%</div>
          <div className="mt-2 flex items-center justify-between text-[11px]">
            <span className="text-purple-600 font-bold">Top 5% Partner Tier</span>
            <span className="text-slate-400 text-[10px] font-medium">&lt;2 min SLA</span>
          </div>
        </div>
      </div>

      {/* ── Active In-Progress Job Card ────────────────────────────────── */}
      {activeJob && (
        <div className="rounded-2xl border border-blue-300 bg-gradient-to-br from-blue-50/80 via-white to-sky-50/50 p-6 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-blue-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-blue-600 px-3 py-0.5 text-xs font-bold text-white animate-pulse">
                  ACTIVE ON-SITE JOB
                </span>
                <span className="text-xs text-gray-500 font-medium">Job #{activeJob.id}</span>
              </div>
              <h2 className="text-xl font-extrabold text-gray-900 mt-1">{activeJob.serviceName}</h2>
            </div>
            <div className="text-right">
              <span className="text-xs text-gray-500">Net Partner Payout</span>
              <p className="text-xl font-black text-emerald-600">₹{activeJob.payout}</p>
            </div>
          </div>

          {/* Customer & Address Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-2 rounded-xl bg-white p-4 border border-blue-100">
              <p className="font-bold text-gray-700 uppercase tracking-wider text-[10px]">Customer Details</p>
              <p className="text-sm font-bold text-gray-900">{activeJob.customerName}</p>
              <div className="flex items-center gap-3 pt-1">
                <a
                  href={`tel:${activeJob.customerPhone}`}
                  className="inline-flex items-center gap-1.5 font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg hover:bg-emerald-100"
                >
                  <Phone size={13} /> {activeJob.customerPhone}
                </a>
              </div>
            </div>

            <div className="space-y-2 rounded-xl bg-white p-4 border border-blue-100">
              <p className="font-bold text-gray-700 uppercase tracking-wider text-[10px]">Service Location</p>
              <p className="text-xs text-gray-800 leading-relaxed font-medium">{activeJob.address}</p>
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(activeJob.address)}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:underline pt-1"
              >
                <Navigation size={12} /> Open in Google Maps
              </a>
            </div>
          </div>

          {/* 5-Step Visual Status Tracker & Action Panels */}
          {(() => {
            const activeStatus = (activeJob?.status || 'OnTheWay').toLowerCase()
            const trackerStep = activeStatus.includes('completed') ? 5 : (activeStatus.includes('inprogress') || activeStatus.includes('in progress')) ? 4 : 3

            return (
              <>
                <div className="rounded-xl bg-white p-5 border border-blue-100 space-y-3">
                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Service Progress Tracker</h4>
                  <div className="relative flex items-center justify-between py-2">
                    {['Booked', 'Assigned', 'On The Way', 'In Progress', 'Completed'].map((label, idx) => {
                      const stepNum = idx + 1
                      const isPassed = stepNum <= trackerStep
                      const isCurrent = stepNum === trackerStep

                      return (
                        <div key={label} className="relative z-10 flex flex-col items-center">
                          <div
                            className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${isPassed
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'bg-gray-200 text-gray-500'
                              } ${isCurrent ? 'ring-4 ring-blue-200 ring-offset-1' : ''}`}
                          >
                            {isPassed ? <Check size={16} /> : stepNum}
                          </div>
                          <span className={`mt-2 text-xs font-medium hidden sm:block ${isCurrent ? 'text-blue-700 font-bold' : 'text-gray-600'}`}>
                            {label}
                          </span>
                        </div>
                      )
                    })}
                    {/* Connecting line */}
                    <div className="absolute top-6 left-4 right-4 -translate-y-1/2 h-1 bg-gray-200 -z-0">
                      <div
                        className="h-full bg-blue-600 transition-all duration-300"
                        style={{
                          width: `${Math.min(100, Math.max(0, ((trackerStep - 1) / 4) * 100))}%`
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Step progression actions */}
                <div className="rounded-xl bg-white p-5 border border-blue-100 space-y-4">
                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Job Progress Action</h4>

                  {trackerStep === 3 && (
                    <form onSubmit={handleVerifyOtp} className="flex flex-col sm:flex-row items-center gap-3">
                      <div className="flex-1 w-full">
                        <label className="text-xs font-bold text-gray-700">Enter Customer Start OTP:</label>
                        <input
                          type="text"
                          maxLength={4}
                          value={otpInput}
                          onChange={(e) => setOtpInput(e.target.value)}
                          placeholder="Enter 4-digit OTP"
                          className="mt-1 w-full rounded-xl border border-gray-300 p-2.5 text-sm font-mono tracking-widest text-center font-bold focus:border-blue-600 outline-none"
                        />
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto mt-auto">
                        <button
                          type="submit"
                          className="flex-1 sm:flex-none rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-bold text-white shadow hover:bg-blue-700 transition cursor-pointer"
                        >
                          Verify OTP & Start Job
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelJob}
                          className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-bold text-red-600 hover:bg-red-100 transition cursor-pointer"
                        >
                          Cancel & Auto-Reassign
                        </button>
                      </div>
                    </form>
                  )}

                  {trackerStep === 4 && (
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div>
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-700 bg-purple-50 px-3 py-1 rounded-full">
                            <Wrench size={14} /> Service Currently Underway
                          </span>
                          <p className="text-xs text-gray-500 mt-1">Add additional service charges or replaced spare parts if required, then complete job.</p>
                        </div>
                        <button
                          onClick={handleCompleteJob}
                          className="w-full sm:w-auto rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white shadow hover:bg-emerald-700 transition cursor-pointer"
                        >
                          ✓ Mark Job Completed & Collect Payment
                        </button>
                      </div>

                      {/* Provider Replaced Spare Parts & Additional Service Charge Tool */}
                      <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 space-y-3">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div>
                            <h5 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                              <PackageCheck size={15} className="text-blue-600" />
                              Additional Services & Replaced Spare Parts
                            </h5>
                            <p className="text-[11px] text-gray-500">
                              Attach replaced part details with photo & price for user approval.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowAddPartModal(true)}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition cursor-pointer"
                          >
                            <Plus size={14} /> Add Part / Extra Charge
                          </button>
                        </div>

                        {activeQuote && activeQuote.parts.length > 0 ? (
                          <div className="space-y-3 pt-2">
                            <div className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-blue-100 text-xs">
                              <span className="text-gray-600 font-medium">Customer Approval Status:</span>
                              <span
                                className={`font-bold px-2.5 py-0.5 rounded-md text-[11px] ${
                                  activeQuote.status === 'APPROVED'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : activeQuote.status === 'REJECTED'
                                    ? 'bg-rose-100 text-rose-800'
                                    : 'bg-amber-100 text-amber-800 animate-pulse'
                                }`}
                              >
                                {activeQuote.status === 'APPROVED'
                                  ? '✓ Approved by Customer'
                                  : activeQuote.status === 'REJECTED'
                                  ? '✗ Declined by Customer'
                                  : '⏳ Awaiting Customer Approval'}
                              </span>
                            </div>

                            {/* List of proposed parts: image, product name, price */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              {activeQuote.parts.map((p) => (
                                <div
                                  key={p.id}
                                  className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-gray-200"
                                >
                                  <img
                                    src={p.imageUrl}
                                    alt={p.name}
                                    className="h-12 w-12 rounded-lg object-cover border border-gray-100 shrink-0 bg-gray-50"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-gray-900 truncate">{p.name}</p>
                                    <p className="text-xs font-black text-emerald-600">₹{p.price.toFixed(2)}</p>
                                    {p.reason && (
                                      <p className="text-[10px] text-gray-400 truncate">{p.reason}</p>
                                    )}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleRemovePart(p.id)}
                                    className="p-1 text-gray-400 hover:text-rose-600 rounded-md"
                                    title="Remove"
                                  >
                                    <X size={14} />
                                  </button>
                                </div>
                              ))}
                            </div>

                            {activeQuote.additionalLaborCharge > 0 && (
                              <div className="flex justify-between text-xs bg-white p-2 rounded-lg border border-gray-100">
                                <span className="text-gray-600 font-medium">Extra Labor / Service Charge:</span>
                                <span className="font-bold text-gray-900">₹{activeQuote.additionalLaborCharge.toFixed(2)}</span>
                              </div>
                            )}

                            <div className="flex justify-between items-center text-xs font-extrabold text-blue-900 border-t border-blue-200/60 pt-2 px-1">
                              <span>Total Additional Bill:</span>
                              <span className="text-emerald-600 text-sm">₹{activeQuote.totalAdditionalAmount.toFixed(2)}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="rounded-lg bg-white/70 p-3 text-center text-xs text-gray-500 border border-dashed border-gray-300">
                            No spare parts or additional services attached to this job yet. Click "Add Part / Extra Charge" to propose.
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {trackerStep === 5 && (
                    <div className="rounded-xl bg-emerald-50 p-4 text-emerald-800 text-center font-bold text-xs flex items-center justify-center gap-2">
                      <CheckCircle size={18} className="text-emerald-600" />
                      Job Marked as Completed! Payout of ₹{activeJob.payout} credited.
                    </div>
                  )}
                </div>
              </>
            )
          })()}
        </div>
      )}

      {/* ── Incoming Dispatch Queue ────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Incoming Job Requests</h2>
            <p className="text-xs sm:text-sm text-gray-500">Live booking opportunities in your service radius</p>
          </div>
          <div className="flex items-center gap-2">
            {incomingJobs.length > 0 && (
              <button
                onClick={handleDeclineAll}
                className="rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-100 transition cursor-pointer"
              >
                Clear All Requests
              </button>
            )}
            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
              {incomingJobs.length} available
            </span>
          </div>
        </div>

        {incomingJobs.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-xs text-gray-400">
            No incoming jobs in queue right now. Keep your app online to receive automated job alerts.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {incomingJobs.map((job) => (
              <div
                key={job.id}
                className={`rounded-2xl border p-5 space-y-4 shadow-2xs transition ${job.isLocked
                    ? 'border-amber-200 bg-amber-50/30'
                    : 'border-gray-200 bg-white hover:border-blue-300'
                  }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">{job.category}</span>
                      {job.isLocked ? (
                        <span className="rounded-full bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 text-[10px] font-bold flex items-center gap-1">
                          <Lock size={10} className="text-amber-700" /> Accepted by {job.lockedBy} (Disabled)
                        </span>
                      ) : (
                        <span className="rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 text-[10px] font-bold flex items-center gap-1 animate-pulse">
                          ● Available to Accept
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-gray-900 mt-1">{job.serviceName}</h3>
                  </div>
                  <span className={`text-base font-extrabold ${job.isLocked ? 'text-gray-500' : 'text-emerald-600'}`}>
                    ₹{Number(job.payout).toFixed(2)}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-gray-600">
                  <p className="flex items-center gap-1.5">
                    <MapPin size={13} className="text-gray-400" /> {job.distance} · {job.address}
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Clock size={13} className="text-gray-400" /> Slot: {job.slot}
                  </p>
                </div>

                <div className="flex gap-2 pt-2 border-t border-gray-100">
                  {job.isLocked ? (
                    <button
                      disabled
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-gray-200 py-2.5 text-xs font-bold text-gray-500 cursor-not-allowed opacity-80"
                      title="This request was accepted by another provider and is disabled."
                    >
                      <Lock size={13} /> Accepted by {job.lockedBy} (Disabled)
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => handleAcceptIncoming(job.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition cursor-pointer"
                      >
                        <Check size={14} /> Accept Job
                      </button>
                      <button
                        onClick={() => handleDeclineIncoming(job.id)}
                        className="rounded-xl border border-gray-200 px-4 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition cursor-pointer"
                      >
                        <X size={14} /> Decline
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Weekly Performance Chart ──────────────────────────────────── */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-2xs space-y-4">
        <div>
          <h3 className="text-base font-bold text-gray-900">Weekly Earnings Overview</h3>
          <p className="text-xs text-gray-500">Your total payouts for the last 7 days</p>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={EARNINGS_CHART_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} tickFormatter={(v) => `₹${v}`} />
              <Tooltip formatter={(value: any) => [`₹${value}`, 'Earnings']} />
              <Bar dataKey="earnings" fill="#2563eb" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Modal: Propose Replaced Spare Parts & Additional Charges ──────── */}
      {showAddPartModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
          <div className="relative w-full max-w-xl max-h-[90vh] flex flex-col rounded-3xl bg-white shadow-2xl border border-gray-100 my-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-100 p-5 sm:p-6 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 font-bold shrink-0">
                  <PackageCheck size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Add Spare Parts & Service Charges</h3>
                  <p className="text-xs text-gray-500">Add one or multiple parts with photo & price for customer sign-off</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddPartModal(false)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleAddSparePartQuote} className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs flex-1">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-800 text-xs uppercase tracking-wider">
                    Replaced Parts List ({modalParts.length})
                  </span>
                  <button
                    type="button"
                    onClick={handleAddPartRow}
                    className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition cursor-pointer"
                  >
                    <Plus size={14} /> Add Another Part
                  </button>
                </div>

                {modalParts.map((part, index) => (
                  <div
                    key={part.tempId}
                    className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4 space-y-3 relative transition hover:border-blue-200"
                  >
                    <div className="flex items-center justify-between pb-1">
                      <span className="font-extrabold text-[11px] text-blue-700 bg-blue-100/70 px-2.5 py-0.5 rounded-full">
                        Part #{index + 1}
                      </span>
                      {modalParts.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemovePartRow(part.tempId)}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:text-rose-700 p-1 hover:bg-rose-50 rounded cursor-pointer"
                          title="Remove part"
                        >
                          <Trash2 size={13} /> Remove
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <label className="font-bold text-gray-700 block mb-1">Part / Product Name *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. AC Dual Run Capacitor 45µF"
                          value={part.name}
                          onChange={(e) => handleUpdatePartRow(part.tempId, 'name', e.target.value)}
                          className="w-full rounded-xl border border-gray-200 bg-white p-2.5 text-xs text-gray-900 outline-none focus:border-blue-600 transition"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-gray-700 block mb-1">Price (₹) *</label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          placeholder="e.g. 250.00"
                          value={part.price}
                          onChange={(e) => handleUpdatePartRow(part.tempId, 'price', e.target.value)}
                          className="w-full rounded-xl border border-gray-200 bg-white p-2.5 text-xs text-gray-900 outline-none focus:border-blue-600 transition font-bold text-emerald-700"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-bold text-gray-700 flex items-center gap-1.5">
                          <FileImage size={13} className="text-blue-600" /> Part / Product Media & Photo
                        </label>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-gray-400">Presets:</span>
                          <button
                            type="button"
                            onClick={() => handleUpdatePartRow(part.tempId, 'imageUrl', 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=300&auto=format&fit=crop&q=80')}
                            className="text-[10px] text-blue-600 hover:underline"
                          >
                            Capacitor
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdatePartRow(part.tempId, 'imageUrl', 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=300&auto=format&fit=crop&q=80')}
                            className="text-[10px] text-blue-600 hover:underline"
                          >
                            Valve
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdatePartRow(part.tempId, 'imageUrl', 'https://images.unsplash.com/photo-1542013936693-884638332954?w=300&auto=format&fit=crop&q=80')}
                            className="text-[10px] text-blue-600 hover:underline"
                          >
                            Filter
                          </button>
                        </div>
                      </div>

                      {/* Camera & Media Picker Controls */}
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          {/* 1. Camera Capture Button */}
                          <label className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:from-blue-700 hover:to-indigo-700 transition cursor-pointer">
                            <Camera size={14} />
                            <span>Take Photo (Camera)</span>
                            <input
                              type="file"
                              accept="image/*"
                              capture="environment"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0] || null
                                handleFileCapture(part.tempId, file)
                                e.target.value = ''
                              }}
                            />
                          </label>

                          {/* 2. Upload from Device / Gallery Media */}
                          <label className="inline-flex items-center gap-1.5 rounded-xl border border-gray-300 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-50 transition cursor-pointer">
                            <Upload size={13} className="text-gray-500" />
                            <span>Upload Media</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0] || null
                                handleFileCapture(part.tempId, file)
                                e.target.value = ''
                              }}
                            />
                          </label>
                        </div>

                        {/* Preview and direct URL edit */}
                        <div className="flex items-center gap-2">
                          {part.imageUrl && (
                            <img
                              src={part.imageUrl}
                              alt="preview"
                              className="h-11 w-11 rounded-lg object-cover border border-gray-300 bg-white shrink-0 shadow-2xs"
                            />
                          )}
                          <input
                            type="text"
                            placeholder="Or paste direct image URL"
                            value={part.imageUrl}
                            onChange={(e) => handleUpdatePartRow(part.tempId, 'imageUrl', e.target.value)}
                            className="flex-1 rounded-xl border border-gray-200 bg-white p-2 text-xs text-gray-900 outline-none focus:border-blue-600 transition"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="font-bold text-gray-700 block mb-1">Reason / Diagnosis Details</label>
                      <input
                        type="text"
                        placeholder="e.g. Burnt terminals, leaking seal, or worn out component"
                        value={part.reason}
                        onChange={(e) => handleUpdatePartRow(part.tempId, 'reason', e.target.value)}
                        className="w-full rounded-xl border border-gray-200 bg-white p-2 text-xs text-gray-900 outline-none focus:border-blue-600 transition"
                      />
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={handleAddPartRow}
                  className="w-full py-2.5 rounded-xl border-2 border-dashed border-blue-200 hover:border-blue-400 bg-blue-50/50 hover:bg-blue-50 text-blue-700 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <Plus size={15} /> + Add Another Replaced Part
                </button>
              </div>

              {/* ── Section: Service Details & Scope Modification ── */}
              <div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="font-bold text-indigo-950 text-xs flex items-center gap-1.5">
                      <Wrench size={14} className="text-indigo-600" />
                      Modify Service Details & Scope
                    </h5>
                    <p className="text-[11px] text-indigo-700">
                      Change service package title, estimated duration, or add new diagnostic tasks for customer approval
                    </p>
                  </div>
                </div>

                <div className="space-y-3 bg-white p-3 rounded-xl border border-indigo-100">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-gray-700 block mb-1">
                        Updated Service Name / Package (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder={`e.g. ${activeJob?.serviceName || 'AC Deep Cleaning'} + Gas Refill Upgrade`}
                        value={serviceNameChange}
                        onChange={(e) => setServiceNameChange(e.target.value)}
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 p-2.5 text-xs text-gray-900 outline-none focus:border-indigo-600 focus:bg-white transition"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-gray-700 block mb-1">
                        Revised Time Estimate (Minutes)
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 45 or 90 mins"
                        value={revisedEstimatedMinutes}
                        onChange={(e) => setRevisedEstimatedMinutes(e.target.value)}
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 p-2.5 text-xs text-gray-900 outline-none focus:border-indigo-600 focus:bg-white transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-gray-700 block mb-1">
                      Technician Scope & Condition Diagnosis Notes
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Explain to customer what additional issues were discovered and what service adjustments are needed..."
                      value={serviceScopeNotes}
                      onChange={(e) => setServiceScopeNotes(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 p-2.5 text-xs text-gray-900 outline-none focus:border-indigo-600 focus:bg-white transition resize-none"
                    />
                  </div>

                  {/* Add-on extra services */}
                  <div className="pt-2 border-t border-gray-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-700 text-[11px]">
                        Itemized Extra Services / Procedures ({extraServicesList.length})
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setExtraServicesList((prev) => [
                            ...prev,
                            {
                              tempId: Date.now().toString(),
                              title: '',
                              charge: '',
                              description: ''
                            }
                          ])
                        }
                        className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2.5 py-1 rounded-md"
                      >
                        + Add Extra Service Task
                      </button>
                    </div>

                    {extraServicesList.map((srv, sIdx) => (
                      <div key={srv.tempId} className="p-2.5 rounded-lg border border-indigo-100 bg-indigo-50/30 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-indigo-800">Extra Task #{sIdx + 1}</span>
                          <button
                            type="button"
                            onClick={() => setExtraServicesList((prev) => prev.filter((item) => item.tempId !== srv.tempId))}
                            className="text-[10px] font-bold text-rose-600 hover:text-rose-800"
                          >
                            Remove
                          </button>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <input
                            type="text"
                            placeholder="Task e.g. Gas Refill (R32)"
                            value={srv.title}
                            onChange={(e) =>
                              setExtraServicesList((prev) =>
                                prev.map((item) => (item.tempId === srv.tempId ? { ...item, title: e.target.value } : item))
                              )
                            }
                            className="col-span-2 rounded-lg border border-gray-200 bg-white p-2 text-xs"
                          />
                          <input
                            type="number"
                            step="0.01"
                            placeholder="Fee (₹)"
                            value={srv.charge}
                            onChange={(e) =>
                              setExtraServicesList((prev) =>
                                prev.map((item) => (item.tempId === srv.tempId ? { ...item, charge: e.target.value } : item))
                              )
                            }
                            className="rounded-lg border border-gray-200 bg-white p-2 text-xs font-bold text-emerald-600"
                          />
                        </div>
                        <input
                          type="text"
                          placeholder="Task details or reason (e.g. pressure was low at 45 PSI)"
                          value={srv.description}
                          onChange={(e) =>
                            setExtraServicesList((prev) =>
                              prev.map((item) => (item.tempId === srv.tempId ? { ...item, description: e.target.value } : item))
                            )
                          }
                          className="w-full rounded-lg border border-gray-200 bg-white p-2 text-xs"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Extra Labor / Service Charges */}
              <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 space-y-2">
                <label className="font-bold text-amber-900 block text-xs">
                  General Extra Labor / Fitting Charge (₹)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 100.00"
                    value={additionalLaborCharge}
                    onChange={(e) => setAdditionalLaborCharge(e.target.value)}
                    className="w-full rounded-xl border border-amber-300 bg-white p-2.5 text-xs text-gray-900 outline-none focus:border-amber-500 font-bold text-amber-900"
                  />
                </div>
                <p className="text-[10px] text-amber-700">Optional extra service or fitting fee.</p>
              </div>

              {/* Real-time Summary Box */}
              <div className="rounded-xl bg-slate-900 text-white p-3.5 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400 text-[11px] block">Total Proposal Amount:</span>
                  <span className="font-bold text-white">
                    {modalParts.length} Part{modalParts.length > 1 ? 's' : ''} + Extra Services & Labor
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black text-emerald-400">
                    ₹{(
                      modalParts.reduce((acc, p) => acc + (parseFloat(p.price) || 0), 0) +
                      (parseFloat(additionalLaborCharge) || 0) +
                      extraServicesList.reduce((acc, s) => acc + (parseFloat(s.charge) || 0), 0)
                    ).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddPartModal(false)}
                  className="rounded-xl border border-gray-200 px-4 py-2.5 font-bold text-gray-600 hover:bg-gray-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-5 py-2.5 font-bold text-white shadow-md hover:bg-blue-700 transition cursor-pointer"
                >
                  Propose All Parts to Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
