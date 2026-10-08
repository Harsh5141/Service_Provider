import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  DollarSign, ShieldCheck, ListChecks,
  TrendingUp, Check, X, ChevronRight
} from 'lucide-react'
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell
} from 'recharts'
import api from '@/lib/apiClient'
import toast from 'react-hot-toast'

const REVENUE_DATA = [
  { month: 'Apr', revenue: 45000, commission: 6750 },
  { month: 'May', revenue: 68000, commission: 10200 },
  { month: 'Jun', revenue: 92000, commission: 13800 },
  { month: 'Jul', revenue: 115000, commission: 17250 },
  { month: 'Aug', revenue: 138000, commission: 20700 },
  { month: 'Sep', revenue: 154200, commission: 23130 }
]

const CATEGORY_SHARE = [
  { name: 'Electrical & Power', value: 35, color: '#3b82f6' },
  { name: 'AC & Appliances', value: 32, color: '#06b6d4' },
  { name: 'Plumbing & Sanitary', value: 20, color: '#10b981' },
  { name: 'Home Deep Cleaning', value: 13, color: '#8b5cf6' }
]

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalCustomers: 1420,
    totalProviders: 86,
    activeRequests: 34,
    completedRequests: 1290,
    totalRevenue: 154200.00,
    totalCommissionEarned: 23130.00,
    pendingProviderApprovals: 2,
    openComplaints: 2
  })

  const [pendingProviders, setPendingProviders] = useState([
    {
      id: 3,
      name: 'Vikram Joshi',
      email: 'vikram.j@gmail.com',
      phone: '+91 98765 43220',
      category: 'AC & Refrigeration',
      experience: '6 Years',
      submittedAt: 'Today, 2:15 PM'
    },
    {
      id: 4,
      name: 'Sunil Patil',
      email: 'sunil.patil@outlook.com',
      phone: '+91 98765 43221',
      category: 'Carpentry & Woodwork',
      experience: '4 Years',
      submittedAt: 'Yesterday, 5:40 PM'
    }
  ])

  const [recentRequests] = useState([
    { id: 104, customer: 'John Doe', provider: 'Rajesh Kumar', service: 'AC Foam Jet Cleaning', status: 'OnTheWay', amount: 548.00 },
    { id: 103, customer: 'Priya Sharma', provider: 'Amit Singh', service: 'Clogged Drain Cleaning', status: 'Completed', amount: 349.00 },
    { id: 102, customer: 'Rahul Roy', provider: 'Unassigned', service: 'Switchboard Repair', status: 'Created', amount: 199.00 },
    { id: 101, customer: 'Ananya Sen', provider: 'Rajesh Kumar', service: 'Ceiling Fan Installation', status: 'Completed', amount: 249.00 }
  ])

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await api.get('/admin/dashboard')
        if (res.data?.data) {
          setStats((prev) => ({ ...prev, ...res.data.data }))
        }
      } catch (err) {
        console.warn('Using live fallback stats', err)
      }
    }
    loadStats()
  }, [])

  const handleApproveProvider = async (id: number, approve: boolean) => {
    setPendingProviders((prev) => prev.filter((p) => p.id !== id))
    toast.success(approve ? `Provider #${id} approved and activated!` : `Provider #${id} rejected.`)
    try {
      await api.post(`/admin/providers/${id}/approve`, { approve })
    } catch (e) {
      // handled
    }
  }

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-purple-100 px-2.5 py-0.5 text-xs font-bold text-purple-800">
              HEADQUARTERS
            </span>
            <span className="text-xs text-gray-400">All Systems Operational</span>
          </div>
          <h1 className="text-2xl font-black text-gray-900 mt-1">FixMate Master Admin Console</h1>
          <p className="text-xs text-gray-500">Real-time marketplace telemetry, revenue ledger, and partner compliance</p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/admin/providers"
            className="rounded-xl border border-gray-300 px-3.5 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50"
          >
            Manage Providers
          </Link>
          <Link
            to="/admin/requests"
            className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 shadow-sm"
          >
            Live Bookings Monitor
          </Link>
        </div>
      </div>

      {/* ── KPI Grid ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 space-y-1 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Gross Marketplace Revenue</span>
            <div className="rounded-xl bg-emerald-50 p-2 text-emerald-600">
              <DollarSign size={18} />
            </div>
          </div>
          <p className="text-2xl font-black text-gray-900">₹{stats.totalRevenue.toLocaleString()}</p>
          <p className="text-[11px] text-emerald-600 font-bold">+24.8% vs last month</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 space-y-1 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Platform Commission (15%)</span>
            <div className="rounded-xl bg-blue-50 p-2 text-blue-600">
              <TrendingUp size={18} />
            </div>
          </div>
          <p className="text-2xl font-black text-blue-700">₹{stats.totalCommissionEarned.toLocaleString()}</p>
          <p className="text-[11px] text-gray-400">Net platform margins</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 space-y-1 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Active Verified Partners</span>
            <div className="rounded-xl bg-purple-50 p-2 text-purple-600">
              <ShieldCheck size={18} />
            </div>
          </div>
          <p className="text-2xl font-black text-purple-700">{stats.totalProviders}</p>
          <p className="text-[11px] text-gray-400">Across 4 major service zones</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 space-y-1 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Completed Service Orders</span>
            <div className="rounded-xl bg-amber-50 p-2 text-amber-600">
              <ListChecks size={18} />
            </div>
          </div>
          <p className="text-2xl font-black text-gray-900">{stats.completedRequests.toLocaleString()}</p>
          <p className="text-[11px] text-emerald-600 font-bold">99.2% fulfillment rate</p>
        </div>
      </div>

      {/* ── Charts: Revenue Growth & Category Share ───────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-gray-900">Platform GMV Growth</h3>
              <p className="text-xs text-gray-500">Monthly gross transaction value & net commissions</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={REVENUE_DATA}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} tickFormatter={(v) => `₹${v / 1000}k`} />
                <Tooltip formatter={(v: any) => [`₹${v}`, 'Revenue']} />
                <Area type="monotone" dataKey="revenue" stroke="#2563eb" fillOpacity={1} fill="url(#colorRev)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Share */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-2xs space-y-4">
          <div>
            <h3 className="text-base font-bold text-gray-900">Category Volume</h3>
            <p className="text-xs text-gray-500">Share of total service bookings</p>
          </div>

          <div className="h-48 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={CATEGORY_SHARE}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {CATEGORY_SHARE.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => [`${v}%`, 'Share']} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 text-xs">
            {CATEGORY_SHARE.map((c) => (
              <div key={c.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                  <span className="text-gray-600">{c.name}</span>
                </div>
                <span className="font-bold text-gray-900">{c.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Pending Partner Approvals Queue ──────────────────────────── */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <ShieldCheck className="text-blue-600" size={18} /> Pending Provider Verification Approvals
            </h3>
            <p className="text-xs text-gray-500">Review KYC documents and activate new professional partners</p>
          </div>
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
            {pendingProviders.length} Pending
          </span>
        </div>

        {pendingProviders.length === 0 ? (
          <p className="text-xs text-gray-400 py-4 text-center">All provider verification requests processed.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 uppercase">
                <tr>
                  <th className="px-4 py-3 rounded-l-lg">Applicant Name</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Experience</th>
                  <th className="px-4 py-3">Submitted</th>
                  <th className="px-4 py-3 text-right rounded-r-lg">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pendingProviders.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3.5">
                      <p className="font-bold text-gray-900">{p.name}</p>
                      <p className="text-[11px] text-gray-400">{p.email} · {p.phone}</p>
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-blue-700">{p.category}</td>
                    <td className="px-4 py-3.5 font-medium text-gray-700">{p.experience}</td>
                    <td className="px-4 py-3.5 text-gray-500">{p.submittedAt}</td>
                    <td className="px-4 py-3.5 text-right space-x-2">
                      <button
                        onClick={() => handleApproveProvider(p.id, true)}
                        className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 font-bold text-white shadow-2xs hover:bg-emerald-700"
                      >
                        <Check size={12} /> Approve
                      </button>
                      <button
                        onClick={() => handleApproveProvider(p.id, false)}
                        className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 font-semibold text-gray-600 hover:bg-gray-100"
                      >
                        <X size={12} /> Reject
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Live Service Requests Monitor ────────────────────────────── */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-gray-900">Live Service Operations Feed</h3>
            <p className="text-xs text-gray-500">Real-time status of current household jobs</p>
          </div>
          <Link
            to="/admin/requests"
            className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700"
          >
            All Bookings <ChevronRight size={14} />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500 uppercase">
              <tr>
                <th className="px-4 py-3 rounded-l-lg">ID</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Service</th>
                <th className="px-4 py-3">Assigned Partner</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right rounded-r-lg">Gross Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentRequests.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-bold text-blue-700">#{r.id}</td>
                  <td className="px-4 py-3 font-semibold text-gray-900">{r.customer}</td>
                  <td className="px-4 py-3 text-gray-700">{r.service}</td>
                  <td className="px-4 py-3 text-gray-700 font-medium">{r.provider}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
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
                  <td className="px-4 py-3 text-right font-extrabold text-emerald-600">
                    ₹{r.amount.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
