import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import {
  History, Tv, Plus, Download, ShieldCheck,
  Calendar, Wrench, Clock, Droplets, Wind, Flame,
  Search, ChevronRight, X, CheckCircle2, XCircle, AlertTriangle,
  PackageCheck, Info, Printer, FileText
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '@/lib/apiClient'

interface ReplacedPart {
  name: string
  price: number
  imageUrl: string
  reason?: string
}

interface AdditionalServiceCharge {
  title: string
  amount: number
  description: string
}

interface ApplianceEquipment {
  id: number
  name: string
  category: string
  brand: string
  modelNumber: string
  purchaseDate: string
  warrantyStatus: 'Active' | 'Expiring Soon' | 'Expired'
  healthStatus: 'Healthy & Calibrated' | 'Seasonal Care Due Soon' | 'Filter Replacement Recommended'
  healthColor: 'emerald' | 'amber' | 'rose'
  lastServicedDate: string
  serviceCount: number
}

interface ServiceHistoryItem {
  id: number
  applianceId: number
  applianceName: string
  serviceCategory: string
  serviceDone: string
  serviceDate: string
  amountPaid: number
  providerName: string
  providerRating: number
  invoiceNumber: string
  notes: string
  warrantyCoverageDays: number
  nextServiceRecommendedDate: string
  // Additional services & replaced spare parts
  additionalCharges?: AdditionalServiceCharge[]
  replacedParts?: ReplacedPart[]
  approvalStatus?: 'Approved' | 'Pending Approval' | 'Rejected'
}

export default function ServiceHistoryPage() {
  const navigate = useNavigate()

  const [appliances, setAppliances] = useState<ApplianceEquipment[]>([])
  const [historyItems, setHistoryItems] = useState<ServiceHistoryItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await api.get('/requests/my')
        if (res.data?.data && Array.isArray(res.data.data)) {
          // Normalize status helper
          const getStatus = (req: any): string => {
            if (req.statusText) return req.statusText.toLowerCase()
            if (typeof req.status === 'string') return req.status.toLowerCase()
            switch (Number(req.status)) {
              case 9: return 'completed'
              case 6: return 'invoiced'
              default: return ''
            }
          }

          // Only keep completed / paid / reviewed requests
          const completedRequests = res.data.data.filter((req: any) => {
            const st = getStatus(req)
            return ['completed', 'paid', 'reviewed'].includes(st)
          })

          const mapped: ServiceHistoryItem[] = completedRequests.map((req: any) => {
            const serviceDate = req.scheduledDate
              ? new Date(req.scheduledDate).toLocaleDateString('en-IN', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })
              : new Date(req.createdAt).toLocaleDateString('en-IN', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })

            const nextDate = new Date()
            nextDate.setMonth(nextDate.getMonth() + 6)
            const nextServiceStr = nextDate.toLocaleDateString('en-IN', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })

            return {
              id: req.id,
              applianceId: req.applianceId || req.id,
              applianceName: req.serviceName || 'Home Appliance Care',
              serviceCategory: req.categoryName || 'Household Repair',
              serviceDone: req.serviceName || 'Professional Maintenance',
              serviceDate: serviceDate,
              amountPaid: req.finalCost || req.estimatedCost || 0,
              providerName: req.providerName || 'FixMate Certified Partner',
              providerRating: req.providerRating || 4.9,
              invoiceNumber: `INV-FXM-${req.id.toString().padStart(4, '0')}`,
              notes: req.problemDescription || 'Standard diagnosis & repair service completed successfully.',
              warrantyCoverageDays: 30,
              nextServiceRecommendedDate: nextServiceStr,
              approvalStatus: 'Approved'
            }
          })

          setHistoryItems(mapped)
        }
      } catch (err) {
        console.error('Error fetching service history', err)
      } finally {
        setLoading(false)
      }
    }

    fetchHistory()
  }, [])

  const handleApprovePartChange = (itemId: number) => {
    setHistoryItems((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          return { ...item, approvalStatus: 'Approved' }
        }
        return item
      })
    )
    toast.success('Additional services & replaced part changes approved successfully!')
  }

  const handleRejectPartChange = (itemId: number) => {
    setHistoryItems((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          return { ...item, approvalStatus: 'Rejected' }
        }
        return item
      })
    )
    toast.error('Additional charge request declined.')
  }

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedApplianceFilter, setSelectedApplianceFilter] = useState<string>('ALL')
  const [showAddModal, setShowAddModal] = useState(false)
  const [newAppliance, setNewAppliance] = useState({
    name: '',
    category: 'Air Conditioner',
    brand: '',
    modelNumber: '',
    purchaseDate: ''
  })

  const handleAddAppliance = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newAppliance.name.trim()) {
      toast.error('Appliance name is required')
      return
    }

    const created: ApplianceEquipment = {
      id: Date.now(),
      name: newAppliance.name.trim(),
      category: newAppliance.category,
      brand: newAppliance.brand.trim() || 'Generic',
      modelNumber: newAppliance.modelNumber.trim() || 'N/A',
      purchaseDate: newAppliance.purchaseDate || new Date().toISOString().split('T')[0],
      warrantyStatus: 'Active',
      healthStatus: 'Healthy & Calibrated',
      healthColor: 'emerald',
      lastServicedDate: 'Not Serviced Yet',
      serviceCount: 0
    }

    setAppliances([created, ...appliances])
    toast.success(`${created.name} registered to your digital equipment hub!`)
    setShowAddModal(false)
    setNewAppliance({
      name: '',
      category: 'Air Conditioner',
      brand: '',
      modelNumber: '',
      purchaseDate: ''
    })
  }

  const [selectedInvoice, setSelectedInvoice] = useState<ServiceHistoryItem | null>(null)

  const handleDownloadInvoice = (item: ServiceHistoryItem) => {
    setSelectedInvoice(item)
  }

  const handlePrintInvoice = () => {
    const printContent = document.getElementById('fixmate-printable-invoice')
    if (!printContent) {
      window.print()
      return
    }

    const printWindow = window.open('', '_blank', 'width=850,height=950')
    if (!printWindow) {
      window.print()
      return
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <title>Invoice_${selectedInvoice?.invoiceNumber || 'FixMate'}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @page {
              size: A4 portrait;
              margin: 10mm 12mm;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
              color: #111827;
              background-color: #ffffff;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              padding: 0;
              margin: 0;
            }
            .invoice-wrap {
              width: 100%;
              max-width: 800px;
              margin: 0 auto;
              padding: 10px;
            }
          </style>
        </head>
        <body onload="window.focus(); setTimeout(() => { window.print(); window.close(); }, 350);">
          <div class="invoice-wrap">
            ${printContent.innerHTML}
          </div>
        </body>
      </html>
    `

    printWindow.document.open()
    printWindow.document.write(htmlContent)
    printWindow.document.close()
  }

  const filteredHistory = historyItems.filter((item) => {
    if (selectedApplianceFilter !== 'ALL' && item.applianceName !== selectedApplianceFilter) {
      return false
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      return (
        item.applianceName.toLowerCase().includes(q) ||
        item.serviceDone.toLowerCase().includes(q) ||
        item.providerName.toLowerCase().includes(q) ||
        item.invoiceNumber.toLowerCase().includes(q)
      )
    }
    return true
  })

  const getCategoryIcon = (category: string) => {
    const c = category.toLowerCase()
    if (c.includes('ac') || c.includes('cool') || c.includes('air')) return <Wind size={18} className="text-sky-500" />
    if (c.includes('purifier') || c.includes('water') || c.includes('ro')) return <Droplets size={18} className="text-cyan-500" />
    if (c.includes('geyser') || c.includes('heat')) return <Flame size={18} className="text-amber-500" />
    if (c.includes('wash') || c.includes('appliance') || c.includes('tv')) return <Tv size={18} className="text-indigo-500" />
    return <Wrench size={18} className="text-blue-500" />
  }

  return (
    <div className="space-y-8 pb-16">
      {/* ── 1. Top Header Banner ────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-900 p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute -right-10 -top-10 h-60 w-60 rounded-full bg-blue-500/20 blur-3xl pointer-events-none" />
        <div className="absolute right-1/3 -bottom-10 h-48 w-48 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur-md text-blue-200 border border-white/10">
              <ShieldCheck size={14} className="text-emerald-400" />
              <span>Digital Home Equipment Passport</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Household Service History
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              Comprehensive maintenance passport, appliance warranty records, and downloadable tax invoices for your home.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-lg shadow-blue-500/30 hover:from-blue-600 hover:to-indigo-700 transition"
            >
              <Plus size={16} /> Register New Appliance
            </button>
          </div>
        </div>
      </div>

      {/* ── 2. Summary Metric Cards ────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold">Registered Appliances</span>
            <div className="h-8 w-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Tv size={16} />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-gray-900">{appliances.length} Devices</div>
          <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">
            {appliances.length > 0 ? '100% digital records documented' : 'No appliances registered yet'}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold">Lifetime Service Investment</span>
            <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <ShieldCheck size={16} />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-blue-700">
            ₹{historyItems.reduce((acc, item) => acc + item.amountPaid, 0).toFixed(2)}
          </div>
          <p className="text-[11px] text-gray-400 mt-0.5">
            Across {historyItems.length} certified maintenance job{historyItems.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold">Upcoming Routine Due</span>
            <div className="h-8 w-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Clock size={16} />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-amber-600">
            {appliances.length > 0 ? appliances[0].name : 'All Systems Clean'}
          </div>
          <p className="text-[11px] text-amber-700 font-semibold mt-0.5">
            {appliances.length > 0 ? 'Routine checkup scheduled' : 'Add equipment to start tracking'}
          </p>
        </div>
      </div>

      {/* ── 3. Registered Appliances Bento Grid ────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Tv size={18} className="text-blue-600" />
            Registered Household Equipment
          </h2>
          <span className="text-xs text-gray-500">{appliances.length} Devices Connected</span>
        </div>

        {appliances.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-8 text-center space-y-3">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Tv size={24} />
            </div>
            <h3 className="text-sm font-bold text-gray-800">No Appliances Registered Yet</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              Add your air conditioners, washing machines, RO purifiers or refrigerators to track maintenance cycles and warranty dates.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-blue-700 transition"
            >
              <Plus size={14} /> Register Your First Appliance
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {appliances.map((app) => (
              <div
                key={app.id}
                className="rounded-2xl border border-gray-200 bg-white p-5 space-y-3.5 shadow-xs transition hover:border-blue-300 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0">
                      {getCategoryIcon(app.category)}
                    </div>
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold text-gray-900 line-clamp-1">{app.name}</h3>
                      <p className="text-[11px] text-gray-500">{app.brand} · Model {app.modelNumber}</p>
                    </div>
                  </div>
                </div>

                {/* Status Pills */}
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold ${
                      app.healthColor === 'emerald'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : app.healthColor === 'amber'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        app.healthColor === 'emerald'
                          ? 'bg-emerald-500'
                          : app.healthColor === 'amber'
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      }`}
                    />
                    {app.healthStatus}
                  </span>

                  <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-600">
                    {app.serviceCount} service{app.serviceCount !== 1 ? 's' : ''} logged
                  </span>
                </div>

                {/* Meta details */}
                <div className="border-t border-gray-100 pt-3 flex items-center justify-between text-xs text-gray-500">
                  <span>Last service: <strong className="text-gray-700">{app.lastServicedDate}</strong></span>
                  <button
                    onClick={() => navigate('/requests/new')}
                    className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700"
                  >
                    <span>Book Service</span>
                    <ChevronRight size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── 4. Detailed Maintenance & Repair Log ──────────────────────── */}
      <div className="rounded-3xl border border-gray-200 bg-white p-6 sm:p-7 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
              <History size={18} className="text-blue-600" />
              Verified Maintenance & Invoice Log
            </h3>
            <p className="text-xs text-gray-500">
              Complete historical record of certified work performed with tamper-proof service invoices
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <select
              value={selectedApplianceFilter}
              onChange={(e) => setSelectedApplianceFilter(e.target.value)}
              className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-700 outline-none focus:border-blue-500 focus:bg-white"
            >
              <option value="ALL">All Appliances ({historyItems.length})</option>
              {Array.from(new Set(historyItems.map((h) => h.applianceName))).map((app) => (
                <option key={app} value={app}>
                  {app}
                </option>
              ))}
            </select>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search invoices, repairs..."
                className="w-full sm:w-56 rounded-xl border border-gray-200 bg-gray-50 pl-8 pr-3 py-1.5 text-xs text-gray-800 placeholder-gray-400 outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center space-y-3">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            <p className="text-xs font-semibold text-gray-500">Loading your household service history...</p>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/60 p-8 text-center space-y-2">
            <History size={24} className="mx-auto text-gray-400" />
            <h4 className="text-xs font-bold text-gray-700">No Service Records Found</h4>
            <p className="text-[11px] text-gray-400 max-w-xs mx-auto">
              Completed bookings with verified diagnostic notes, invoices, and warranty coverage will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredHistory.map((item) => (
            <div
              key={item.id}
              className="relative rounded-2xl border border-gray-200/90 bg-white p-5 sm:p-6 transition-all duration-200 hover:border-blue-300 hover:shadow-md space-y-3.5"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-lg bg-blue-50 px-2 py-0.5 text-xs font-extrabold text-blue-700">
                      {item.invoiceNumber}
                    </span>
                    <span className="rounded-lg bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-700">
                      {item.serviceCategory}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-bold">
                      <ShieldCheck size={12} /> {item.warrantyCoverageDays}-Day Warranty
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-gray-900">{item.applianceName}</h4>
                  <p className="text-xs font-semibold text-blue-700">{item.serviceDone}</p>
                </div>

                <div className="flex items-center sm:flex-col sm:items-end justify-between sm:justify-start gap-2 text-right">
                  <div>
                    <p className="text-base font-extrabold text-emerald-600">₹{item.amountPaid.toFixed(2)}</p>
                    <span className="text-[10px] text-gray-400">Includes GST & Parts</span>
                  </div>
                  <button
                    onClick={() => handleDownloadInvoice(item)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-50 hover:border-blue-300 transition shadow-2xs"
                  >
                    <Download size={13} className="text-blue-600" />
                    <span>Download Invoice</span>
                  </button>
                </div>
              </div>

              {/* Service notes */}
              <div className="rounded-xl bg-slate-50 p-3 text-xs text-gray-600 border border-slate-100">
                <p className="leading-relaxed"><strong className="text-gray-700">Technician Diagnosis & Notes:</strong> {item.notes}</p>
              </div>

              {/* Additional Services & Extra Charges Section */}
              {item.additionalCharges && item.additionalCharges.length > 0 && (
                <div className="rounded-xl bg-amber-50/70 border border-amber-200/80 p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                      <Wrench size={14} className="text-amber-600" /> Additional Service Charges
                    </span>
                    <span className="text-xs font-black text-amber-800">
                      +₹{item.additionalCharges.reduce((acc, c) => acc + c.amount, 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {item.additionalCharges.map((charge, idx) => (
                      <div key={idx} className="flex items-start justify-between text-xs bg-white/80 p-2 rounded-lg border border-amber-100">
                        <div>
                          <p className="font-bold text-gray-800">{charge.title}</p>
                          <p className="text-[11px] text-gray-500">{charge.description}</p>
                        </div>
                        <span className="font-extrabold text-amber-700 shrink-0 ml-2">₹{charge.amount.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Replaced Parts Details with Image and Product Price */}
              {item.replacedParts && item.replacedParts.length > 0 && (
                <div className="rounded-xl bg-blue-50/60 border border-blue-200/80 p-3.5 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <PackageCheck size={16} className="text-blue-600" />
                      <span className="text-xs font-bold text-gray-900">Replaced Appliance Parts & Components</span>
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-extrabold text-blue-700">
                        {item.replacedParts.length} Part{item.replacedParts.length > 1 ? 's' : ''} Changed
                      </span>
                    </div>

                    {/* Customer Side Approval Badge */}
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-gray-500 font-medium">Customer Status:</span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                          item.approvalStatus === 'Approved'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : item.approvalStatus === 'Rejected'
                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                            : 'bg-amber-100 text-amber-800 border border-amber-300 animate-pulse'
                        }`}
                      >
                        {item.approvalStatus === 'Approved' && <CheckCircle2 size={12} className="text-emerald-600" />}
                        {item.approvalStatus === 'Rejected' && <XCircle size={12} className="text-rose-600" />}
                        {item.approvalStatus === 'Pending Approval' && <AlertTriangle size={12} className="text-amber-600" />}
                        {item.approvalStatus || 'Pending Approval'}
                      </span>
                    </div>
                  </div>

                  {/* Parts List: Only Image, Product Name & Product Price as requested */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {item.replacedParts.map((part, pIdx) => (
                      <div
                        key={pIdx}
                        className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-blue-100 shadow-2xs hover:border-blue-300 transition"
                      >
                        <img
                          src={part.imageUrl}
                          alt={part.name}
                          className="h-14 w-14 rounded-lg object-cover border border-gray-200 shrink-0 bg-gray-50"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-gray-900 truncate" title={part.name}>
                            {part.name}
                          </p>
                          <div className="mt-1 flex items-baseline gap-1">
                            <span className="text-[10px] text-gray-400 font-medium">Part Price:</span>
                            <span className="text-xs font-black text-emerald-600">₹{part.price.toFixed(2)}</span>
                          </div>
                          {part.reason && (
                            <p className="text-[10px] text-gray-400 truncate mt-0.5" title={part.reason}>
                              Info: {part.reason}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* User-side Approve / Reject Button when Pending */}
                  {item.approvalStatus === 'Pending Approval' && (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 border-t border-blue-100 bg-white/70 p-3 rounded-lg">
                      <div className="flex items-center gap-1.5 text-xs text-gray-600">
                        <Info size={14} className="text-blue-600 shrink-0" />
                        <span>Technician has proposed additional part replacement. Please review and approve.</span>
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        <button
                          type="button"
                          onClick={() => handleRejectPartChange(item.id)}
                          className="px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50 text-xs font-bold text-rose-700 hover:bg-rose-100 transition cursor-pointer"
                        >
                          Decline
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApprovePartChange(item.id)}
                          className="inline-flex items-center gap-1 px-4 py-1.5 rounded-lg bg-emerald-600 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition cursor-pointer"
                        >
                          <CheckCircle2 size={13} /> Approve Charges & Part
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Footer Meta */}
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-gray-500 pt-1 border-t border-gray-100">
                <div className="flex flex-wrap items-center gap-4">
                  <span className="flex items-center gap-1">
                    <Calendar size={13} className="text-blue-600" />
                    <span>Serviced: <strong>{item.serviceDate}</strong></span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Wrench size={13} className="text-emerald-600" />
                    <span>Technician: <strong>{item.providerName}</strong> (⭐ {item.providerRating})</span>
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md font-semibold">
                    Next recommended checkup: {item.nextServiceRecommendedDate}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>

      {/* ── 5. Add Appliance Modal ──────────────────────────────────────── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 sm:p-7 shadow-2xl border border-gray-100 space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 font-bold">
                  <Tv size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Register Appliance</h3>
                  <p className="text-xs text-gray-500">Track appliance lifecycle & routine services</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddAppliance} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-gray-700">Appliance Name / Description *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Master Bedroom Inverter AC"
                  value={newAppliance.name}
                  onChange={(e) => setNewAppliance({ ...newAppliance, name: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-900 outline-none focus:border-blue-600 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700">Appliance Category</label>
                <select
                  value={newAppliance.category}
                  onChange={(e) => setNewAppliance({ ...newAppliance, category: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-900 outline-none focus:border-blue-600 focus:bg-white"
                >
                  <option value="Air Conditioner">Air Conditioner (AC)</option>
                  <option value="Washing Machine">Washing Machine</option>
                  <option value="Water Purifier">RO Water Purifier</option>
                  <option value="Refrigerator">Refrigerator</option>
                  <option value="Water Geyser">Water Geyser</option>
                  <option value="Television">Television (Smart TV)</option>
                  <option value="CCTV Security">CCTV Security System</option>
                  <option value="Microwave Oven">Microwave Oven</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700">Brand Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Samsung, Daikin"
                    value={newAppliance.brand}
                    onChange={(e) => setNewAppliance({ ...newAppliance, brand: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-900 outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700">Model Number</label>
                  <input
                    type="text"
                    placeholder="e.g. AR18TY5"
                    value={newAppliance.modelNumber}
                    onChange={(e) => setNewAppliance({ ...newAppliance, modelNumber: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-900 outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700">Installation / Purchase Date</label>
                <input
                  type="date"
                  value={newAppliance.purchaseDate}
                  onChange={(e) => setNewAppliance({ ...newAppliance, purchaseDate: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-900 outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl border border-gray-200 px-4 py-2.5 font-bold text-gray-600 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-5 py-2.5 font-bold text-white shadow-md hover:bg-blue-700 transition"
                >
                  Save Equipment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 6. Professional Tax Invoice Modal (Portaled to document.body) ── */}
      {selectedInvoice &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in">
            <div className="relative w-full max-w-3xl rounded-3xl bg-white shadow-2xl border border-gray-200 overflow-hidden my-8">
              {/* Modal Header Bar with Actions */}
              <div className="flex items-center justify-between border-b border-gray-200 bg-slate-900 px-6 py-4 text-white print:hidden">
                <div className="flex items-center gap-2.5">
                  <FileText className="text-blue-400" size={20} />
                  <div>
                    <h3 className="text-sm font-bold">Tax Invoice #{selectedInvoice.invoiceNumber}</h3>
                    <p className="text-[11px] text-gray-400">Official digital receipt & warranty certificate</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrintInvoice}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition"
                  >
                    <Printer size={14} />
                    <span>Print / PDF</span>
                  </button>
                  <button
                    onClick={() => setSelectedInvoice(null)}
                    className="rounded-xl p-1.5 text-gray-400 hover:bg-slate-800 hover:text-white transition cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Printable Invoice Container */}
              <div id="fixmate-printable-invoice" className="p-8 space-y-6 text-gray-900 bg-white">
                {/* Invoice Top Branding */}
                <div className="flex flex-col sm:flex-row items-start justify-between gap-4 border-b border-gray-200 pb-6">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-base shadow-sm">
                        F
                      </div>
                      <span className="text-xl font-black tracking-tight text-gray-900">
                        Fix<span className="text-blue-600">Mate</span>
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Certified On-Demand Home Services & Maintenance</p>
                    <p className="text-[11px] text-gray-400">GSTIN: 24AABCF1234F1Z8 · Support: support@fixmate.in</p>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Paid In Full
                    </span>
                    <h2 className="text-xl font-black text-gray-900 mt-2">ORIGINAL TAX INVOICE</h2>
                    <p className="text-xs font-bold text-blue-600">{selectedInvoice.invoiceNumber}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">Date: {selectedInvoice.serviceDate}</p>
                  </div>
                </div>

                {/* Billed To & Service Professional Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50/70 p-4 rounded-2xl border border-slate-100 text-xs">
                  <div>
                    <p className="font-bold text-gray-400 uppercase tracking-wider text-[10px]">Service Location / Customer</p>
                    <p className="font-black text-gray-900 text-sm mt-1">Registered FixMate Customer</p>
                    <p className="text-gray-600 mt-0.5">Appliance: <strong className="text-gray-900">{selectedInvoice.applianceName}</strong></p>
                    <p className="text-gray-600">Category: {selectedInvoice.serviceCategory}</p>
                  </div>
                  <div className="sm:text-right">
                    <p className="font-bold text-gray-400 uppercase tracking-wider text-[10px]">Certified Professional</p>
                    <p className="font-black text-gray-900 text-sm mt-1">{selectedInvoice.providerName}</p>
                    <p className="text-gray-600 mt-0.5">FixMate Verified Specialist (★ {selectedInvoice.providerRating.toFixed(2)})</p>
                    <p className="text-gray-600">Warranty: <strong className="text-emerald-700">{selectedInvoice.warrantyCoverageDays}-Day Warranty Protection</strong></p>
                  </div>
                </div>

                {/* Itemized Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b-2 border-gray-200 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                        <th className="py-2.5 px-3">Description</th>
                        <th className="py-2.5 px-3">Type</th>
                        <th className="py-2.5 px-3 text-right">Qty</th>
                        <th className="py-2.5 px-3 text-right">Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {/* Primary Service */}
                      <tr>
                        <td className="py-3 px-3">
                          <p className="font-bold text-gray-900">{selectedInvoice.serviceDone}</p>
                          <p className="text-[11px] text-gray-500">{selectedInvoice.notes}</p>
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold text-[10px]">
                            Base Service
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-medium">1</td>
                        <td className="py-3 px-3 text-right font-bold text-gray-900">
                          ₹{(
                            selectedInvoice.amountPaid -
                            (selectedInvoice.additionalCharges?.reduce((acc, c) => acc + c.amount, 0) || 0) -
                            (selectedInvoice.replacedParts?.reduce((acc, p) => acc + p.price, 0) || 0)
                          ).toFixed(2)}
                        </td>
                      </tr>

                      {/* Additional Service Charges */}
                      {selectedInvoice.additionalCharges?.map((charge, idx) => (
                        <tr key={'charge-' + idx}>
                          <td className="py-3 px-3">
                            <p className="font-bold text-gray-900">{charge.title}</p>
                            <p className="text-[11px] text-gray-500">{charge.description}</p>
                          </td>
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 font-bold text-[10px]">
                              Add-on Care
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right font-medium">1</td>
                          <td className="py-3 px-3 text-right font-bold text-gray-900">
                            ₹{charge.amount.toFixed(2)}
                          </td>
                        </tr>
                      ))}

                      {/* Replaced Spare Parts */}
                      {selectedInvoice.replacedParts?.map((part, idx) => (
                        <tr key={'part-' + idx}>
                          <td className="py-3 px-3">
                            <p className="font-bold text-gray-900">{part.name}</p>
                            <p className="text-[11px] text-gray-500">{part.reason || 'Replaced OEM genuine spare part'}</p>
                          </td>
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-bold text-[10px]">
                              OEM Part
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right font-medium">1</td>
                          <td className="py-3 px-3 text-right font-bold text-gray-900">
                            ₹{part.price.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Subtotal & Total Breakdown */}
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pt-4 border-t border-gray-200">
                  <div className="space-y-1.5 text-xs text-gray-500 max-w-sm">
                    <div className="flex items-center gap-1.5 font-bold text-gray-700">
                      <ShieldCheck size={14} className="text-emerald-600" />
                      <span>FixMate Tamper-Proof Digital Warranty</span>
                    </div>
                    <p className="text-[11px] text-gray-500 leading-relaxed">
                      This invoice serves as your {selectedInvoice.warrantyCoverageDays}-day repair warranty certificate.
                      Next recommended maintenance is scheduled on <strong className="text-gray-800">{selectedInvoice.nextServiceRecommendedDate}</strong>.
                    </p>
                  </div>

                  <div className="w-full sm:w-64 space-y-2 text-xs">
                    <div className="flex justify-between text-gray-500">
                      <span>Taxable Value</span>
                      <span>₹{(selectedInvoice.amountPaid / 1.18).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-500">
                      <span>CGST (9%)</span>
                      <span>₹{((selectedInvoice.amountPaid - selectedInvoice.amountPaid / 1.18) / 2).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-500">
                      <span>SGST (9%)</span>
                      <span>₹{((selectedInvoice.amountPaid - selectedInvoice.amountPaid / 1.18) / 2).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-base font-black text-gray-900 border-t border-gray-200 pt-2">
                      <span>Grand Total</span>
                      <span className="text-blue-600">₹{selectedInvoice.amountPaid.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Footer Note */}
                <div className="border-t border-dashed border-gray-200 pt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-gray-400 text-center sm:text-left">
                  <span>Thank you for choosing FixMate · Computer generated invoice, no physical signature required.</span>
                  <span>Customer Care: +91 98765 43210</span>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="bg-slate-50 border-t border-gray-100 p-4 flex items-center justify-end gap-3 print:hidden">
                <button
                  type="button"
                  onClick={() => setSelectedInvoice(null)}
                  className="rounded-xl border border-gray-200 bg-white px-5 py-2 text-xs font-bold text-gray-700 hover:bg-gray-100 transition cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handlePrintInvoice}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 px-5 py-2 text-xs font-bold text-white shadow-sm transition cursor-pointer"
                >
                  <Download size={14} />
                  <span>Save PDF / Print</span>
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  )
}
