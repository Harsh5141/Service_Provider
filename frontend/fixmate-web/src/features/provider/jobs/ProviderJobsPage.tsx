import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  MapPin, ChevronRight,
  Calendar
} from 'lucide-react'
import api from '@/lib/apiClient'

interface JobItem {
  id: number | string
  serviceName: string
  customerName: string
  customerPhone: string
  address: string
  scheduledDate: string
  slot: string
  payout: number
  status: string
}

const DEFAULT_JOBS: JobItem[] = [
  {
    id: 104,
    serviceName: 'AC Foam Jet Deep Cleaning (Split)',
    customerName: 'John Doe',
    customerPhone: '+91 98765 43211',
    address: 'Flat 402, Sunshine Heights, Mumbai',
    scheduledDate: '2026-09-30',
    slot: '4:30 PM - 5:30 PM',
    payout: 465.00,
    status: 'On The Way'
  },
  {
    id: 101,
    serviceName: 'Ceiling Fan Installation & Repair',
    customerName: 'Priya Sharma',
    customerPhone: '+91 98765 43212',
    address: 'Tower 4, Green Valley, Mumbai',
    scheduledDate: '2026-09-28',
    slot: '11:00 AM - 12:00 PM',
    payout: 220.00,
    status: 'Completed'
  },
  {
    id: 97,
    serviceName: 'MCB / Fuse Box Troubleshooting',
    customerName: 'Amit Verma',
    customerPhone: '+91 98765 43218',
    address: 'B-102, Ocean Drive, Mumbai',
    scheduledDate: '2026-09-25',
    slot: '2:00 PM - 3:00 PM',
    payout: 340.00,
    status: 'Completed'
  }
]

export default function ProviderJobsPage() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState('ALL')
  const [jobs, setJobs] = useState<JobItem[]>(DEFAULT_JOBS)

  useEffect(() => {
    async function fetchJobs() {
      try {
        const res = await api.get('/provider/dashboard')
        if (res.data?.data) {
          const d = res.data.data
          const allIncoming: any[] = d.incomingRequests || []
          const allActive: any[] = d.activeRequests || []
          const allCompleted: any[] = d.recentCompletedRequests || []

          const combined = [...allActive, ...allIncoming, ...allCompleted]
          if (combined.length > 0) {
            const mapped: JobItem[] = combined.map((r) => {
              const statusStr = typeof r.status === 'number'
                ? (r.status === 4 ? 'Completed' : r.status === 3 ? 'In Progress' : r.status === 2 ? 'On The Way' : 'Assigned')
                : (r.status || 'Active')

              return {
                id: r.id,
                serviceName: r.serviceName || 'Home Maintenance Service',
                customerName: r.customerName || 'Verified Customer',
                customerPhone: r.customerPhone || '+91 98765 43210',
                address: r.addressText || `${r.city || ''} ${r.state || ''} ${r.postalCode || ''}`.trim() || 'Service Location',
                scheduledDate: r.scheduledDate ? new Date(r.scheduledDate).toISOString().split('T')[0] : '2026-10-05',
                slot: r.preferredTimeSlot || 'Scheduled Slot',
                payout: r.estimatedCost ? Number(r.estimatedCost) * 0.85 : 450.00,
                status: statusStr
              }
            })
            setJobs(mapped)
          }
        }
      } catch (err) {
        // Keep DEFAULT_JOBS on error
      }
    }
    fetchJobs()
  }, [])

  const filtered = jobs.filter((j) => {
    if (filter === 'ALL') return true
    if (filter === 'ACTIVE') return j.status === 'On The Way' || j.status === 'In Progress'
    if (filter === 'COMPLETED') return j.status === 'Completed'
    return true
  })

  return (
    <div className="space-y-6 pb-16">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Partner Jobs Ledger</h1>
        <p className="text-xs sm:text-sm text-gray-500">Track all assigned service appointments and completed jobs</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-gray-200 pb-3">
        {['ALL', 'ACTIVE', 'COMPLETED'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-lg px-4 py-2 text-xs font-bold transition ${filter === f
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
          >
            {f === 'ALL' ? 'All Jobs' : f === 'ACTIVE' ? 'Active Jobs' : 'Completed'}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filtered.map((job) => (
          <div
            key={job.id}
            className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 shadow-2xs space-y-4 transition hover:border-blue-300"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg">
                  Job #{job.id}
                </span>
                <h3 className="text-base font-bold text-gray-900">{job.serviceName}</h3>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold ${job.status === 'Completed'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-indigo-100 text-indigo-800'
                  }`}
              >
                {job.status}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-gray-600">
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-gray-400" />
                <span>{job.scheduledDate} · {job.slot}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-gray-400" />
                <span className="truncate">{job.address}</span>
              </div>
              <div className="flex items-center sm:justify-end gap-1 font-bold text-gray-900 text-sm">
                <span>Net Payout:</span>
                <span className="text-emerald-600">₹{job.payout}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl bg-gray-50 p-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-900">Customer:</span>
                <span>{job.customerName} ({job.customerPhone})</span>
              </div>
              <button
                onClick={() => navigate(`/provider/jobs/${job.id}`)}
                className="inline-flex items-center gap-1 font-bold text-blue-700 hover:underline"
              >
                View Job Details <ChevronRight size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
