import { useState } from 'react'
import { Download } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminPayments() {
  const [payments] = useState([
    { id: 'PAY-1004', orderId: 'order_N8219xkz', amount: 548.00, fee: 82.20, providerPayout: 465.80, method: 'Razorpay UPI', status: 'Captured' },
    { id: 'PAY-1003', orderId: 'order_M9104yha', amount: 349.00, fee: 52.35, providerPayout: 296.65, method: 'Razorpay Cards', status: 'Captured' },
    { id: 'PAY-1002', orderId: 'order_K8201abc', amount: 199.00, fee: 29.85, providerPayout: 169.15, method: 'Razorpay UPI', status: 'Captured' },
    { id: 'PAY-1001', orderId: 'order_J7102qwe', amount: 249.00, fee: 37.35, providerPayout: 211.65, method: 'Razorpay NetBanking', status: 'Captured' }
  ])

  return (
    <div className="space-y-6 pb-16">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financial Ledger & Transactions</h1>
          <p className="text-xs sm:text-sm text-gray-500">Live payment reconciliations, Razorpay payment capture, and platform margins</p>
        </div>
        <button
          onClick={() => toast.success('Financial ledger CSV exported')}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700"
        >
          <Download size={14} /> Export CSV Ledger
        </button>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white shadow-2xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-gray-50 text-gray-500 uppercase border-b border-gray-100">
            <tr>
              <th className="px-5 py-3">Payment ID & Order</th>
              <th className="px-5 py-3">Method</th>
              <th className="px-5 py-3">Gross Amount</th>
              <th className="px-5 py-3">Platform Fee (15%)</th>
              <th className="px-5 py-3">Provider Payout</th>
              <th className="px-5 py-3 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {payments.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-5 py-3.5">
                  <p className="font-bold text-gray-900">{p.id}</p>
                  <p className="text-[11px] text-gray-400 font-mono">{p.orderId}</p>
                </td>
                <td className="px-5 py-3.5 text-gray-700 font-medium">{p.method}</td>
                <td className="px-5 py-3.5 font-bold text-gray-900">₹{p.amount.toFixed(2)}</td>
                <td className="px-5 py-3.5 font-bold text-blue-700">₹{p.fee.toFixed(2)}</td>
                <td className="px-5 py-3.5 font-bold text-emerald-600">₹{p.providerPayout.toFixed(2)}</td>
                <td className="px-5 py-3.5 text-right">
                  <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 font-bold text-[10px] text-emerald-800">
                    {p.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
