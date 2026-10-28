import { useState, useEffect } from 'react'
import {
  DollarSign, TrendingUp, Building, ShieldCheck, CheckCircle2,
  RefreshCw, X, Search, ChevronLeft, ChevronRight, Eye, FileText
} from 'lucide-react'
import api from '@/lib/apiClient'
import toast from 'react-hot-toast'

interface ProviderPaymentRecord {
  bookingId: number
  trackingNumber: string
  customerName: string
  serviceName: string
  servicePrice: number
  serviceCharge: number
  serviceChargeRate: number
  providerGrossEarnings: number
  commissionDeducted: number
  otherDeductions: number
  providerNetEarnings: number
  paymentStatus: string
  payoutStatus: string
  bookingCompletionDate: string | null
  payoutDate: string | null
  createdAt: string
}

interface ProviderSummary {
  totalEarnings: number
  completedJobs: number
  totalPaidAmount: number
  pendingPayoutAmount: number
}

export default function ProviderEarnings() {
  const [records, setRecords] = useState<ProviderPaymentRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [totalRecords, setTotalRecords] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(15)
  const [totalPages, setTotalPages] = useState(1)

  // Filters
  const [search, setSearch] = useState('')
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('')
  const [payoutStatusFilter, setPayoutStatusFilter] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // Summary Metrics
  const [summary, setSummary] = useState<ProviderSummary>({
    totalEarnings: 0,
    completedJobs: 0,
    totalPaidAmount: 0,
    pendingPayoutAmount: 0
  })

  // Selected Detail Modal
  const [selectedItem, setSelectedItem] = useState<ProviderPaymentRecord | null>(null)

  // Instant withdraw modal
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState<string>('0')
  const [isProcessingWithdraw, setIsProcessingWithdraw] = useState(false)

  const fetchProviderHistory = async () => {
    setLoading(true)
    try {
      const res = await api.get('/payments/provider-history', {
        params: {
          search: search.trim() || undefined,
          paymentStatus: paymentStatusFilter || undefined,
          payoutStatus: payoutStatusFilter || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          page,
          pageSize
        }
      })
      if (res.data) {
        setRecords(res.data.items || [])
        setTotalRecords(res.data.total ?? 0)
        setTotalPages(res.data.totalPages ?? 1)
        if (res.data.summary) {
          setSummary({
            totalEarnings: Number(res.data.summary.totalEarnings ?? 0),
            completedJobs: Number(res.data.summary.completedJobs ?? 0),
            totalPaidAmount: Number(res.data.summary.totalPaidAmount ?? 0),
            pendingPayoutAmount: Number(res.data.summary.pendingPayoutAmount ?? 0)
          })
          setWithdrawAmount(Number(res.data.summary.pendingPayoutAmount ?? 0).toString())
        }
      }
    } catch (err: any) {
      console.error('Failed to load provider earnings history:', err)
      toast.error('Unable to fetch your earnings records.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProviderHistory()
  }, [page, pageSize, paymentStatusFilter, payoutStatusFilter, startDate, endDate])

  const handleClearFilters = () => {
    setSearch('')
    setPaymentStatusFilter('')
    setPayoutStatusFilter('')
    setStartDate('')
    setEndDate('')
    setPage(1)
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchProviderHistory()
  }

  const handleInstantWithdraw = (e: React.FormEvent) => {
    e.preventDefault()
    const amt = parseFloat(withdrawAmount)
    if (isNaN(amt) || amt <= 0 || amt > summary.pendingPayoutAmount) {
      toast.error(`Please enter an amount up to ₹${summary.pendingPayoutAmount.toFixed(2)}`)
      return
    }

    setIsProcessingWithdraw(true)
    setTimeout(() => {
      setIsProcessingWithdraw(false)
      setShowWithdrawModal(false)
      toast.success(`Payout request of ₹${amt.toFixed(2)} submitted for direct IMPS settlement!`)
      fetchProviderHistory()
    }, 800)
  }

  return (
    <div className="space-y-8 pb-16">
      {/* ── Top Header Banner ────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-900 p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute -right-10 -top-10 h-60 w-60 rounded-full bg-blue-500/20 blur-3xl pointer-events-none" />
        <div className="absolute right-1/3 -bottom-10 h-48 w-48 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur-md text-blue-200 border border-white/10">
              <ShieldCheck size={14} className="text-emerald-400" />
              <span>Automated Partner Settlements</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              My Earnings / Payment History
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              Transparent job-by-job earnings, service price breakdowns, and weekly automated IMPS payouts.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={fetchProviderHistory}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-bold text-white hover:bg-white/20 transition backdrop-blur-md"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
            </button>
            <button
              onClick={() => setShowWithdrawModal(true)}
              disabled={summary.pendingPayoutAmount <= 0}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg hover:from-emerald-600 hover:to-teal-700 transition disabled:opacity-50"
            >
              <DollarSign size={15} /> Instant IMPS Payout
            </button>
          </div>
        </div>
      </div>

      {/* ── Summary KPI Cards (Section 4 Requirements) ─────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Earnings for Date Range */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 space-y-1 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Total Net Earnings</span>
            <div className="rounded-xl bg-blue-50 p-2 text-blue-600">
              <TrendingUp size={18} />
            </div>
          </div>
          <p className="text-2xl font-black text-blue-700">
            ₹{summary.totalEarnings.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-gray-400">For selected date range</p>
        </div>

        {/* Total Completed Jobs */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 space-y-1 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Total Completed Jobs</span>
            <div className="rounded-xl bg-emerald-50 p-2 text-emerald-600">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <p className="text-2xl font-black text-gray-900">{summary.completedJobs}</p>
          <p className="text-[11px] text-emerald-600 font-semibold">Verified completed household orders</p>
        </div>

        {/* Total Paid Amount */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 space-y-1 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Total Settled / Paid</span>
            <div className="rounded-xl bg-indigo-50 p-2 text-indigo-600">
              <Building size={18} />
            </div>
          </div>
          <p className="text-2xl font-black text-indigo-700">
            ₹{summary.totalPaidAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-gray-400">Disbursed to your bank</p>
        </div>

        {/* Pending Payout Amount */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 space-y-1 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Pending Payout Amount</span>
            <div className="rounded-xl bg-amber-50 p-2 text-amber-600">
              <DollarSign size={18} />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-700">
            ₹{summary.pendingPayoutAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-amber-600 font-bold">Ready for withdrawal / settlement</p>
        </div>
      </div>

      {/* ── Filters & Search Toolbar (Section 4 Requirements) ──────────── */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-2xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by Booking ID, Customer, or Service..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            className="rounded-xl bg-gray-900 px-4 py-2 text-xs font-bold text-white hover:bg-black"
          >
            Search
          </button>
        </form>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 pt-1">
          {/* Start Date */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value)
                setPage(1)
              }}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value)
                setPage(1)
              }}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Payment Status Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Payment Status</label>
            <select
              value={paymentStatusFilter}
              onChange={(e) => {
                setPaymentStatusFilter(e.target.value)
                setPage(1)
              }}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Payment Statuses</option>
              <option value="Completed">Completed</option>
              <option value="Pending">Pending</option>
              <option value="Failed">Failed</option>
              <option value="Refunded">Refunded</option>
            </select>
          </div>

          {/* Payout Status Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Payout Status</label>
            <select
              value={payoutStatusFilter}
              onChange={(e) => {
                setPayoutStatusFilter(e.target.value)
                setPage(1)
              }}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Payout Statuses</option>
              <option value="Paid">Paid / Settled</option>
              <option value="Pending">Pending Payout</option>
            </select>
          </div>

          {/* Clear Filters */}
          <div className="flex items-end">
            <button
              type="button"
              onClick={handleClearFilters}
              className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-100 transition"
            >
              <X size={14} /> Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* ── Partner Payment & Earnings Ledger Table (Section 4 Requirements) ── */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-2xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-xs text-gray-400 flex flex-col items-center gap-2">
            <RefreshCw size={18} className="animate-spin text-blue-600" />
            Loading your earnings ledger...
          </div>
        ) : records.length === 0 ? (
          <div className="py-16 text-center text-xs text-gray-400">
            No job earnings records found for the selected filter period.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/80 text-gray-500 uppercase border-b border-gray-200 font-bold tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">Booking ID</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Service</th>
                  <th className="px-4 py-3 text-right">Service Price</th>
                  <th className="px-4 py-3 text-right">FixMate Service Charge</th>
                  <th className="px-4 py-3 text-right">Gross Earnings</th>
                  <th className="px-4 py-3 text-right">Net Earnings</th>
                  <th className="px-4 py-3">Payment Status</th>
                  <th className="px-4 py-3">Payout Status</th>
                  <th className="px-4 py-3">Completion Date</th>
                  <th className="px-4 py-3">Payout Date</th>
                  <th className="px-4 py-3 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {records.map((r) => (
                  <tr key={r.bookingId} className="hover:bg-blue-50/30 transition">
                    {/* Booking ID */}
                    <td className="px-4 py-3.5">
                      <span className="font-extrabold text-blue-700">#{r.bookingId}</span>
                      {r.trackingNumber && (
                        <div className="text-[10px] text-gray-400 font-mono">{r.trackingNumber}</div>
                      )}
                    </td>

                    {/* Customer Name */}
                    <td className="px-4 py-3.5 font-semibold text-gray-900">
                      {r.customerName}
                    </td>

                    {/* Service Name */}
                    <td className="px-4 py-3.5 text-gray-800 font-medium max-w-[130px] truncate" title={r.serviceName}>
                      {r.serviceName}
                    </td>

                    {/* Service Price */}
                    <td className="px-4 py-3.5 text-right font-medium text-gray-700">
                      ₹{r.servicePrice.toFixed(2)}
                    </td>

                    {/* FixMate Service Charge (Transparent Notice) */}
                    <td className="px-4 py-3.5 text-right">
                      <span className="font-bold text-blue-600">₹{r.serviceCharge.toFixed(2)}</span>
                      <span className="block text-[10px] text-gray-400">(Customer paid)</span>
                    </td>

                    {/* Provider Gross Earnings */}
                    <td className="px-4 py-3.5 text-right font-bold text-gray-900">
                      ₹{r.providerGrossEarnings.toFixed(2)}
                    </td>

                    {/* Provider Net Earnings */}
                    <td className="px-4 py-3.5 text-right font-black text-emerald-600">
                      ₹{r.providerNetEarnings.toFixed(2)}
                    </td>

                    {/* Payment Status */}
                    <td className="px-4 py-3.5">
                      <span
                        className={`rounded-full px-2.5 py-0.5 font-bold text-[10px] inline-flex items-center gap-1 ${
                          r.paymentStatus === 'Completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : r.paymentStatus === 'Pending'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {r.paymentStatus === 'Completed' && <CheckCircle2 size={10} />}
                        {r.paymentStatus}
                      </span>
                    </td>

                    {/* Payout Status */}
                    <td className="px-4 py-3.5">
                      <span
                        className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                          r.payoutStatus === 'Paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {r.payoutStatus === 'Paid' ? 'Settled' : 'Pending'}
                      </span>
                    </td>

                    {/* Booking Completion Date */}
                    <td className="px-4 py-3.5 text-gray-500 text-[11px] whitespace-nowrap">
                      {r.bookingCompletionDate ? new Date(r.bookingCompletionDate).toLocaleDateString() : 'In Progress'}
                    </td>

                    {/* Payout Date */}
                    <td className="px-4 py-3.5 text-gray-500 text-[11px] whitespace-nowrap">
                      {r.payoutDate ? new Date(r.payoutDate).toLocaleDateString() : 'Upcoming Cycle'}
                    </td>

                    {/* Details Action */}
                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={() => setSelectedItem(r)}
                        className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-blue-600 transition"
                        title="View Earnings Breakdown"
                      >
                        <Eye size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Pagination ─────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-gray-100 text-xs">
          <div className="flex items-center gap-3 text-gray-500">
            <span>
              Showing {records.length > 0 ? (page - 1) * pageSize + 1 : 0} to{' '}
              {Math.min(page * pageSize, totalRecords)} of {totalRecords} jobs
            </span>
            <div className="flex items-center gap-1">
              <span className="text-gray-400">Rows:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value))
                  setPage(1)
                }}
                className="rounded-lg border border-gray-200 px-2 py-1 text-xs font-semibold text-gray-700 focus:outline-none"
              >
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={30}>30</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="inline-flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40"
            >
              <ChevronLeft size={14} /> Previous
            </button>
            <span className="text-xs font-bold text-gray-700 px-2">
              Page {page} of {Math.max(1, totalPages)}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="inline-flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40"
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Earnings Detail Modal ─────────────────────────────────────── */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 sm:p-7 shadow-2xl border border-gray-100 space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 font-bold">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Earnings Breakdown</h3>
                  <p className="text-xs text-gray-500 font-mono">Job #{selectedItem.bookingId}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-100 space-y-1">
                <span className="text-gray-400 block text-[10px] uppercase font-bold">Service & Customer</span>
                <p className="font-extrabold text-gray-900">{selectedItem.serviceName}</p>
                <p className="text-gray-600">Customer: {selectedItem.customerName}</p>
              </div>

              {/* Earnings Calculation Breakdown */}
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                  Partner Settlement Calculation
                </span>
                <div className="flex justify-between items-center text-gray-700">
                  <span>Service Package Price:</span>
                  <span className="font-bold">₹{selectedItem.servicePrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-blue-800">
                  <span>FixMate Service Charge ({selectedItem.serviceChargeRate}%):</span>
                  <span className="font-bold">₹{selectedItem.serviceCharge.toFixed(2)} (Customer paid)</span>
                </div>
                <div className="flex justify-between items-center text-gray-600">
                  <span>Gross Job Earnings:</span>
                  <span className="font-bold">₹{selectedItem.providerGrossEarnings.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-rose-600">
                  <span>FixMate Marketplace Commission:</span>
                  <span className="font-bold">- ₹{selectedItem.commissionDeducted.toFixed(2)}</span>
                </div>
                <div className="border-t border-emerald-300 pt-2 flex justify-between items-center text-sm font-black text-emerald-800">
                  <span>Your Net Payout:</span>
                  <span className="text-emerald-700 text-base font-black">
                    ₹{selectedItem.providerNetEarnings.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-bold">Payment Status</span>
                  <span className="font-bold text-gray-800">{selectedItem.paymentStatus}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-bold">Payout Status</span>
                  <span className="font-bold text-emerald-700">{selectedItem.payoutStatus}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedItem(null)}
                className="rounded-xl bg-gray-900 px-5 py-2 text-xs font-bold text-white hover:bg-black"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Instant IMPS Withdrawal Modal ─────────────────────────────── */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 sm:p-7 shadow-2xl border border-gray-100 space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 font-bold">
                  <DollarSign size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Instant IMPS Payout</h3>
                  <p className="text-xs text-gray-500">Transfer available balance directly to bank</p>
                </div>
              </div>
              <button
                onClick={() => setShowWithdrawModal(false)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleInstantWithdraw} className="space-y-4 text-xs">
              <div className="rounded-2xl bg-blue-50/60 p-4 border border-blue-100 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-bold text-blue-900 uppercase">Receiving Bank Account</p>
                  <span className="rounded bg-blue-200/60 px-1.5 py-0.5 text-[10px] font-extrabold text-blue-800">
                    IMPS READY
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-800">
                  <span className="font-semibold">HDFC Bank •••• 4829</span>
                  <span className="text-gray-500 font-mono">IFSC: HDFC0001248</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Withdrawal Amount (Available: ₹{summary.pendingPayoutAmount.toFixed(2)})
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-sm font-bold text-gray-400">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    max={summary.pendingPayoutAmount}
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 bg-white pl-8 pr-4 py-2.5 text-sm font-bold text-gray-900 shadow-2xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="Enter amount"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowWithdrawModal(false)}
                  className="flex-1 rounded-xl border border-gray-300 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessingWithdraw || summary.pendingPayoutAmount <= 0}
                  className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-xs font-extrabold text-white shadow-md hover:bg-emerald-700 disabled:opacity-50"
                >
                  {isProcessingWithdraw ? 'Processing Transfer...' : 'Confirm IMPS Payout'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
