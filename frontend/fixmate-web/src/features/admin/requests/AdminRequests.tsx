import { useState, useEffect } from 'react'
import { Layers } from 'lucide-react'
import api from '@/lib/apiClient'

interface AdminRequestItem {
  id: number
  customer: string
  provider: string
  service: string
  category: string
  status: string
  amount: number
  date: string
  slot: string
}

export default function AdminRequests() {
  const [requests, setRequests] = useState<AdminRequestItem[]>([])

  useEffect(() => {
    api.get('/requests')
      .then((res) => {
        if (res.data?.data && Array.isArray(res.data.data)) {
          setRequests(res.data.data.map((r: any) => ({
            id: r.id,
            customer: r.customerName || 'Customer',
            provider: r.providerName || (r.providerId ? 'Assigned Partner' : 'Unassigned'),
            service: r.serviceName || 'Home Service',
            category: r.categoryName || 'General Services',
            status: r.status || 'Created',
            amount: r.estimatedCost || r.finalCost || 299,
            date: r.scheduledDate ? new Date(r.scheduledDate).toISOString().split('T')[0] : '2026-09-30',
            slot: r.preferredTimeSlot || '10:00 AM - 12:00 PM'
          })))
        }
      })
      .catch(() => {})
  }, [])

  const getCategoryBadgeColor = (categoryName: string) => {
    const cat = (categoryName || '').toLowerCase()
    if (cat.includes('electric') || cat.includes('power')) return 'bg-indigo-50 text-indigo-700 border-indigo-200'
    if (cat.includes('plumb') || cat.includes('sanitary')) return 'bg-cyan-50 text-cyan-700 border-cyan-200'
    if (cat.includes('ac') || cat.includes('appliance')) return 'bg-blue-50 text-blue-700 border-blue-200'
    if (cat.includes('clean') || cat.includes('pest')) return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    return 'bg-slate-100 text-slate-700 border-slate-200'
  }

  return (
    <div className="space-y-6 pb-16">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Master Service Requests</h1>
        <p className="text-xs sm:text-sm text-gray-500">Live dispatch, status monitoring, categories, and provider assignments across all cities</p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white shadow-2xs overflow-hidden">
        {requests.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Layers className="mx-auto h-12 w-12 text-gray-300 mb-3" />
            <p className="text-base font-bold text-gray-700">No Service Requests Found</p>
            <p className="text-xs text-gray-400 mt-1">There are currently no active or historical bookings in the platform.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 uppercase border-b border-gray-100">
                <tr>
                  <th className="px-5 py-3 font-bold">ID & Service</th>
                  <th className="px-5 py-3 font-bold">Category</th>
                  <th className="px-5 py-3 font-bold">Customer</th>
                  <th className="px-5 py-3 font-bold">Assigned Partner</th>
                  <th className="px-5 py-3 font-bold">Scheduled Slot</th>
                  <th className="px-5 py-3 font-bold">Status</th>
                  <th className="px-5 py-3 font-bold text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {requests.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50 transition">
                    <td className="px-5 py-3.5">
                      <span className="font-extrabold text-blue-700">#{r.id}</span>
                      <p className="font-bold text-gray-900">{r.service}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold border ${getCategoryBadgeColor(r.category)}`}>
                        <Layers size={13} />
                        {r.category}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-medium text-gray-800">{r.customer}</td>
                    <td className="px-5 py-3.5 font-medium text-gray-700">{r.provider}</td>
                    <td className="px-5 py-3.5 text-gray-500">{r.date} ({r.slot})</td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`rounded-full px-2.5 py-0.5 font-bold text-[10px] ${
                          r.status === 'Completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : r.status === 'OnTheWay'
                            ? 'bg-indigo-100 text-indigo-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right font-extrabold text-emerald-600">
                      ₹{r.amount.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
