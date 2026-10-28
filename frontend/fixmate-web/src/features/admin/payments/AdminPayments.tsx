import { useState, useEffect } from 'react'
import {
  Download, RefreshCw, CheckCircle2, Clock, AlertTriangle, Search,
  ChevronLeft, ChevronRight, X, Eye, FileText
} from 'lucide-react'
import api from '@/lib/apiClient'
import toast from 'react-hot-toast'

interface PaymentItem {
  id: number
  requestId: number
  trackingNumber: string
  customerName: string
  customerEmail: string
  providerId: number | null
  providerName: string
  serviceId: number
  serviceName: string
  servicePrice: number
  serviceChargeRate: number
  serviceChargeAmount: number
  customerTotalAmount: number
  amount: number
  platformFee: number
  providerPayout: number
  commissionAmount: number
  status: string
  method: string
  razorpayOrderId: string
  razorpayPaymentId: string | null
  paidAt: string | null
  createdAt: string
  refundCount: number
  refundStatus: string
  totalRefunded: number
}

interface FinancialSummary {
  totalCustomerPayments: number
  totalServiceChargeCollected: number
  successfulPayments: number
  failedPayments: number
  pendingPayments: number
  totalRefunds: number
  pendingProviderPayouts: number
}

export default function AdminPayments() {
  const [payments, setPayments] = useState<PaymentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [totalRecords, setTotalRecords] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [totalPages, setTotalPages] = useState(1)

  // Filter States
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [methodFilter, setMethodFilter] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // Summary Cards State
  const [summary, setSummary] = useState<FinancialSummary>({
    totalCustomerPayments: 0,
    totalServiceChargeCollected: 0,
    successfulPayments: 0,
    failedPayments: 0,
    pendingPayments: 0,
    totalRefunds: 0,
    pendingProviderPayouts: 0
  })

  // Detail Modal State
  const [selectedTx, setSelectedTx] = useState<PaymentItem | null>(null)

  const fetchSummary = async () => {
    try {
      const res = await api.get('/payments/summary', {
        params: {
          startDate: startDate || undefined,
          endDate: endDate || undefined
        }
      })
      if (res.data) {
        setSummary({
          totalCustomerPayments: Number(res.data.totalCustomerPayments ?? 0),
          totalServiceChargeCollected: Number(res.data.totalServiceChargeCollected ?? 0),
          successfulPayments: Number(res.data.successfulPayments ?? 0),
          failedPayments: Number(res.data.failedPayments ?? 0),
          pendingPayments: Number(res.data.pendingPayments ?? 0),
          totalRefunds: Number(res.data.totalRefunds ?? 0),
          pendingProviderPayouts: Number(res.data.pendingProviderPayouts ?? 0)
        })
      }
    } catch (e) {
      console.error('Failed to fetch financial summary', e)
    }
  }

  const fetchPayments = async () => {
    setLoading(true)
    try {
      const res = await api.get('/payments', {
        params: {
          search: search.trim() || undefined,
          status: statusFilter || undefined,
          method: methodFilter || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          page,
          pageSize
        }
      })
      if (res.data?.items) {
        setPayments(res.data.items)
        setTotalRecords(res.data.total ?? 0)
        setTotalPages(res.data.totalPages ?? 1)
      }
    } catch (err: any) {
      console.error('Failed to load payments:', err)
      toast.error('Unable to fetch live payment records.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPayments()
  }, [page, pageSize, statusFilter, methodFilter, startDate, endDate])

  useEffect(() => {
    fetchSummary()
  }, [startDate, endDate])

  const handleClearFilters = () => {
    setSearch('')
    setStatusFilter('')
    setMethodFilter('')
    setStartDate('')
    setEndDate('')
    setPage(1)
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchPayments()
  }

  const handleExportCSV = () => {
    if (payments.length === 0) {
      toast.error('No payments available to export.')
      return
    }
    const headers = [
      'Transaction ID',
      'Booking ID',
      'Customer Name',
      'Provider Name',
      'Service Name',
      'Service Price',
      'Service Charge Percentage',
      'Service Charge Amount',
      'Customer Total Amount',
      'Payment Method',
      'Payment Status',
      'Refund Status',
      'Transaction Date'
    ]
    const rows = payments.map((p) => [
      `"${p.razorpayPaymentId || p.razorpayOrderId || `TX-${p.id}`}"`,
      p.requestId,
      `"${p.customerName}"`,
      `"${p.providerName}"`,
      `"${p.serviceName}"`,
      p.servicePrice.toFixed(2),
      `${p.serviceChargeRate}%`,
      p.serviceChargeAmount.toFixed(2),
      p.customerTotalAmount.toFixed(2),
      p.method,
      p.status,
      p.refundStatus || 'None',
      p.createdAt ? new Date(p.createdAt).toLocaleString() : ''
    ])
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `fixmate_payment_history_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Payment History CSV exported successfully!')
  }

  const handleRefund = async (paymentId: number, maxAmount: number) => {
    const reason = window.prompt(`Enter reason for refunding Payment #${paymentId}:`, 'Customer requested refund')
    if (!reason) return

    try {
      await api.post(`/payments/${paymentId}/refund`, {
        amount: maxAmount,
        reason
      })
      toast.success(`Refund processed for Payment #${paymentId}!`)
      fetchPayments()
      fetchSummary()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Refund processing failed.')
    }
  }

  return (
    <div className="space-y-6 pb-16">
      {/* ── Page Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-purple-100 px-2 py-0.5 text-[10px] font-black uppercase text-purple-800">
              AUDIT & LEDGER
            </span>
            <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
              ● Live DB Synchronized
            </span>
          </div>
          <h1 className="text-2xl font-black text-gray-900 mt-1">Payment History</h1>
          <p className="text-xs sm:text-sm text-gray-500">
            Comprehensive audit log of all customer bookings, FixMate Service Charges, refunds, and partner disbursements
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              fetchPayments()
              fetchSummary()
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 shadow-2xs"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 shadow-sm"
          >
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* ── Top Summary Cards (Section 6 Requirements) ───────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Customer Payments */}
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-2xs">
          <span className="text-[11px] font-semibold text-gray-500 block truncate">Total Customer Payments</span>
          <p className="text-lg sm:text-xl font-black text-gray-900 mt-1">
            ₹{summary.totalCustomerPayments.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-emerald-600 font-bold">Captured GMV</span>
        </div>

        {/* Total FixMate Service Charge Collected */}
        <div className="rounded-2xl border border-blue-200 bg-blue-50/40 p-4 shadow-2xs">
          <span className="text-[11px] font-semibold text-blue-800 block truncate">FixMate Service Charge</span>
          <p className="text-lg sm:text-xl font-black text-blue-700 mt-1">
            ₹{summary.totalServiceChargeCollected.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-blue-600 font-bold">Platform revenue</span>
        </div>

        {/* Successful Payments */}
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-2xs">
          <span className="text-[11px] font-semibold text-gray-500 block truncate">Successful Payments</span>
          <p className="text-lg sm:text-xl font-black text-emerald-600 mt-1">
            {summary.successfulPayments}
          </p>
          <span className="text-[10px] text-gray-400">Captured orders</span>
        </div>

        {/* Failed Payments */}
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-2xs">
          <span className="text-[11px] font-semibold text-gray-500 block truncate">Failed Payments</span>
          <p className="text-lg sm:text-xl font-black text-rose-600 mt-1">
            {summary.failedPayments}
          </p>
          <span className="text-[10px] text-gray-400">Gateway dropped</span>
        </div>

        {/* Total Refunds */}
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-2xs">
          <span className="text-[11px] font-semibold text-gray-500 block truncate">Total Refunds</span>
          <p className="text-lg sm:text-xl font-black text-amber-600 mt-1">
            ₹{summary.totalRefunds.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-amber-700 font-semibold">Processed refunds</span>
        </div>

        {/* Pending Provider Payouts */}
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-2xs">
          <span className="text-[11px] font-semibold text-gray-500 block truncate">Pending Payouts</span>
          <p className="text-lg sm:text-xl font-black text-indigo-700 mt-1">
            ₹{summary.pendingProviderPayouts.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-indigo-600 font-semibold">To be disbursed</span>
        </div>
      </div>

      {/* ── Filters & Search Toolbar (Section 3 Requirements) ────────── */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-2xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by Transaction ID, Booking ID, Customer, or Provider..."
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
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setPage(1)
              }}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="Completed">Completed</option>
              <option value="Pending">Pending</option>
              <option value="Failed">Failed</option>
              <option value="Refunded">Refunded</option>
              <option value="PartialRefund">Partial Refund</option>
            </select>
          </div>

          {/* Payment Method Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Payment Method</label>
            <select
              value={methodFilter}
              onChange={(e) => {
                setMethodFilter(e.target.value)
                setPage(1)
              }}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Methods</option>
              <option value="Razorpay">Razorpay (Online)</option>
              <option value="Cash">Cash (COD)</option>
              <option value="UPI">UPI</option>
            </select>
          </div>

          {/* Clear Filters Button */}
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

      {/* ── Payments History Table (Section 3 Requirements) ───────────── */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-2xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-xs text-gray-400 flex flex-col items-center gap-2">
            <RefreshCw size={18} className="animate-spin text-blue-600" />
            Loading live payment records...
          </div>
        ) : payments.length === 0 ? (
          <div className="py-16 text-center text-xs text-gray-400">
            No transactions match the selected filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/80 text-gray-500 uppercase border-b border-gray-200 font-bold tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">Transaction ID</th>
                  <th className="px-4 py-3">Booking ID</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Provider</th>
                  <th className="px-4 py-3">Service</th>
                  <th className="px-4 py-3 text-right">Service Price</th>
                  <th className="px-4 py-3 text-right">FixMate Charge (%)</th>
                  <th className="px-4 py-3 text-right">Charge Amount</th>
                  <th className="px-4 py-3 text-right">Total Amount</th>
                  <th className="px-4 py-3">Method</th>
                  <th className="px-4 py-3">Payment Status</th>
                  <th className="px-4 py-3">Refund Status</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {payments.map((p) => {
                  const txId = p.razorpayPaymentId || p.razorpayOrderId || `TX-${p.id}`
                  return (
                    <tr key={p.id} className="hover:bg-blue-50/30 transition">
                      {/* Transaction ID */}
                      <td className="px-4 py-3.5 font-mono text-[11px] font-bold text-gray-900">
                        {txId}
                      </td>

                      {/* Booking ID */}
                      <td className="px-4 py-3.5">
                        <span className="font-extrabold text-blue-700">#{p.requestId}</span>
                        {p.trackingNumber && (
                          <div className="text-[10px] text-gray-400 font-mono">{p.trackingNumber}</div>
                        )}
                      </td>

                      {/* Customer Name */}
                      <td className="px-4 py-3.5 font-semibold text-gray-900">
                        {p.customerName}
                      </td>

                      {/* Provider Name */}
                      <td className="px-4 py-3.5 font-medium text-gray-700">
                        {p.providerName}
                      </td>

                      {/* Service Name */}
                      <td className="px-4 py-3.5 text-gray-800 font-medium max-w-[140px] truncate" title={p.serviceName}>
                        {p.serviceName}
                      </td>

                      {/* Service Price */}
                      <td className="px-4 py-3.5 text-right font-medium text-gray-700">
                        ₹{p.servicePrice.toFixed(2)}
                      </td>

                      {/* Service Charge Rate */}
                      <td className="px-4 py-3.5 text-right font-bold text-blue-600">
                        {p.serviceChargeRate}%
                      </td>

                      {/* Service Charge Amount */}
                      <td className="px-4 py-3.5 text-right font-bold text-blue-700">
                        ₹{p.serviceChargeAmount.toFixed(2)}
                      </td>

                      {/* Customer Total Amount */}
                      <td className="px-4 py-3.5 text-right font-black text-gray-900">
                        ₹{p.customerTotalAmount.toFixed(2)}
                      </td>

                      {/* Payment Method */}
                      <td className="px-4 py-3.5 text-gray-600 font-semibold">
                        {p.method}
                      </td>

                      {/* Payment Status */}
                      <td className="px-4 py-3.5">
                        <span
                          className={`rounded-full px-2.5 py-0.5 font-bold text-[10px] inline-flex items-center gap-1 ${
                            p.status === 'Completed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : p.status === 'Refunded'
                              ? 'bg-amber-100 text-amber-800'
                              : p.status === 'Failed'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {p.status === 'Completed' && <CheckCircle2 size={10} />}
                          {p.status === 'Pending' && <Clock size={10} />}
                          {p.status === 'Refunded' && <AlertTriangle size={10} />}
                          {p.status}
                        </span>
                      </td>

                      {/* Refund Status */}
                      <td className="px-4 py-3.5">
                        <span
                          className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                            p.refundStatus === 'Processed' || p.refundStatus === 'Refunded'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-gray-50 text-gray-400'
                          }`}
                        >
                          {p.refundStatus || 'None'}
                        </span>
                      </td>

                      {/* Transaction Date */}
                      <td className="px-4 py-3.5 text-gray-500 text-[11px] whitespace-nowrap">
                        {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : 'N/A'}
                      </td>

                      {/* Action */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedTx(p)}
                            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-blue-600 transition"
                            title="View Transaction Details"
                          >
                            <Eye size={15} />
                          </button>
                          {p.status === 'Completed' && (
                            <button
                              onClick={() => handleRefund(p.id, p.amount)}
                              className="rounded-lg border border-red-200 px-2 py-1 text-[10px] font-bold text-red-600 hover:bg-red-50"
                            >
                              Refund
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Pagination Bar ─────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-gray-100 text-xs">
          <div className="flex items-center gap-3 text-gray-500">
            <span>
              Showing {payments.length > 0 ? (page - 1) * pageSize + 1 : 0} to{' '}
              {Math.min(page * pageSize, totalRecords)} of {totalRecords} records
            </span>
            <div className="flex items-center gap-1">
              <span className="text-gray-400">Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value))
                  setPage(1)
                }}
                className="rounded-lg border border-gray-200 px-2 py-1 text-xs font-semibold text-gray-700 focus:outline-none"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
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

      {/* ── Transaction Detail Modal ─────────────────────────────────── */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 sm:p-7 shadow-2xl border border-gray-100 space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 font-bold">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Transaction Details</h3>
                  <p className="text-xs text-gray-500 font-mono">
                    {selectedTx.razorpayPaymentId || selectedTx.razorpayOrderId || `TX-${selectedTx.id}`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedTx(null)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3.5 rounded-2xl border border-gray-100">
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-bold">Booking Reference</span>
                  <span className="font-extrabold text-blue-700">#{selectedTx.requestId}</span>
                  <div className="text-[11px] text-gray-500 font-mono">{selectedTx.trackingNumber}</div>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-bold">Date & Time</span>
                  <span className="font-semibold text-gray-800">
                    {selectedTx.createdAt ? new Date(selectedTx.createdAt).toLocaleString() : 'N/A'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3.5 rounded-2xl border border-gray-100">
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-bold">Customer</span>
                  <span className="font-bold text-gray-900">{selectedTx.customerName}</span>
                  <div className="text-[11px] text-gray-500">{selectedTx.customerEmail}</div>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-bold">Assigned Provider</span>
                  <span className="font-bold text-gray-900">{selectedTx.providerName}</span>
                </div>
              </div>

              {/* Financial Snapshot */}
              <div className="rounded-2xl border border-blue-100 bg-blue-50/40 p-4 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800 block">
                  Financial Snapshot
                </span>
                <div className="flex justify-between items-center text-gray-700">
                  <span>Base Service Price:</span>
                  <span className="font-bold">₹{selectedTx.servicePrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-blue-800">
                  <span>FixMate Service Charge ({selectedTx.serviceChargeRate}%):</span>
                  <span className="font-bold">+ ₹{selectedTx.serviceChargeAmount.toFixed(2)}</span>
                </div>
                <div className="border-t border-blue-200 pt-2 flex justify-between items-center text-sm font-black text-gray-900">
                  <span>Total Customer Paid:</span>
                  <span className="text-emerald-600">₹{selectedTx.customerTotalAmount.toFixed(2)}</span>
                </div>
                <div className="border-t border-blue-200/60 pt-2 flex justify-between items-center text-[11px] text-gray-600">
                  <span>Provider Payout Allocation:</span>
                  <span className="font-bold text-emerald-700">₹{selectedTx.providerPayout.toFixed(2)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-bold">Payment Method</span>
                  <span className="font-bold text-gray-800">{selectedTx.method}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-bold">Gateway Order ID</span>
                  <span className="font-mono text-[11px] text-gray-700">{selectedTx.razorpayOrderId}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedTx(null)}
                className="rounded-xl bg-gray-900 px-5 py-2 text-xs font-bold text-white hover:bg-black"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
