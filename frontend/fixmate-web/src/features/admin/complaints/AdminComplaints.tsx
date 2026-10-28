import { useState, useEffect } from 'react'
import { ShieldAlert, RefreshCw, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '@/lib/apiClient'

interface ComplaintItem {
  id: number
  ticketNumber: string
  customer: string
  service: string
  provider: string
  issue: string
  status: string
  date: string
}

export default function AdminComplaints() {
  const [complaints, setComplaints] = useState<ComplaintItem[]>([])
  const [loading, setLoading] = useState(true)

  const fetchComplaints = async () => {
    setLoading(true)
    try {
      const res = await api.get('/admin/complaints')
      if (res.data?.data && Array.isArray(res.data.data)) {
        setComplaints(res.data.data)
      }
    } catch (err: any) {
      console.error('Failed to load complaints from database', err)
      toast.error('Failed to fetch complaints')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchComplaints()
  }, [])

  const handleResolve = async (id: number) => {
    try {
      await api.put(`/admin/complaints/${id}/resolve`)
      setComplaints((prev) => prev.map((c) => c.id === id ? { ...c, status: 'Resolved' } : c))
      toast.success('Complaint resolved and customer notified.')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to resolve complaint.')
    }
  }

  return (
    <div className="space-y-6 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dispute & Complaint Triage Center</h1>
          <p className="text-xs sm:text-sm text-gray-500">Live database complaints, dispute escalation, and customer resolution</p>
        </div>
        <button
          onClick={fetchComplaints}
          className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 shadow-2xs self-start"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="py-16 text-center text-xs text-gray-400 flex flex-col items-center gap-2">
          <RefreshCw size={18} className="animate-spin text-blue-600" />
          Loading complaints from database...
        </div>
      ) : complaints.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center text-gray-500">
          <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-400 mb-3" />
          <p className="text-base font-bold text-gray-700">No Complaints Found</p>
          <p className="text-xs text-gray-400 mt-1">There are currently no open disputes or complaints in the system.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {complaints.map((c) => (
            <div key={c.id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="rounded-lg bg-red-100 p-1.5 text-red-700">
                    <ShieldAlert size={16} />
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">{c.ticketNumber} · {c.service}</h4>
                    <p className="text-xs text-gray-400">Customer: {c.customer} · Partner: {c.provider}</p>
                  </div>
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    c.status === 'Resolved'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {c.status}
                </span>
              </div>

              <p className="text-xs text-gray-700 bg-gray-50 p-3.5 rounded-xl leading-relaxed">
                "{c.issue}"
              </p>

              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-gray-400">Filed on {c.date}</span>
                {c.status !== 'Resolved' && (
                  <button
                    onClick={() => handleResolve(c.id)}
                    className="rounded-xl bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-emerald-700 transition cursor-pointer"
                  >
                    ✓ Mark Resolved
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
