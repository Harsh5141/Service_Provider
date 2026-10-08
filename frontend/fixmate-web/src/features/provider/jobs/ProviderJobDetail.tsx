import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, MapPin, Phone, Clock, ShieldCheck, CheckCircle2, Wrench, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '@/lib/apiClient'
import { getRequestOtp } from '@/lib/otpUtils'

interface JobData {
  id: number | string
  serviceName: string
  categoryName: string
  customerName: string
  customerPhone: string
  address: string
  scheduledDate: string
  slot: string
  payout: number
  status: string
  otp?: string
  notes?: string
}

const DEMO_JOBS: Record<string, JobData> = {
  '104': {
    id: 104,
    serviceName: 'AC Foam Jet Deep Cleaning (Split)',
    categoryName: 'AC & Appliance Repair',
    customerName: 'John Doe',
    customerPhone: '+91 98765 43211',
    address: 'Flat 402, Sunshine Heights, 12th Cross, Andheri West, Mumbai - 400058',
    scheduledDate: '2026-09-30',
    slot: '4:30 PM - 5:30 PM',
    payout: 465.00,
    status: 'On The Way',
    otp: getRequestOtp('104'),
    notes: 'Indoor split AC unit requires foam jet pressure wash and antibacterial spray.'
  },
  '101': {
    id: 101,
    serviceName: 'Ceiling Fan Installation & Repair',
    categoryName: 'Electrical & Power',
    customerName: 'Priya Sharma',
    customerPhone: '+91 98765 43212',
    address: 'Tower 4, Green Valley Apartments, Andheri East, Mumbai - 400069',
    scheduledDate: '2026-09-28',
    slot: '11:00 AM - 12:00 PM',
    payout: 220.00,
    status: 'Completed',
    otp: '1892',
    notes: 'New BLDC ceiling fan assembly and regulator check.'
  },
  '97': {
    id: 97,
    serviceName: 'MCB / Fuse Box Troubleshooting',
    categoryName: 'Electrical & Power',
    customerName: 'Amit Verma',
    customerPhone: '+91 98765 43218',
    address: 'B-102, Ocean Drive, Bandra West, Mumbai - 400050',
    scheduledDate: '2026-09-25',
    slot: '2:00 PM - 3:00 PM',
    payout: 340.00,
    status: 'Completed',
    otp: '7241',
    notes: 'Main trip switch tripping frequently under heavy load.'
  }
}

