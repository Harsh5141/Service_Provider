import { useState } from 'react'
import { ShieldAlert } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminComplaints() {
  const [complaints, setComplaints] = useState([
    {
      id: 1,
      ticketNumber: 'TKT-8901',
      customer: 'Suresh Raina',
      service: 'Refrigerator Cooling Diagnostic',
      provider: 'Amit Singh',
      issue: 'Technician arrived 35 minutes late due to traffic, requested 10% coupon compensation.',
      status: 'Open',
      date: '2026-09-30'
    },
    {
      id: 2,
      ticketNumber: 'TKT-8898',
      customer: 'Kavita Menon',
      service: 'Switchboard Installation',
      provider: 'Rajesh Kumar',
      issue: 'Need copy of itemized invoice with technician license registration number for landlord insurance.',
      status: 'InReview',
      date: '2026-09-29'
    }
  ])

  const handleResolve = (id: number) => {
    setComplaints((prev) => prev.map((c) => c.id === id ? { ...c, status: 'Resolved' } : c))
    toast.success('Complaint resolved and customer notified via email/SMS.')
  }

  return (
    <div className="space-y-6 pb-16">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dispute & Complaint Triage Center</h1>
        <p className="text-xs sm:text-sm text-gray-500">Fast escalation resolution and customer satisfaction protection</p>
      </div>

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
                  className="rounded-xl bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-emerald-700 transition"
                >
                  ✓ Mark Resolved
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
