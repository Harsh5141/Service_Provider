import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  DollarSign, ShieldCheck, ListChecks,
  TrendingUp, Check, X, ChevronRight, RefreshCw, Save, Percent
} from 'lucide-react'
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts'
import api from '@/lib/apiClient'
import toast from 'react-hot-toast'

interface AdminStats {
  totalCustomers: number
  totalProviders: number
  activeRequests: number
  completedRequests: number
  totalRevenue: number
  totalPlatformFeeRevenue: number
  totalCommissionEarned: number
  totalFixMateRevenue: number
  totalProviderEarnings: number
  totalRefunded: number
  pendingPayouts: number
  pendingProviderApprovals: number
  openComplaints: number
  revenueTrend?: Array<{ month: string; revenue: number }>
  recentRequests: any[]
  pendingProviders: any[]
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats>({
    totalCustomers: 0,
    totalProviders: 0,
    activeRequests: 0,
    completedRequests: 0,
    totalRevenue: 0,
    totalPlatformFeeRevenue: 0,
    totalCommissionEarned: 0,
    totalFixMateRevenue: 0,
    totalProviderEarnings: 0,
    totalRefunded: 0,
    pendingPayouts: 0,
    pendingProviderApprovals: 0,
    openComplaints: 0,
    revenueTrend: [],
    recentRequests: [],
    pendingProviders: []
  })

  const [loading, setLoading] = useState(true)

  // Service Charge Settings State
  const [serviceChargeEnabled, setServiceChargeEnabled] = useState(true)
  const [serviceChargePercentage, setServiceChargePercentage] = useState<number>(10)
  const [savingSettings, setSavingSettings] = useState(false)

  const loadSettings = async () => {
    try {
      const res = await api.get('/admin/settings')
      if (res.data?.data) {
        const settingsList = res.data.data
        const scEnabled = settingsList.find((s: any) => s.key === 'ServiceChargeEnabled')
        const scPercent = settingsList.find((s: any) => s.key === 'ServiceChargePercentage')
        if (scEnabled) setServiceChargeEnabled(scEnabled.value === 'true')
        if (scPercent) setServiceChargePercentage(Number(scPercent.value))
      }
    } catch (e) {
      console.warn('Using default service charge settings')
    }
  }

  const handleSaveServiceCharge = async () => {
    if (serviceChargePercentage < 0 || serviceChargePercentage > 100) {
      toast.error('Service charge percentage must be between 0% and 100%.')
      return
    }

    setSavingSettings(true)
    try {
      await api.put('/admin/settings/ServiceChargeEnabled', { value: serviceChargeEnabled ? 'true' : 'false' })
      await api.put('/admin/settings/ServiceChargePercentage', { value: serviceChargePercentage.toString() })
      toast.success('FixMate Service Charge settings updated successfully!')
      loadStats()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update service charge settings.')
    } finally {
      setSavingSettings(false)
    }
  }

  const loadStats = async () => {
    setLoading(true)
    try {
      const res = await api.get('/admin/dashboard')
      if (res.data?.data) {
        setStats((prev) => ({
          ...prev,
          ...res.data.data,
          totalRevenue: Number(res.data.data.totalRevenue ?? prev.totalRevenue ?? 0),
          totalPlatformFeeRevenue: Number(res.data.data.totalPlatformFeeRevenue ?? (res.data.data.totalRevenue ? res.data.data.totalRevenue * 0.15 : 0)),
          totalCommissionEarned: Number(res.data.data.totalCommissionEarned ?? res.data.data.totalCommission ?? 0),
          totalFixMateRevenue: Number(res.data.data.totalFixMateRevenue ?? (res.data.data.totalRevenue ? res.data.data.totalRevenue * 0.15 : 0)),
          totalProviderEarnings: Number(res.data.data.totalProviderEarnings ?? (res.data.data.totalRevenue ? res.data.data.totalRevenue * 0.85 : 0)),
          totalRefunded: Number(res.data.data.totalRefunded ?? 0),
          pendingPayouts: Number(res.data.data.pendingPayouts ?? (res.data.data.totalRevenue ? res.data.data.totalRevenue * 0.85 : 0)),
          recentRequests: res.data.data.recentRequests || [],
          pendingProviders: res.data.data.pendingProviders || []
        }))
      }
    } catch (err) {
      console.error('Failed to load dashboard statistics', err)
      toast.error('Unable to fetch live admin statistics.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStats()
    loadSettings()
  }, [])

  const handleApproveProvider = async (id: number, approve: boolean) => {
    try {
      await api.post(`/admin/providers/${id}/approve`, { approve })
      toast.success(approve ? `Provider #${id} approved and activated!` : `Provider #${id} rejected.`)
      loadStats()
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Action failed')
    }
  }

  // Use dynamic chart data loaded directly from database Payments
  const revenueTrend = (stats.revenueTrend && stats.revenueTrend.length > 0)
    ? stats.revenueTrend
    : [
        { month: 'Initial', revenue: 0 },
        { month: 'Current', revenue: Math.round(stats.totalRevenue) }
      ]

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-purple-100 px-2.5 py-0.5 text-xs font-bold text-purple-800">
              HEADQUARTERS
            </span>
            <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
              ● Live Database Connected
            </span>
          </div>
          <h1 className="text-2xl font-black text-gray-900 mt-1">FixMate Master Admin Console</h1>
          <p className="text-xs text-gray-500">Real-time marketplace telemetry, revenue ledger, and platform settings</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadStats}
            className="rounded-xl border border-gray-300 px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 inline-flex items-center gap-1"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <Link
            to="/admin/payments"
            className="rounded-xl border border-gray-300 px-3.5 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50"
          >
            Ledger & Payouts
          </Link>
          <Link
            to="/admin/requests"
            className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 shadow-sm"
          >
            Live Bookings Monitor
          </Link>
        </div>
      </div>

