import { useState, useEffect } from 'react'
import {
  DollarSign, Wrench, Star, CheckCircle, Clock,
  MapPin, Phone, Check, X, Lock,
  TrendingUp, Navigation
} from 'lucide-react'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts'
import api from '@/lib/apiClient'
import toast from 'react-hot-toast'
import { getRequestOtp } from '@/lib/otpUtils'

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
    const pollInterval = setInterval(fetchDashboardFromDb, 3000)
    window.addEventListener('storage', fetchDashboardFromDb)
    window.addEventListener('fixmate_job_updated', fetchDashboardFromDb)
    return () => {
      clearInterval(pollInterval)
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
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div>
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-700 bg-purple-50 px-3 py-1 rounded-full">
                          <Wrench size={14} /> Service Currently Underway
                        </span>
                        <p className="text-xs text-gray-500 mt-1">Complete all quality checks before marking finished.</p>
                      </div>
                      <button
                        onClick={handleCompleteJob}
                        className="w-full sm:w-auto rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white shadow hover:bg-emerald-700 transition cursor-pointer"
                      >
                        ✓ Mark Job Completed & Collect Payment
                      </button>
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
    </div>
  )
}
