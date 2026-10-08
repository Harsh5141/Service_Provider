import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, CheckCircle2, Clock, MapPin, Phone, ShieldCheck,
  Star, Navigation, AlertCircle
} from 'lucide-react'
import api from '@/lib/apiClient'
import toast from 'react-hot-toast'
import { getRequestOtp } from '@/lib/otpUtils'

export default function RequestDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [request, setRequest] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadDetail() {
      try {
        const res = await api.get(`/requests/${id}`)
        if (res.data?.data) {
          setRequest(res.data.data)
        } else {
          // Fallback demo data
          setRequest({
            id: id ?? '104',
            serviceName: 'AC Foam Jet Deep Cleaning (Split)',
            categoryName: 'AC & Appliance Repair',
            providerName: 'Rajesh Kumar',
            providerPhone: '+91 98765 43213',
            providerRating: 4.85,
            distanceKm: 2.1,
            estimatedArrivalMinutes: 25,
            status: 'OnTheWay',
            statusText: 'On The Way',
            otp: getRequestOtp(id),
            scheduledDate: new Date().toISOString(),
            preferredTimeSlot: 'Morning (9 AM - 12 PM)',
            problemDescription: 'AC blowing warm air and coil needs intense antibacterial jet cleaning.',
            street: '12 Station Road',
            city: 'Valsad',
            state: 'Gujarat',
            postalCode: '396001',
            totalAmount: 548.00,
            baseAmount: 499.00,
            createdAt: new Date().toISOString()
          })
        }
      } catch (err) {
        console.error('Failed to load request detail', err)
      } finally {
        setLoading(false)
      }
    }

    loadDetail()
    const pollInterval = setInterval(loadDetail, 2500)
    window.addEventListener('storage', loadDetail)
    window.addEventListener('fixmate_job_updated', loadDetail)
    return () => {
      clearInterval(pollInterval)
      window.removeEventListener('storage', loadDetail)
      window.removeEventListener('fixmate_job_updated', loadDetail)
    }
  }, [id])

  useEffect(() => {
    const syncStatus = () => {
      try {
        const stored = localStorage.getItem(`fixmate_active_job_status_${id ?? 104}`)
        if (stored) {
          const parsed = JSON.parse(stored)
          if (parsed.status) {
            setRequest((prev: any) => prev ? ({
              ...prev,
              status: parsed.status,
              statusText: parsed.statusText || parsed.status
            }) : prev)
          }
        }
      } catch (err) {
        console.error('Failed to sync request status', err)
      }
    }

    syncStatus()
    window.addEventListener('storage', syncStatus)
    window.addEventListener('fixmate_job_updated', syncStatus)
    return () => {
      window.removeEventListener('storage', syncStatus)
      window.removeEventListener('fixmate_job_updated', syncStatus)
    }
  }, [id])

  if (loading) {
    return <div className="py-16 text-center text-sm text-gray-500">Loading service request details...</div>
  }

  if (!request) {
    return (
      <div className="mx-auto max-w-md py-16 text-center space-y-4">
        <AlertCircle className="mx-auto h-10 w-10 text-red-500" />
        <h2 className="text-lg font-bold text-gray-900">Request Not Found</h2>
        <button
          onClick={() => navigate('/requests')}
          className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700"
        >
          Back to Bookings
        </button>
      </div>
    )
  }

  // Determine current lifecycle step (1 to 5)
  // 1: Booked
  // 2: Assigned
  // 3: On The Way
  // 4: In Progress
  // 5: Completed
  const getStepNumber = (status: string | number) => {
    const s = String(status).toLowerCase()
    if (s.includes('completed') || s.includes('paid') || s.includes('reviewed')) return 5
    if (s.includes('arrived') || s.includes('inprogress') || s.includes('in progress') || s.includes('work started')) return 4
    if (s.includes('ontheway') || s.includes('on the way') || s.includes('accepted') || s.includes('provideraccepted')) return 3
    if (s.includes('assigned') || s.includes('providerassigned')) return 2
    return 1
  }

  const currentStep = getStepNumber(request.status ?? request.statusText ?? 'Created')

  const TRACKING_STEPS = [
    { num: 1, label: 'Booked', sub: 'Request submitted' },
    { num: 2, label: 'Assigned', sub: 'Matched by location' },
    { num: 3, label: 'On The Way', sub: `ETA: ~${request.estimatedArrivalMinutes ?? 10} mins` },
    { num: 4, label: 'In Progress', sub: 'Work underway' },
    { num: 5, label: 'Completed', sub: 'Quality verified' }
  ]

  return (
    <div className="w-full space-y-6 pb-16">
      {/* Back button */}
      <button
        onClick={() => navigate('/requests')}
        className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-gray-900 cursor-pointer"
      >
        <ArrowLeft size={14} /> Back to My Bookings
      </button>

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-md">
              #{request.id}
            </span>
            <span className="text-xs text-gray-400">
              Booked on {new Date(request.createdAt ?? Date.now()).toLocaleDateString()}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">{request.serviceName}</h1>
          <p className="text-xs text-gray-500">{request.categoryName ?? 'Home Service'}</p>
        </div>

        {/* OTP badge */}
        <div className="rounded-xl border border-blue-200 bg-blue-50/60 px-5 py-3 text-center">
          <p className="text-[11px] font-bold text-blue-800 uppercase tracking-wider">Start Service OTP</p>
          <p className="text-2xl font-black text-blue-700 tracking-widest">{request.otp ?? getRequestOtp(request.id ?? id)}</p>
          <p className="text-[10px] text-gray-500 mt-0.5">Share with technician upon arrival</p>
        </div>
      </div>

      {/* ── 5-Step Customer Tracking Stepper ──────────────────────── */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs">
        <h3 className="text-sm font-bold text-gray-900 mb-6">Service Status Tracker</h3>
        <div className="relative flex items-center justify-between">
          {TRACKING_STEPS.map((s) => {
            const isPassed = s.num <= currentStep
            const isCurrent = s.num === currentStep

            return (
              <div key={s.num} className="relative z-10 flex flex-col items-center text-center">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold transition-all ${
                    isPassed
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-400'
                  } ${isCurrent ? 'ring-4 ring-blue-100 ring-offset-2' : ''}`}
                >
                  {isPassed ? <CheckCircle2 size={18} /> : s.num}
                </div>
                <p className={`mt-2 text-xs font-bold ${isCurrent ? 'text-blue-700' : isPassed ? 'text-gray-900' : 'text-gray-400'}`}>
                  {s.label}
                </p>
                <p className="text-[10px] text-gray-400 hidden sm:block">{s.sub}</p>
              </div>
            )
          })}
          {/* Connector Line */}
          <div className="absolute top-4.5 left-6 right-6 -translate-y-1/2 h-1 bg-gray-100 -z-0">
            <div
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(0, ((currentStep - 1) / (TRACKING_STEPS.length - 1)) * 100))}%` }}
            />
          </div>
        </div>
      </div>

      {/* Grid: Provider & Problem info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Provider card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="text-sm font-bold text-gray-900">
              Matched Service Provider
            </h3>
            <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
              request.providerName ? 'text-emerald-700 bg-emerald-50' : 'text-blue-700 bg-blue-50 animate-pulse'
            }`}>
              {request.providerName ? 'Assigned' : 'Broadcast Dispatch'}
            </span>
          </div>

          {request.providerName ? (
            <>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-extrabold text-base shadow-xs">
                  {request.providerName.substring(0, 2).toUpperCase()}
                </div>
                <div className="space-y-0.5">
                  <h4 className="font-bold text-gray-900">{request.providerName}</h4>
                  <div className="flex items-center gap-1 text-xs text-amber-600 font-semibold">
                    <Star size={13} className="fill-amber-500 text-amber-500" />
                    <span>{request.providerRating ?? 4.85} rating</span>
                  </div>
                  <p className="text-[11px] text-gray-500">{request.serviceName} Specialist</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100 text-xs">
                <div className="flex items-center gap-2">
                  <Navigation size={14} className="text-blue-600 shrink-0" />
                  <div>
                    <p className="text-gray-400 text-[10px]">Distance</p>
                    <p className="font-bold text-gray-900">{request.distanceKm ?? 2.1} KM away</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-emerald-600 shrink-0" />
                  <div>
                    <p className="text-gray-400 text-[10px]">Estimated Arrival</p>
                    <p className="font-bold text-gray-900">~{request.estimatedArrivalMinutes ?? 25} mins</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <a
                  href={`tel:${request.providerPhone ?? '+919876543213'}`}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition"
                >
                  <Phone size={14} /> Call Technician
                </a>
              </div>
            </>
          ) : (
            <div className="space-y-3 py-2 text-center">
              <div className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-300 opacity-40" />
                <Navigation size={28} className="text-blue-600 animate-pulse" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-gray-900 text-sm">Dispatched to Nearby Technicians</h4>
                <p className="text-xs text-gray-500 max-w-xs mx-auto">
                  Awaiting first technician acceptance. The first certified provider to accept will be assigned automatically.
                </p>
              </div>
              <div className="rounded-xl bg-blue-50/60 p-2.5 text-[11px] text-blue-800 font-medium">
                ⏱️ Expected provider acceptance: ~2 to 5 minutes
              </div>
            </div>
          )}
        </div>

        {/* Schedule & Location */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4 shadow-xs">
          <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3">
            Scheduled Appointment & Location
          </h3>
          <div className="space-y-3 text-xs">
            <div className="flex items-start gap-2.5">
              <Clock size={16} className="text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-gray-900">
                  {new Date(request.scheduledDate ?? Date.now()).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </p>
                <p className="text-gray-500">{request.preferredTimeSlot ?? 'Morning (9 AM - 12 PM)'}</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <MapPin size={16} className="text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-gray-900">Customer Service Location</p>
                <p className="text-gray-600">
                  {request.street ?? '12 Station Road'}, {request.city ?? 'Valsad'}, {request.state ?? 'Gujarat'} - <span className="font-semibold text-gray-800">{request.postalCode ?? '396001'}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice & Problem Breakdown */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4 shadow-xs">
        <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3">
          Problem Description & Invoice Details
        </h3>
        <p className="text-xs text-gray-700 bg-gray-50 p-3.5 rounded-xl leading-relaxed">
          {request.problemDescription || 'General servicing and inspection requested.'}
        </p>

        <div className="space-y-2 border-t border-gray-100 pt-3 text-xs">
          <div className="flex justify-between text-gray-600">
            <span>Base Service Charge:</span>
            <span>₹{request.baseAmount ?? 499}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Convenience & Safety Fee:</span>
            <span>₹49</span>
          </div>
          <div className="flex justify-between text-emerald-600 font-medium">
            <span>Promotion Discount:</span>
            <span>-₹50</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>GST & Taxes:</span>
            <span>₹50</span>
          </div>
          <div className="flex justify-between border-t border-gray-200 pt-3 text-base font-extrabold text-gray-900">
            <span>Total Payable Amount:</span>
            <span className="text-emerald-600">₹{request.totalAmount ?? 548}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-gray-100">
          <span className="text-xs text-gray-500 flex items-center gap-1.5">
            <ShieldCheck size={16} className="text-emerald-600" />
            Covered under FixMate 30-Day Satisfaction Warranty
          </span>
          <button
            onClick={() => toast.success('Support ticket created. A support agent will contact you within 15 minutes.')}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer"
          >
            Need Help / Raise Issue
          </button>
        </div>
      </div>
    </div>
  )
}
