import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  History, Tv, Plus, Download, ShieldCheck,
  Calendar, Wrench, Clock, Droplets, Wind, Flame,
  Search, ChevronRight, X
} from 'lucide-react'
import toast from 'react-hot-toast'

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
}

export default function ServiceHistoryPage() {
  const navigate = useNavigate()

  const [appliances, setAppliances] = useState<ApplianceEquipment[]>([
    {
      id: 1,
      name: 'Samsung 1.5 Ton 5-Star Split AC',
      category: 'Air Conditioner',
      brand: 'Samsung',
      modelNumber: 'AR18TY5QAWK',
      purchaseDate: '2024-04-15',
      warrantyStatus: 'Active',
      healthStatus: 'Seasonal Care Due Soon',
      healthColor: 'amber',
      lastServicedDate: '2026-05-12',
      serviceCount: 2
    },
    {
      id: 2,
      name: 'LG 8.0 Kg Front Load Washing Machine',
      category: 'Washing Machine',
      brand: 'LG',
      modelNumber: 'FHM1208ZDW',
      purchaseDate: '2023-11-20',
      warrantyStatus: 'Active',
      healthStatus: 'Healthy & Calibrated',
      healthColor: 'emerald',
      lastServicedDate: '2026-02-28',
      serviceCount: 1
    },
    {
      id: 3,
      name: 'Kent Grand Plus RO Water Purifier',
      category: 'Water Purifier',
      brand: 'Kent',
      modelNumber: 'KENT-GP-1100',
      purchaseDate: '2023-08-05',
      warrantyStatus: 'Expired',
      healthStatus: 'Filter Replacement Recommended',
      healthColor: 'rose',
      lastServicedDate: '2026-01-10',
      serviceCount: 3
    }
  ])

  const [historyItems] = useState<ServiceHistoryItem[]>([
    {
      id: 1,
      applianceId: 1,
      applianceName: 'Samsung 1.5 Ton Split AC (Master Bed)',
      serviceCategory: 'AC & HVAC Cooling',
      serviceDone: 'Foam Jet Deep Cleaning & Gas Pressure Calibration',
      serviceDate: '2026-05-12',
      amountPaid: 548.00,
      providerName: 'Rajesh Kumar',
      providerRating: 4.95,
      invoiceNumber: 'INV-2026-0548',
      notes: 'Indoor blower motor lubricated and condenser fins straightened with antibacterial spray.',
      warrantyCoverageDays: 30,
      nextServiceRecommendedDate: '2026-11-12'
    },
    {
      id: 2,
      applianceId: 2,
      applianceName: 'LG 8.0 Kg Front Load Washing Machine',
      serviceCategory: 'Home Appliance Repair',
      serviceDone: 'Descaling & Drainage Filter Cleanout',
      serviceDate: '2026-02-28',
      amountPaid: 399.00,
      providerName: 'Amit Singh',
      providerRating: 4.88,
      invoiceNumber: 'INV-2026-0399',
      notes: 'Water intake valve cleaned. Machine vibration damper calibration test passed.',
      warrantyCoverageDays: 30,
      nextServiceRecommendedDate: '2026-08-28'
    },
    {
      id: 3,
      applianceId: 3,
      applianceName: 'Kent Grand Plus RO Water Purifier',
      serviceCategory: 'RO Purifier & Geyser',
      serviceDone: 'Sediment Filter & Carbon Filter Replacement',
      serviceDate: '2026-01-10',
      amountPaid: 650.00,
      providerName: 'Rajesh Kumar',
      providerRating: 4.95,
      invoiceNumber: 'INV-2026-0650',
      notes: 'TDS calibrated to 85 ppm. UV lamp operational test passed.',
      warrantyCoverageDays: 30,
      nextServiceRecommendedDate: '2026-07-10'
    }
  ])

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

  const handleDownloadInvoice = (item: ServiceHistoryItem) => {
    toast.success(`Tax Invoice ${item.invoiceNumber} downloaded for ${item.applianceName}!`)
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
          <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">100% digital records documented</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold">Lifetime Service Investment</span>
            <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <ShieldCheck size={16} />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-blue-700">₹1,597.00</div>
          <p className="text-[11px] text-gray-400 mt-0.5">Across 3 certified maintenance jobs</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold">Upcoming Routine Due</span>
            <div className="h-8 w-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Clock size={16} />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-amber-600">Kent RO Purifier</div>
          <p className="text-[11px] text-amber-700 font-semibold mt-0.5">Recommended filter check in 5 days</p>
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
    </div>
  )
}
