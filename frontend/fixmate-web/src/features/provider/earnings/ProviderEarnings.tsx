import { useState } from 'react'
import {
  DollarSign, TrendingUp, Building,
  ShieldCheck, CheckCircle2,
  CreditCard, RefreshCw, X
} from 'lucide-react'
import toast from 'react-hot-toast'

interface PayoutRecord {
  id: string
  date: string
  amount: number
  status: string
  method: string
  referenceNumber: string
}

export default function ProviderEarnings() {
  const [availableBalance, setAvailableBalance] = useState<number>(3650.00)
  const [lifetimeEarnings] = useState<number>(142850.00)
  const [completedJobs] = useState<number>(142)
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState<string>('3650')
  const [isProcessingWithdraw, setIsProcessingWithdraw] = useState(false)

  const [payouts, setPayouts] = useState<PayoutRecord[]>([
    {
      id: 'PAY-892',
      date: '2026-09-28',
      amount: 8450.00,
      status: 'Settled to Bank',
      method: 'IMPS Direct Transfer',
      referenceNumber: 'IMPS/6271928391/HDFC'
    },
    {
      id: 'PAY-891',
      date: '2026-09-21',
      amount: 7200.00,
      status: 'Settled to Bank',
      method: 'IMPS Direct Transfer',
      referenceNumber: 'IMPS/6264819284/HDFC'
    },
    {
      id: 'PAY-890',
      date: '2026-09-14',
      amount: 9100.00,
      status: 'Settled to Bank',
      method: 'IMPS Direct Transfer',
      referenceNumber: 'IMPS/6257391823/HDFC'
    }
  ])

  const handleInstantWithdraw = (e: React.FormEvent) => {
    e.preventDefault()
    const amt = parseFloat(withdrawAmount)
    if (isNaN(amt) || amt <= 0 || amt > availableBalance) {
      toast.error(`Please enter an amount up to ₹${availableBalance.toFixed(2)}`)
      return
    }

    setIsProcessingWithdraw(true)
    setTimeout(() => {
      const newRecord: PayoutRecord = {
        id: `PAY-${Math.floor(893 + Math.random() * 100)}`,
        date: new Date().toISOString().split('T')[0],
        amount: amt,
        status: 'Settled to Bank',
        method: 'IMPS Instant Payout',
        referenceNumber: `IMPS/${Date.now().toString().slice(-10)}/HDFC`
      }

      setPayouts([newRecord, ...payouts])
      setAvailableBalance((prev) => Math.max(0, prev - amt))
      setIsProcessingWithdraw(false)
      setShowWithdrawModal(false)
      toast.success(`Instant payout of ₹${amt.toFixed(2)} transferred to HDFC Bank A/C •••• 4829!`)
    }, 900)
  }

  return (
    <div className="space-y-8 pb-16">
      {/* ── 1. Top Header Banner ────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-900 p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute -right-10 -top-10 h-60 w-60 rounded-full bg-blue-500/20 blur-3xl pointer-events-none" />
        <div className="absolute right-1/3 -bottom-10 h-48 w-48 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur-md text-blue-200 border border-white/10">
              <ShieldCheck size={14} className="text-emerald-400" />
              <span>Automated IMPS Bank Settlements</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Partner Earnings & Payouts
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              Weekly automated settlements and instant on-demand IMPS transfers to your verified bank account.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowWithdrawModal(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-lg shadow-emerald-500/30 hover:from-emerald-600 hover:to-teal-700 transition"
            >
              <DollarSign size={16} /> Instant IMPS Payout
            </button>
          </div>
        </div>
      </div>

      {/* ── 2. Metric KPI Bento Cards ──────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 space-y-3 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-semibold">Available for Withdrawal</span>
            <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <DollarSign size={16} />
            </div>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-black text-emerald-600">₹{availableBalance.toFixed(2)}</p>
            <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">Ready for instant transfer</p>
          </div>
          <button
            onClick={() => setShowWithdrawModal(true)}
            className="w-full rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-xs py-2 transition"
          >
            Withdraw to Bank
          </button>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 space-y-3 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-semibold">Lifetime Net Earnings</span>
            <div className="h-8 w-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <TrendingUp size={16} />
            </div>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-black text-blue-700">₹{lifetimeEarnings.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">{completedJobs} completed jobs credited</p>
          </div>
          <div className="rounded-xl bg-gray-50 p-2 text-center text-[11px] font-semibold text-gray-600">
            Average payout: ₹{(lifetimeEarnings / completedJobs).toFixed(0)} per job
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 space-y-3 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-semibold">Platform Commission Rate</span>
            <div className="h-8 w-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <ShieldCheck size={16} />
            </div>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-black text-gray-900">15.0%</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Fixed verified partner rate</p>
          </div>
          <div className="rounded-xl bg-purple-50 p-2 text-center text-[11px] font-bold text-purple-700">
            0% hidden platform deductions
          </div>
        </div>
      </div>

      {/* ── 3. Bank Account & Settlement Ledger ─────────────────────────── */}
      <div className="rounded-3xl border border-gray-200 bg-white p-6 sm:p-7 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
              <Building size={18} className="text-blue-600" />
              Weekly Bank Settlement History
            </h3>
            <p className="text-xs text-gray-500">
              Direct automated bank disbursements via IMPS / NEFT (Automated payout cycle: Mondays)
            </p>
          </div>

          {/* Linked Bank Card Pill */}
          <div className="inline-flex items-center gap-2 rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-2 text-xs text-slate-700 font-semibold shadow-2xs">
            <CreditCard size={15} className="text-blue-600" />
            <div className="flex items-center gap-2">
              <span>HDFC Bank (•••• 4829)</span>
              <span className="rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.2">
                VERIFIED
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {payouts.map((p) => (
            <div
              key={p.id}
              className="rounded-2xl border border-gray-200/90 bg-white p-4 sm:p-5 transition hover:border-blue-300 hover:shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="rounded-lg bg-blue-50 border border-blue-100 px-2 py-0.5 text-xs font-black text-blue-700">
                    {p.id}
                  </span>
                  <span className="text-xs font-semibold text-gray-500">{p.date}</span>
                </div>
                <p className="text-sm font-bold text-gray-900">{p.method}</p>
                <p className="text-[11px] text-gray-400 font-mono tracking-wider">{p.referenceNumber}</p>
              </div>

              <div className="flex items-center sm:flex-col sm:items-end justify-between sm:justify-center gap-1.5 text-right">
                <p className="text-lg font-black text-emerald-600">₹{p.amount.toFixed(2)}</p>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-800">
                  <CheckCircle2 size={11} className="text-emerald-600" />
                  {p.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 4. Instant Withdrawal Modal ─────────────────────────────────── */}
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
                  <span className="font-bold">HDFC Bank Limited</span>
                  <span className="font-mono font-black text-slate-800">•••• 4829</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-gray-500">
                  <span>IFSC: <strong>HDFC0001234</strong></span>
                  <span>Branch: <strong>Valsad Station Rd</strong></span>
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700">Withdrawal Amount (₹) *</label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-gray-500 text-sm">₹</span>
                  <input
                    type="number"
                    min="100"
                    max={availableBalance}
                    required
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-8 pr-3 py-2.5 text-sm font-bold text-gray-900 outline-none focus:border-emerald-500 focus:bg-white transition"
                  />
                </div>

                {/* Quick Preset Buttons */}
                <div className="flex items-center gap-1.5 mt-2">
                  {[500, 1000, 2000, availableBalance].map((presetAmt) => (
                    <button
                      key={presetAmt}
                      type="button"
                      onClick={() => setWithdrawAmount(presetAmt.toString())}
                      className="rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-700 transition"
                    >
                      ₹{presetAmt}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setWithdrawAmount(availableBalance.toString())}
                    className="ml-auto text-[11px] font-bold text-emerald-600 hover:underline"
                  >
                    Max All
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowWithdrawModal(false)}
                  className="rounded-xl border border-gray-200 px-4 py-2.5 font-bold text-gray-600 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessingWithdraw || availableBalance <= 0}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2.5 font-bold text-white shadow-md shadow-emerald-600/30 hover:bg-emerald-700 transition disabled:opacity-50"
                >
                  {isProcessingWithdraw ? (
                    <>
                      <RefreshCw size={13} className="animate-spin" />
                      <span>Transferring IMPS...</span>
                    </>
                  ) : (
                    <span>Confirm Instant Payout</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