export default function ProviderJobDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const jobId = id || '104'

  const [job, setJob] = useState<JobData>(() => {
    return DEMO_JOBS[jobId] || {
      id: jobId,
      serviceName: 'Home Maintenance & Repair Service',
      categoryName: 'General Maintenance',
      customerName: 'Verified Customer',
      customerPhone: '+91 98765 43210',
      address: '12 Station Road, Valsad, Gujarat - 396001',
      scheduledDate: 'Today',
      slot: 'Scheduled Appointment',
      payout: 450.00,
      status: 'On The Way',
      otp: '4829',
      notes: 'Please follow safety protocols and wear protective gear during service.'
    }
  })

  const [otpInput, setOtpInput] = useState('')

  useEffect(() => {
    async function fetchJob() {
      try {
        const res = await api.get(`/requests/${jobId}`)
        if (res.data?.data) {
          const d = res.data.data
          const statusStr = typeof d.status === 'number'
            ? (d.status === 4 ? 'Completed' : d.status === 3 ? 'In Progress' : d.status === 2 ? 'On The Way' : 'On The Way')
            : (d.status || 'On The Way')

          setJob({
            id: d.id ?? jobId,
            serviceName: d.serviceName || 'AC Foam Jet Deep Cleaning (Split)',
            categoryName: d.categoryName || 'AC & Appliance Repair',
            customerName: d.customerName || 'John Doe',
            customerPhone: d.customerPhone || '+91 98765 43211',
            address: d.addressText || `${d.street || ''} ${d.city || ''} ${d.state || ''} ${d.postalCode || ''}`.trim() || 'Flat 402, Sunshine Heights, 12th Cross, Andheri West, Mumbai - 400058',
            scheduledDate: d.scheduledDate ? new Date(d.scheduledDate).toISOString().split('T')[0] : '2026-09-30',
            slot: d.preferredTimeSlot || d.slot || '4:30 PM - 5:30 PM',
            payout: d.payout || (d.estimatedCost ? Number(d.estimatedCost) * 0.85 : 465.00),
            status: statusStr,
            otp: d.otp || getRequestOtp(d.id || jobId),
            notes: d.problemDescription || 'Indoor split AC unit requires foam jet pressure wash and antibacterial spray.'
          })
        }
      } catch (err) {
        // Fallback to demo job
        if (DEMO_JOBS[jobId]) {
          setJob(DEMO_JOBS[jobId])
        }
      }
    }
    fetchJob()
  }, [jobId])

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    const expectedOtp = job.otp || getRequestOtp(job.id)
    if (otpInput.trim() === expectedOtp) {
      setJob((prev) => ({ ...prev, status: 'In Progress' }))
      try {
        await api.put(`/provider/jobs/${job.id}/status`, { status: 3, note: 'Customer OTP verified, work started' })
      } catch {
        // Fallback demo mode
      }
      try {
        localStorage.setItem(`fixmate_active_job_status_${job.id}`, JSON.stringify({
          status: 'In Progress',
          step: 4,
          statusText: 'In Progress'
        }))
        window.dispatchEvent(new Event('fixmate_job_updated'))
      } catch (e) {
        // localStorage fallback
      }
      toast.success('Customer OTP verified! Service marked as In Progress.')
    } else {
      toast.error('Invalid OTP. Please ask the customer for the correct 4-digit start OTP.')
    }
  }

  const handleMarkCompleted = async () => {
    setJob((prev) => ({ ...prev, status: 'Completed' }))
    try {
      await api.put(`/provider/jobs/${job.id}/status`, { status: 4, note: 'Provider marked work completed' })
    } catch {
      // Fallback demo mode
    }
    try {
      localStorage.setItem(`fixmate_active_job_status_${job.id}`, JSON.stringify({
        status: 'Completed',
        step: 5,
        statusText: 'Completed'
      }))
      window.dispatchEvent(new Event('fixmate_job_updated'))
    } catch (e) {
      // localStorage fallback
    }
    toast.success(`Job #${job.id} marked as Completed! Payout of ₹${job.payout.toFixed(2)} credited.`)
  }

  const handleCallCustomer = () => {
    window.location.href = `tel:${job.customerPhone.replace(/\s+/g, '')}`
  }

  return (
    <div className="w-full space-y-6 pb-16">
      <button
        onClick={() => navigate('/provider/jobs')}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-blue-600 transition cursor-pointer"
      >
        <ArrowLeft size={14} /> Back to Jobs Ledger
      </button>

      {/* Main Job Card */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg">
                Job #{job.id}
              </span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold ${
                  job.status === 'Completed'
                    ? 'bg-emerald-100 text-emerald-800'
                    : job.status === 'In Progress'
                    ? 'bg-purple-100 text-purple-800'
                    : 'bg-indigo-100 text-indigo-800'
                }`}
              >
                {job.status}
              </span>
            </div>
            <h1 className="text-xl font-bold text-gray-900 mt-2">{job.serviceName}</h1>
            <p className="text-xs text-gray-500 font-medium">{job.categoryName}</p>
          </div>

          <div className="text-left sm:text-right bg-emerald-50 sm:bg-transparent p-3 sm:p-0 rounded-xl">
            <span className="text-xs text-gray-500 font-medium block">Net Partner Payout</span>
            <p className="text-2xl font-black text-emerald-600">₹{job.payout.toFixed(2)}</p>
          </div>
        </div>

        {/* Customer & Location Info */}
        <div className="rounded-2xl bg-gray-50 border border-gray-200/80 p-5 space-y-3.5 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-200/60 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white font-bold text-xs shadow-xs">
                {job.customerName.charAt(0)}
              </div>
              <div>
                <p className="font-bold text-sm text-gray-900">{job.customerName}</p>
                <p className="text-gray-600 font-medium">{job.customerPhone}</p>
              </div>
            </div>
            <button
              onClick={handleCallCustomer}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition cursor-pointer self-start sm:self-auto"
            >
              <Phone size={13} /> Call Customer
            </button>
          </div>

          <div className="space-y-2 pt-1 text-gray-700">
            <div className="flex items-start gap-2.5">
              <MapPin size={15} className="text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-gray-900">Service Address:</span>
                <p className="text-gray-800 font-medium mt-0.5">{job.address}</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 pt-1">
              <Clock size={15} className="text-blue-600 shrink-0" />
              <div>
                <span className="font-bold text-gray-900">Scheduled Time Slot:</span>
                <span className="ml-1 text-gray-800 font-medium">{job.scheduledDate} · {job.slot}</span>
              </div>
            </div>

            {job.notes && (
              <div className="pt-2 border-t border-gray-200/60">
                <span className="font-bold text-gray-900">Customer Problem Note:</span>
                <p className="text-gray-700 italic mt-0.5">"{job.notes}"</p>
              </div>
            )}
          </div>
        </div>

        {/* 5-Step Visual Status Tracker */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs space-y-3">
          <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Service Progress Tracker</h4>
          <div className="relative flex items-center justify-between py-2">
            {['Booked', 'Assigned', 'On The Way', 'In Progress', 'Completed'].map((label, idx) => {
              const stepNum = idx + 1
              const currentStepNum = job.status === 'Completed' ? 5 : job.status === 'In Progress' ? 4 : job.status === 'On The Way' ? 3 : 2
              const isPassed = stepNum <= currentStepNum
              const isCurrent = stepNum === currentStepNum

              return (
                <div key={label} className="relative z-10 flex flex-col items-center text-center">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${
                      isPassed
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-400'
                    } ${isCurrent ? 'ring-4 ring-blue-100 ring-offset-2' : ''}`}
                  >
                    {isPassed ? <Check size={16} /> : stepNum}
                  </div>
                  <span className={`mt-2 text-xs font-medium hidden sm:block ${isCurrent ? 'text-blue-700 font-bold' : 'text-gray-600'}`}>
                    {label}
                  </span>
                </div>
              )
            })}
            {/* Connector Line */}
            <div className="absolute top-6 left-4 right-4 -translate-y-1/2 h-1 bg-gray-100 -z-0">
              <div
                className="h-full bg-blue-600 transition-all duration-300"
                style={{
                  width: `${Math.min(100, Math.max(0, ((((job.status === 'Completed' ? 5 : job.status === 'In Progress' ? 4 : job.status === 'On The Way' ? 3 : 2)) - 1) / 4) * 100))}%`
                }}
              />
            </div>
          </div>
        </div>

        {/* Live Action Panel */}
        <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-blue-900 flex items-center gap-2">
              <Wrench size={16} className="text-blue-700" />
              Service Execution Status
            </h3>
            {job.otp && job.status !== 'Completed' && (
              <span className="text-xs font-bold text-blue-800 bg-blue-100 px-2.5 py-1 rounded-md">
                Customer Start OTP: {job.otp}
              </span>
            )}
          </div>

          {job.status === 'On The Way' && (
            <form onSubmit={handleVerifyOtp} className="flex flex-col sm:flex-row items-end gap-3">
              <div className="flex-1 w-full">
                <label className="text-xs font-bold text-gray-800 block mb-1">
                  Enter 4-Digit Customer Start OTP to Begin Work:
                </label>
                <input
                  type="text"
                  maxLength={4}
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value)}
                  placeholder="Enter 4-digit OTP"
                  className="w-full rounded-xl border border-gray-300 bg-white p-2.5 text-sm font-mono tracking-widest text-center font-bold text-gray-900 focus:border-blue-600 outline-none"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full sm:w-auto rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition cursor-pointer"
              >
                Verify & Start Work
              </button>
            </form>
          )}

          {job.status === 'In Progress' && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-blue-200">
              <div>
                <p className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                  <CheckCircle2 size={15} className="text-emerald-600" /> Service Underway
                </p>
                <p className="text-xs text-gray-500 mt-0.5">Complete standard safety checks before signoff.</p>
              </div>
              <button
                onClick={handleMarkCompleted}
                className="w-full sm:w-auto rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition cursor-pointer"
              >
                ✓ Mark Job Completed
              </button>
            </div>
          )}

          {job.status === 'Completed' && (
            <div className="rounded-xl bg-emerald-100/70 p-4 text-center text-xs font-bold text-emerald-900 flex items-center justify-center gap-2">
              <Check size={16} className="text-emerald-700" />
              This service has been successfully completed and settled.
            </div>
          )}
        </div>

        {/* SOPs */}
        <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-4 text-xs space-y-2">
          <p className="font-bold text-gray-900 flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-blue-600" /> Partner Service Guidelines:
          </p>
          <ul className="list-disc list-inside space-y-1 text-gray-600 font-medium">
            <li>Verify customer start OTP before touching appliances or wiring</li>
            <li>Wear clean protective shoe covers and mask inside customer residence</li>
            <li>Test and verify operating performance with customer before departure</li>
            <li>Ensure workspace is left clean and debris-free</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