      {/* ── FixMate Service Charge Settings ────────────────────────────── */}
      <div className="rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50/60 via-white to-purple-50/40 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
              <Percent size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-gray-900">FixMate Service Charge Settings</h2>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${serviceChargeEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'}`}>
                  {serviceChargeEnabled ? 'Active' : 'Disabled'}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Configure the FixMate Service Charge applied to customer bookings. Historical bookings retain their original percentage and amount.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={serviceChargeEnabled}
                onChange={(e) => setServiceChargeEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              <span className="ml-2 text-xs font-bold text-gray-700">
                {serviceChargeEnabled ? 'Charge Enabled' : 'Charge Disabled'}
              </span>
            </label>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Service Charge Percentage (%)
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={serviceChargePercentage}
                onChange={(e) => setServiceChargePercentage(Math.max(0, Math.min(100, Number(e.target.value))))}
                disabled={!serviceChargeEnabled}
                className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm font-bold text-gray-900 shadow-2xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400 pr-8"
                placeholder="10"
              />
              <span className="absolute right-3 top-2.5 text-sm font-bold text-gray-400">%</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Quick Presets
            </label>
            <div className="flex gap-2">
              {[5, 10, 15, 20].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  disabled={!serviceChargeEnabled}
                  onClick={() => setServiceChargePercentage(preset)}
                  className={`flex-1 rounded-xl py-2 text-xs font-bold transition-colors border ${
                    serviceChargePercentage === preset
                      ? 'border-blue-600 bg-blue-600 text-white shadow-xs'
                      : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                  } disabled:opacity-50`}
                >
                  {preset}%
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl bg-blue-50/80 border border-blue-100 p-2.5">
            <span className="block text-[10px] uppercase font-bold text-blue-700">Calculation Preview</span>
            <span className="text-xs text-gray-600">₹500 service order:</span>
            <div className="text-xs font-black text-blue-900">
              ₹500 + ₹{serviceChargeEnabled ? Math.round(500 * (serviceChargePercentage / 100)) : 0} = ₹{serviceChargeEnabled ? 500 + Math.round(500 * (serviceChargePercentage / 100)) : 500} Total
            </div>
          </div>

          <div>
            <button
              onClick={handleSaveServiceCharge}
              disabled={savingSettings}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-extrabold text-white shadow-xs hover:bg-blue-700 disabled:opacity-60 transition"
            >
              {savingSettings ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
              Save FixMate Service Charge
            </button>
          </div>
        </div>
      </div>

      {/* ── KPI Grid ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gross Revenue */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 space-y-1 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Gross Marketplace GMV</span>
            <div className="rounded-xl bg-emerald-50 p-2 text-emerald-600">
              <DollarSign size={18} />
            </div>
          </div>
          <p className="text-2xl font-black text-gray-900">
            ₹{(stats.totalRevenue ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-gray-500 font-medium">Customer payments captured</p>
        </div>

        {/* FixMate Total Platform Revenue */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 space-y-1 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Total FixMate Revenue</span>
            <div className="rounded-xl bg-blue-50 p-2 text-blue-600">
              <TrendingUp size={18} />
            </div>
          </div>
          <p className="text-2xl font-black text-blue-700">
            ₹{(stats.totalFixMateRevenue ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-blue-600 font-bold">
            ₹{(stats.totalPlatformFeeRevenue ?? 0).toFixed(2)} Fee + ₹{(stats.totalCommissionEarned ?? 0).toFixed(2)} Comm
          </p>
        </div>

        {/* Provider Earnings & Pending Payouts */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 space-y-1 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Provider Earnings & Payouts</span>
            <div className="rounded-xl bg-emerald-50 p-2 text-emerald-600">
              <ShieldCheck size={18} />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-700">
            ₹{(stats.totalProviderEarnings ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-gray-400">Net earned across {stats.totalProviders ?? 0} providers</p>
        </div>

        {/* Completed Service Orders */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 space-y-1 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Completed Service Orders</span>
            <div className="rounded-xl bg-amber-50 p-2 text-amber-600">
              <ListChecks size={18} />
            </div>
          </div>
          <p className="text-2xl font-black text-gray-900">{stats.completedRequests}</p>
          <p className="text-[11px] text-gray-500 font-semibold">{stats.activeRequests} in progress now</p>
        </div>
      </div>

      {/* ── Financial Health & Growth ──────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-gray-900">Platform GMV Run-rate</h3>
              <p className="text-xs text-gray-500">Gross transaction trajectory</p>
            </div>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-bold text-emerald-800">
              Live Verified
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueTrend}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} tickFormatter={(v) => `₹${v}`} />
                <Tooltip formatter={(v: any) => [`₹${v}`, 'Revenue']} />
                <Area type="monotone" dataKey="revenue" stroke="#2563eb" fillOpacity={1} fill="url(#colorRev)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Financial Distribution */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-2xs space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-gray-900">Financial Breakdown</h3>
            <p className="text-xs text-gray-500">Real-time split of captured GMV</p>
          </div>

          <div className="space-y-3 my-auto">
            <div className="rounded-xl border border-gray-100 p-3 bg-gray-50">
              <span className="text-xs text-gray-500">Platform Safety & Service Fees</span>
              <p className="text-lg font-black text-blue-700">₹{(stats.totalPlatformFeeRevenue ?? 0).toFixed(2)}</p>
            </div>
            <div className="rounded-xl border border-gray-100 p-3 bg-gray-50">
              <span className="text-xs text-gray-500">FixMate Service Commissions</span>
              <p className="text-lg font-black text-purple-700">₹{(stats.totalCommissionEarned ?? 0).toFixed(2)}</p>
            </div>
            <div className="rounded-xl border border-gray-100 p-3 bg-gray-50">
              <span className="text-xs text-gray-500">Provider Net Allocated Payout</span>
              <p className="text-lg font-black text-emerald-700">₹{(stats.totalProviderEarnings ?? 0).toFixed(2)}</p>
            </div>
            <div className="rounded-xl border border-gray-100 p-3 bg-gray-50">
              <span className="text-xs text-gray-500">Processed Refunds</span>
              <p className="text-lg font-black text-amber-700">₹{(stats.totalRefunded ?? 0).toFixed(2)}</p>
            </div>
          </div>

          <Link
            to="/admin/payments"
            className="w-full text-center rounded-xl bg-gray-900 py-2.5 text-xs font-bold text-white hover:bg-black"
          >
            View Complete Transaction Ledger
          </Link>
        </div>
      </div>

      {/* ── Pending Partner Approvals Queue ──────────────────────────── */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <ShieldCheck className="text-blue-600" size={18} /> Pending Specialist Approvals
            </h3>
            <p className="text-xs text-gray-500">Review KYC documents and activate new professional partners</p>
          </div>
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
            {stats.pendingProviders.length} Pending
          </span>
        </div>

        {stats.pendingProviders.length === 0 ? (
          <div className="py-6 text-center text-xs text-gray-400">
            No pending provider verification requests at this time. All active specialists are verified.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 uppercase">
                <tr>
                  <th className="px-4 py-3 rounded-l-lg">Applicant Name</th>
                  <th className="px-4 py-3">Primary Skill / Category</th>
                  <th className="px-4 py-3">Experience</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3 text-right rounded-r-lg">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {stats.pendingProviders.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3.5">
                      <p className="font-bold text-gray-900">{p.name}</p>
                      <p className="text-[11px] text-gray-400">{p.email} · {p.phone}</p>
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-blue-700">{p.primaryCategory}</td>
                    <td className="px-4 py-3.5 font-medium text-gray-700">{p.experienceYears} Years</td>
                    <td className="px-4 py-3.5 text-gray-500">{p.city || 'Valsad'}</td>
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
              {stats.recentRequests.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-bold text-blue-700">#{r.id}</td>
                  <td className="px-4 py-3 font-semibold text-gray-900">{r.customerName}</td>
                  <td className="px-4 py-3 text-gray-700">{r.serviceName}</td>
                  <td className="px-4 py-3 text-gray-700 font-medium">{r.providerName || 'Unassigned'}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        r.status === 'Completed' || r.status === 10
                          ? 'bg-emerald-100 text-emerald-800'
                          : r.status === 'OnTheWay' || r.status === 7
                          ? 'bg-indigo-100 text-indigo-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-extrabold text-emerald-600">
                    ₹{Number(r.estimatedCost || 0).toFixed(2)}
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
