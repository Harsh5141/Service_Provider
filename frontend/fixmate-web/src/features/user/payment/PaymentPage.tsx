import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { CheckCircle, ArrowLeft, Lock } from 'lucide-react'
import toast from 'react-hot-toast'

export default function PaymentPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [method, setMethod] = useState('UPI')
  const [processing, setProcessing] = useState(false)
  const [paid, setPaid] = useState(false)

  const handlePay = () => {
    setProcessing(true)
    setTimeout(() => {
      setProcessing(false)
      setPaid(true)
      toast.success('Payment completed successfully via Razorpay (Test Mode)!')
    }, 1500)
  }

  if (paid) {
    return (
      <div className="mx-auto max-w-md py-12 px-4 text-center space-y-6">
        <div className="rounded-3xl border border-emerald-100 bg-white p-8 shadow-xl space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <CheckCircle size={36} />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Payment Successful!</h2>
          <p className="text-xs text-gray-500">
            Transaction ID: <span className="font-mono font-bold text-gray-800">pay_test_98319a84</span>
          </p>
          <div className="rounded-xl bg-gray-50 p-3 text-xs flex justify-between font-bold text-gray-900">
            <span>Amount Paid:</span>
            <span className="text-emerald-600">₹548.00</span>
          </div>
          <button
            onClick={() => navigate('/requests')}
            className="w-full rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white shadow hover:bg-blue-700"
          >
            Return to Bookings
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 pb-16">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-gray-900"
      >
        <ArrowLeft size={14} /> Back
      </button>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Complete Payment</h1>
          <p className="text-xs text-gray-500">Secure 256-Bit Encrypted Razorpay Gateway</p>
        </div>

        <div className="rounded-xl bg-blue-50/70 p-4 border border-blue-100 space-y-2 text-xs">
          <div className="flex justify-between font-medium text-gray-600">
            <span>Service Booking:</span>
            <span className="font-bold text-gray-900">#{id ?? '104'}</span>
          </div>
          <div className="flex justify-between font-medium text-gray-600">
            <span>AC Jet Cleaning & Service:</span>
            <span>₹499.00</span>
          </div>
          <div className="flex justify-between font-medium text-gray-600">
            <span>GST & Taxes (18%):</span>
            <span>₹49.00</span>
          </div>
          <div className="flex justify-between border-t border-blue-200 pt-2 text-sm font-extrabold text-gray-900">
            <span>Total Payable:</span>
            <span className="text-blue-700">₹548.00</span>
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-xs font-bold text-gray-700">Select Payment Mode:</label>
          {[
            { id: 'UPI', label: 'Instant UPI (Google Pay / PhonePe / Paytm / BHIM)' },
            { id: 'CARD', label: 'Credit / Debit Card (Visa, Mastercard, RuPay)' },
            { id: 'NETBANKING', label: 'Net Banking (All Major Indian Banks)' }
          ].map((m) => (
            <button
              key={m.id}
              onClick={() => setMethod(m.id)}
              className={`w-full rounded-xl border p-3.5 text-left text-xs font-semibold transition flex items-center justify-between ${
                method === m.id
                  ? 'border-blue-600 bg-blue-50/60 text-blue-900 ring-2 ring-blue-500'
                  : 'border-gray-200 hover:bg-gray-50 text-gray-700'
              }`}
            >
              <span>{m.label}</span>
              {method === m.id && <CheckCircle size={16} className="text-blue-600" />}
            </button>
          ))}
        </div>

        <button
          onClick={handlePay}
          disabled={processing}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white shadow-md hover:bg-emerald-700 disabled:opacity-50 transition active:scale-98"
        >
          <Lock size={16} />
          {processing ? 'Processing Payment...' : 'Pay ₹548.00 Securely'}
        </button>
      </div>
    </div>
  )
}
