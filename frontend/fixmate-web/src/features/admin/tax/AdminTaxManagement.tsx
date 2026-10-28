import { useState, useEffect } from 'react'
import {
  Calculator, Shield, Settings2, Plus, Edit2, Trash2, CheckCircle,
  XCircle, RefreshCw, Save, FileSpreadsheet,
  Filter, Layers, Info
} from 'lucide-react'
import api from '@/lib/apiClient'
import toast from 'react-hot-toast'

interface TaxRule {
  id: number
  name: string
  description: string
  calculationType: string
  rate: number
  isActive: boolean
  isGlobalDefault: boolean
  serviceId?: number | null
  serviceName?: string | null
  categoryId?: number | null
  categoryName?: string | null
  includeServicePriceInBase: boolean
  includePlatformFeeInBase: boolean
  includeExtraChargesInBase: boolean
  gstTreatment: string
  hsnSacCode?: string
  cgstRate?: number | null
  sgstRate?: number | null
  igstRate?: number | null
  effectiveFrom: string
  effectiveTo?: string | null
  createdAt: string
  updatedAt: string
}

interface GlobalTaxConfig {
  globalTaxEnabled: boolean
  globalTaxRate: number
  taxCalculationType: string
  allowCustomTaxOverrides: boolean
  taxOnPlatformFee: boolean
  taxOnExtraCharges: boolean
  supplierState: string
  supplierGstin: string
  supplierLegalName: string
}

interface TaxAuditLog {
  id: number
  taxRuleId?: number | null
  action: string
  ruleName: string
  details: string
  oldValueJson: string
  newValueJson: string
  performedByName?: string | null
  timestamp: string
}

interface TaxReportSummary {
  totalCollectedTax: number
  totalTaxableAmount: number
  totalCgstAmount: number
  totalSgstAmount: number
  totalIgstAmount: number
  totalInvoicedBookings: number
  taxByServices: Array<{
    serviceId: number
    serviceName: string
    categoryName: string
    bookingCount: number
    taxableAmount: number
    taxAmount: number
  }>
  taxByTypes: Array<{
    taxRuleName: string
    rate: number
    bookingCount: number
    taxCollected: number
  }>
  paymentStatusBreakdown: Array<{
    status: string
    count: number
    totalAmount: number
  }>
}

export default function AdminTaxManagement() {
  const [activeTab, setActiveTab] = useState<'SETTINGS' | 'RULES' | 'AUDIT' | 'REPORTS'>('SETTINGS')

  // Config State
  const [config, setConfig] = useState<GlobalTaxConfig>({
    globalTaxEnabled: true,
    globalTaxRate: 18.0,
    taxCalculationType: 'Percentage',
    allowCustomTaxOverrides: true,
    taxOnPlatformFee: false,
    taxOnExtraCharges: true,
    supplierState: 'Gujarat',
    supplierGstin: '24AAACF1234F1Z5',
    supplierLegalName: 'FixMate Home Solutions Private Limited'
  })
  const [savingConfig, setSavingConfig] = useState(false)

  // Rules State
  const [rules, setRules] = useState<TaxRule[]>([])
  const [categories, setCategories] = useState<Array<{ id: number; name: string }>>([])
  const [services, setServices] = useState<Array<{ id: number; name: string; categoryId: number }>>([])
  const [ruleModalOpen, setRuleModalOpen] = useState(false)
  const [editingRuleId, setEditingRuleId] = useState<number | null>(null)
  const [ruleFormData, setRuleFormData] = useState({
    name: '',
    description: '',
    calculationType: 'Percentage',
    rate: 18.0,
    isActive: true,
    isGlobalDefault: false,
    serviceId: 0,
    categoryId: 0,
    includeServicePriceInBase: true,
    includePlatformFeeInBase: false,
    includeExtraChargesInBase: true,
    gstTreatment: 'Standard',
    hsnSacCode: '9987',
    cgstRate: 9.0,
    sgstRate: 9.0,
    igstRate: 18.0,
    effectiveFrom: new Date().toISOString().split('T')[0]
  })
  const [savingRule, setSavingRule] = useState(false)

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<TaxAuditLog[]>([])

  // Reports State
  const [reports, setReports] = useState<TaxReportSummary | null>(null)
  const [reportStartDate, setReportStartDate] = useState('')
  const [reportEndDate, setReportEndDate] = useState('')
  const [reportServiceId, setReportServiceId] = useState<number>(0)

  // Initial Fetch
  useEffect(() => {
    fetchGlobalConfig()
    fetchTaxRules()
    fetchMetaEntities()
  }, [])

  useEffect(() => {
    if (activeTab === 'AUDIT') fetchAuditLogs()
    if (activeTab === 'REPORTS') fetchReports()
  }, [activeTab])

  const fetchGlobalConfig = async () => {
    try {
      const res = await api.get('/tax/config')
      if (res.data?.data) {
        setConfig(res.data.data)
      }
    } catch (e) {
      console.error('Failed to load global tax config', e)
    }
  }

  const fetchTaxRules = async () => {
    try {
      const res = await api.get('/tax/rules')
      if (res.data?.data) {
        setRules(res.data.data)
      }
    } catch (e) {
      console.error('Failed to load tax rules', e)
    }
  }

  const fetchMetaEntities = async () => {
    try {
      const [catsRes, svcsRes] = await Promise.allSettled([
        api.get('/services/categories'),
        api.get('/services')
      ])
      if (catsRes.status === 'fulfilled' && catsRes.value.data?.data) {
        setCategories(catsRes.value.data.data)
      }
      if (svcsRes.status === 'fulfilled' && svcsRes.value.data?.data) {
        setServices(svcsRes.value.data.data)
      }
    } catch (e) {
      console.error('Failed to load services and categories', e)
    }
  }

  const fetchAuditLogs = async () => {
    try {
      const res = await api.get('/tax/audit-logs')
      if (res.data?.data) {
        setAuditLogs(res.data.data)
      }
    } catch (e) {
      console.error('Failed to load audit logs', e)
    }
  }

  const fetchReports = async () => {
    try {
      const res = await api.get('/tax/reports/summary', {
        params: {
          startDate: reportStartDate || undefined,
          endDate: reportEndDate || undefined,
          serviceId: reportServiceId || undefined
        }
      })
      if (res.data?.data) {
        setReports(res.data.data)
      }
    } catch (e) {
      console.error('Failed to load tax reports', e)
    }
  }

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingConfig(true)
    try {
      await api.put('/tax/config', config)
      toast.success('Global tax configuration updated successfully!')
      fetchGlobalConfig()
      fetchTaxRules()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update global tax configuration')
    } finally {
      setSavingConfig(false)
    }
  }

  const handleToggleRuleStatus = async (ruleId: number) => {
    try {
      const res = await api.patch(`/tax/rules/${ruleId}/toggle-status`)
      const isNowActive = res.data?.data
      toast.success(`Tax rule is now ${isNowActive ? 'Active' : 'Inactive'}`)
      fetchTaxRules()
    } catch (err: any) {
      toast.error('Failed to toggle rule status')
    }
  }

  const handleDeleteRule = async (ruleId: number) => {
    if (!window.confirm('Are you sure you want to delete this custom tax rule? This action is logged.')) return
    try {
      await api.delete(`/tax/rules/${ruleId}`)
      toast.success('Tax rule deleted.')
      fetchTaxRules()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete tax rule')
    }
  }

  const openCreateRuleModal = () => {
    setEditingRuleId(null)
    setRuleFormData({
      name: '',
      description: '',
      calculationType: 'Percentage',
      rate: 18.0,
      isActive: true,
      isGlobalDefault: false,
      serviceId: 0,
      categoryId: 0,
      includeServicePriceInBase: true,
      includePlatformFeeInBase: false,
      includeExtraChargesInBase: true,
      gstTreatment: 'Standard',
      hsnSacCode: '9987',
      cgstRate: 9.0,
      sgstRate: 9.0,
      igstRate: 18.0,
      effectiveFrom: new Date().toISOString().split('T')[0]
    })
    setRuleModalOpen(true)
  }

  const openEditRuleModal = (rule: TaxRule) => {
    setEditingRuleId(rule.id)
    setRuleFormData({
      name: rule.name,
      description: rule.description,
      calculationType: rule.calculationType,
      rate: rule.rate,
      isActive: rule.isActive,
      isGlobalDefault: rule.isGlobalDefault,
      serviceId: rule.serviceId || 0,
      categoryId: rule.categoryId || 0,
      includeServicePriceInBase: rule.includeServicePriceInBase,
      includePlatformFeeInBase: rule.includePlatformFeeInBase,
      includeExtraChargesInBase: rule.includeExtraChargesInBase,
      gstTreatment: rule.gstTreatment,
      hsnSacCode: rule.hsnSacCode || '9987',
      cgstRate: rule.cgstRate ?? Math.round(rule.rate / 2),
      sgstRate: rule.sgstRate ?? Math.round(rule.rate / 2),
      igstRate: rule.igstRate ?? rule.rate,
      effectiveFrom: rule.effectiveFrom ? rule.effectiveFrom.split('T')[0] : new Date().toISOString().split('T')[0]
    })
    setRuleModalOpen(true)
  }

  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingRule(true)
    try {
      const payload = {
        ...ruleFormData,
        serviceId: ruleFormData.serviceId > 0 ? Number(ruleFormData.serviceId) : null,
        categoryId: ruleFormData.categoryId > 0 ? Number(ruleFormData.categoryId) : null,
        rate: Number(ruleFormData.rate),
        cgstRate: Number(ruleFormData.cgstRate),
        sgstRate: Number(ruleFormData.sgstRate),
        igstRate: Number(ruleFormData.igstRate)
      }

      if (editingRuleId) {
        await api.put(`/tax/rules/${editingRuleId}`, payload)
        toast.success('Tax rule updated!')
      } else {
        await api.post('/tax/rules', payload)
        toast.success('New tax rule created!')
      }
      setRuleModalOpen(false)
      fetchTaxRules()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save tax rule')
    } finally {
      setSavingRule(false)
    }
  }

  const exportReportCsv = () => {
    if (!reports) return
    const headers = ['Metric', 'Value']
    const rows = [
      headers,
      ['Total Collected Tax (INR)', reports.totalCollectedTax.toFixed(2)],
      ['Total Taxable Base (INR)', reports.totalTaxableAmount.toFixed(2)],
      ['Total CGST Collected (INR)', reports.totalCgstAmount.toFixed(2)],
      ['Total SGST Collected (INR)', reports.totalSgstAmount.toFixed(2)],
      ['Total IGST Collected (INR)', reports.totalIgstAmount.toFixed(2)],
      ['Total Invoiced Bookings', reports.totalInvoicedBookings.toString()],
      ['', ''],
      ['Service Name', 'Category', 'Bookings Count', 'Taxable Amount (INR)', 'Tax Collected (INR)']
    ]

    reports.taxByServices.forEach((s) => {
      rows.push([s.serviceName, s.categoryName, s.bookingCount.toString(), s.taxableAmount.toFixed(2), s.taxAmount.toFixed(2)])
    })

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `fixmate_tax_report_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Tax report CSV exported!')
  }

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-600 text-white rounded-xl shadow-sm">
              <Calculator size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">Tax Management</h1>
              <p className="text-xs text-gray-500 font-medium">
                Configurable Global & Custom Tax Engine with India GST (CGST/SGST/IGST) & Place-of-Supply Support
              </p>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-gray-100 p-1 rounded-xl text-xs font-bold text-gray-600">
          <button
            onClick={() => setActiveTab('SETTINGS')}
            className={`px-3.5 py-2 rounded-lg transition ${
              activeTab === 'SETTINGS' ? 'bg-white text-blue-700 shadow-sm' : 'hover:text-gray-900'
            }`}
          >
            Global Configuration
          </button>
          <button
            onClick={() => setActiveTab('RULES')}
            className={`px-3.5 py-2 rounded-lg transition ${
              activeTab === 'RULES' ? 'bg-white text-blue-700 shadow-sm' : 'hover:text-gray-900'
            }`}
          >
            Custom Tax Rules ({rules.length})
          </button>
          <button
            onClick={() => setActiveTab('REPORTS')}
            className={`px-3.5 py-2 rounded-lg transition ${
              activeTab === 'REPORTS' ? 'bg-white text-blue-700 shadow-sm' : 'hover:text-gray-900'
            }`}
          >
            Tax Reports & Ledger
          </button>
          <button
            onClick={() => setActiveTab('AUDIT')}
            className={`px-3.5 py-2 rounded-lg transition ${
              activeTab === 'AUDIT' ? 'bg-white text-blue-700 shadow-sm' : 'hover:text-gray-900'
            }`}
          >
            Audit History
          </button>
        </div>
      </div>

      {/* ── TAB 1: GLOBAL CONFIGURATION ── */}
      {activeTab === 'SETTINGS' && (
        <form onSubmit={handleSaveConfig} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Rules Settings */}
            <div className="lg:col-span-2 space-y-6">
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-5">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div className="flex items-center gap-2 text-sm font-bold text-gray-900">
                    <Settings2 size={18} className="text-blue-600" />
                    <span>Global Tax Engine Rules</span>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                    config.globalTaxEnabled ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    {config.globalTaxEnabled ? '● Global Tax Active' : '○ Global Tax Disabled'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Enable Global Tax Toggle */}
                  <div className="flex items-start justify-between p-4 rounded-xl border border-gray-200 bg-gray-50/50">
                    <div>
                      <label className="text-xs font-bold text-gray-900 block">Enable Global Tax</label>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        Applies standard tax rule across all bookings unless overridden by custom rule.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={config.globalTaxEnabled}
                      onChange={(e) => setConfig({ ...config, globalTaxEnabled: e.target.checked })}
                      className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer mt-0.5"
                    />
                  </div>

                  {/* Allow Custom Overrides */}
                  <div className="flex items-start justify-between p-4 rounded-xl border border-gray-200 bg-gray-50/50">
                    <div>
                      <label className="text-xs font-bold text-gray-900 block">Allow Custom Tax Overrides</label>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        Custom service or category rules take priority over global tax.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={config.allowCustomTaxOverrides}
                      onChange={(e) => setConfig({ ...config, allowCustomTaxOverrides: e.target.checked })}
                      className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer mt-0.5"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Global Tax Rate */}
                  <div>
                    <label className="text-xs font-bold text-gray-700">Default Global Tax Rate (%)</label>
                    <div className="relative mt-1.5">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={config.globalTaxRate}
                        onChange={(e) => setConfig({ ...config, globalTaxRate: parseFloat(e.target.value) || 0 })}
                        className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-xs font-semibold text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                      <span className="absolute right-3.5 top-2.5 text-xs font-bold text-gray-400">%</span>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">Default standard Indian GST for repair services is 18.00%</p>
                  </div>

                  {/* Tax Calculation Method */}
                  <div>
                    <label className="text-xs font-bold text-gray-700">Tax Calculation Method</label>
                    <select
                      value={config.taxCalculationType}
                      onChange={(e) => setConfig({ ...config, taxCalculationType: e.target.value })}
                      className="mt-1.5 w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-xs font-semibold text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
                    >
                      <option value="Percentage">Percentage (%) of Taxable Amount</option>
                      <option value="Fixed">Fixed Amount per Booking (₹)</option>
                    </select>
                    <p className="text-[10px] text-gray-400 mt-1">Standard method is percentage-based</p>
                  </div>
                </div>

                {/* Configurable Taxable Base Section */}
                <div className="pt-3 border-t border-gray-100 space-y-3">
                  <div className="flex items-center gap-2">
                    <Layers size={16} className="text-blue-600" />
                    <span className="text-xs font-bold text-gray-900">Configurable Taxable Base Components</span>
                  </div>
                  <p className="text-[11px] text-gray-500">
                    Define which fees enter the taxable base to prevent double taxation or compliance issues:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 bg-white cursor-pointer hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={config.taxOnPlatformFee}
                        onChange={(e) => setConfig({ ...config, taxOnPlatformFee: e.target.checked })}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-xs font-bold text-gray-800 block">Include FixMate Service Charge</span>
                        <span className="text-[10px] text-gray-400">Keep disabled if platform fee has separate commercial tax invoice</span>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 bg-white cursor-pointer hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={config.taxOnExtraCharges}
                        onChange={(e) => setConfig({ ...config, taxOnExtraCharges: e.target.checked })}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-xs font-bold text-gray-800 block">Include Approved Extra Charges</span>
                        <span className="text-[10px] text-gray-400">Include verified spare parts and approved add-on labor</span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* GST Business & Place of Supply Configuration */}
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2 text-sm font-bold text-gray-900 border-b border-gray-100 pb-3">
                  <Shield size={18} className="text-emerald-600" />
                  <span>India GST Compliance & Supplier Identity</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-700">Supplier Registered State</label>
                    <input
                      type="text"
                      value={config.supplierState}
                      onChange={(e) => setConfig({ ...config, supplierState: e.target.value })}
                      placeholder="e.g. Gujarat"
                      className="mt-1.5 w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-xs font-semibold text-gray-900 focus:border-blue-500"
                    />
                    <p className="text-[10px] text-gray-400 mt-1">Used to resolve Intra-State vs Inter-State supply</p>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-700">Supplier GSTIN</label>
                    <input
                      type="text"
                      value={config.supplierGstin}
                      onChange={(e) => setConfig({ ...config, supplierGstin: e.target.value })}
                      placeholder="e.g. 24AAACF1234F1Z5"
                      className="mt-1.5 w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-xs font-mono font-bold text-gray-900 focus:border-blue-500 uppercase"
                    />
                    <p className="text-[10px] text-gray-400 mt-1">Printed on formal Tax Invoices</p>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-700">Registered Entity Legal Name</label>
                    <input
                      type="text"
                      value={config.supplierLegalName}
                      onChange={(e) => setConfig({ ...config, supplierLegalName: e.target.value })}
                      placeholder="FixMate Home Solutions Private Limited"
                      className="mt-1.5 w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-xs font-semibold text-gray-900 focus:border-blue-500"
                    />
                    <p className="text-[10px] text-gray-400 mt-1">Legal entity issuer name</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Side Explainer & Save */}
            <div className="space-y-6">
              <div className="rounded-2xl border border-blue-100 bg-gradient-to-b from-blue-50 to-white p-5 shadow-sm space-y-4">
                <div className="flex items-center gap-2 text-xs font-extrabold text-blue-900 uppercase tracking-wider">
                  <Info size={16} className="text-blue-600" />
                  Tax Engine Logic
                </div>
                <div className="space-y-2.5 text-xs text-gray-600 leading-relaxed">
                  <p>
                    <strong className="text-gray-900 font-semibold">1. Global Mode:</strong> Applies the enabled global rate (e.g. {config.globalTaxRate}%) to services that have no custom override.
                  </p>
                  <p>
                    <strong className="text-gray-900 font-semibold">2. Customizable Override Mode:</strong> Specific service or category tax rules completely override the global rate. Both are never applied twice.
                  </p>
                  <p>
                    <strong className="text-gray-900 font-semibold">3. Place-of-Supply Engine:</strong>
                    Intra-state bookings within <span className="font-semibold text-emerald-800">{config.supplierState}</span> automatically resolve into equal <strong className="text-gray-800">CGST + SGST</strong>. Out-of-state customers receive <strong className="text-gray-800">IGST</strong>.
                  </p>
                  <p>
                    <strong className="text-gray-900 font-semibold">4. Immutable Snapshots:</strong>
                    Saved booking and paid invoice numbers preserve the exact tax rate that applied at checkout time.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-3">
                <button
                  type="submit"
                  disabled={savingConfig}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-xs font-bold text-white shadow-md hover:bg-blue-700 disabled:opacity-50 transition active:scale-98"
                >
                  <Save size={16} />
                  {savingConfig ? 'Saving Settings...' : 'Save Tax Configuration'}
                </button>
                <p className="text-[10px] text-gray-400 text-center">
                  Changes take effect immediately and create an audit log entry.
                </p>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* ── TAB 2: CUSTOM TAX RULES ── */}
      {activeTab === 'RULES' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Custom Tax Rules & Overrides</h2>
              <p className="text-xs text-gray-500">
                Override global tax for specific service categories (e.g., lower tax on sanitization) or individual services
              </p>
            </div>
            <button
              onClick={openCreateRuleModal}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow hover:bg-blue-700 transition"
            >
              <Plus size={16} /> Add Custom Tax Rule
            </button>
          </div>

          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-600">
                <thead className="border-b border-gray-200 bg-gray-50/80 font-bold text-gray-900">
                  <tr>
                    <th className="py-3.5 px-4">Rule Name</th>
                    <th className="py-3.5 px-4">Scope / Applies To</th>
                    <th className="py-3.5 px-4">Rate</th>
                    <th className="py-3.5 px-4">GST Treatment</th>
                    <th className="py-3.5 px-4">SAC Code</th>
                    <th className="py-3.5 px-4">Effective From</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rules.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-gray-400 text-xs">
                        No custom tax rules found. Global tax rules will apply.
                      </td>
                    </tr>
                  ) : (
                    rules.map((rule) => (
                      <tr key={rule.id} className="hover:bg-gray-50/50 transition">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-gray-900 flex items-center gap-2">
                            <span>{rule.name}</span>
                            {rule.isGlobalDefault && (
                              <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-extrabold border border-blue-200">
                                Global Default
                              </span>
                            )}
                          </div>
                          {rule.description && (
                            <p className="text-[11px] text-gray-400 mt-0.5 max-w-xs truncate">{rule.description}</p>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          {rule.serviceName ? (
                            <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-bold text-[11px] border border-purple-200">
                              Service: {rule.serviceName}
                            </span>
                          ) : rule.categoryName ? (
                            <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 font-bold text-[11px] border border-amber-200">
                              Category: {rule.categoryName}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 font-bold text-[11px]">
                              All Eligible Services
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-gray-900">
                          {rule.calculationType === 'Fixed' ? `₹${rule.rate.toFixed(2)}` : `${rule.rate.toFixed(2)}%`}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-gray-700">{rule.gstTreatment}</span>
                          {rule.gstTreatment === 'Standard' && (
                            <p className="text-[10px] text-gray-400">
                              CGST: {rule.cgstRate ?? Math.round(rule.rate / 2)}% | SGST: {rule.sgstRate ?? Math.round(rule.rate / 2)}%
                            </p>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-gray-600">
                          {rule.hsnSacCode || '9987'}
                        </td>
                        <td className="py-3.5 px-4 text-gray-500">
                          {rule.effectiveFrom ? rule.effectiveFrom.split('T')[0] : 'Always'}
                        </td>
                        <td className="py-3.5 px-4">
                          <button
                            onClick={() => handleToggleRuleStatus(rule.id)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition ${
                              rule.isActive
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                : 'bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-200'
                            }`}
                          >
                            {rule.isActive ? <CheckCircle size={12} /> : <XCircle size={12} />}
                            {rule.isActive ? 'Active' : 'Inactive'}
                          </button>
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-2">
                          <button
                            onClick={() => openEditRuleModal(rule)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition"
                            title="Edit Rule"
                          >
                            <Edit2 size={15} />
                          </button>
                          {!rule.isGlobalDefault && (
                            <button
                              onClick={() => handleDeleteRule(rule.id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition"
                              title="Delete Rule"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: TAX REPORTS & LEDGER ── */}
      {activeTab === 'REPORTS' && (
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="flex items-center gap-1.5 font-bold text-gray-700">
                <Filter size={14} className="text-blue-600" />
                <span>Filters:</span>
              </div>
              <input
                type="date"
                value={reportStartDate}
                onChange={(e) => setReportStartDate(e.target.value)}
                className="rounded-xl border border-gray-300 px-3 py-1.5 text-xs text-gray-700 focus:border-blue-500"
              />
              <span className="text-gray-400">to</span>
              <input
                type="date"
                value={reportEndDate}
                onChange={(e) => setReportEndDate(e.target.value)}
                className="rounded-xl border border-gray-300 px-3 py-1.5 text-xs text-gray-700 focus:border-blue-500"
              />
              <select
                value={reportServiceId}
                onChange={(e) => setReportServiceId(Number(e.target.value))}
                className="rounded-xl border border-gray-300 px-3 py-1.5 text-xs text-gray-700 focus:border-blue-500 bg-white"
              >
                <option value={0}>All Services</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              <button
                onClick={fetchReports}
                className="rounded-xl bg-gray-100 hover:bg-gray-200 px-3.5 py-1.5 text-xs font-bold text-gray-800 transition"
              >
                Apply
              </button>
            </div>

            <button
              onClick={exportReportCsv}
              disabled={!reports}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 font-bold text-xs shadow transition disabled:opacity-50"
            >
              <FileSpreadsheet size={15} /> Export CSV Ledger
            </button>
          </div>

          {/* Metric Cards */}
          {reports && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-5 shadow-sm space-y-1">
                <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">Total Tax Collected</p>
                <p className="text-2xl font-black text-blue-950">₹{reports.totalCollectedTax.toFixed(2)}</p>
                <p className="text-[11px] text-gray-500">{reports.totalInvoicedBookings} Invoiced Bookings</p>
              </div>

              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-5 shadow-sm space-y-1">
                <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Total Taxable Base</p>
                <p className="text-2xl font-black text-emerald-950">₹{reports.totalTaxableAmount.toFixed(2)}</p>
                <p className="text-[11px] text-gray-500">Total Net Service Revenue</p>
              </div>

              <div className="rounded-2xl border border-purple-100 bg-purple-50/50 p-5 shadow-sm space-y-1">
                <p className="text-xs font-bold text-purple-700 uppercase tracking-wider">Intra-State GST</p>
                <p className="text-xl font-black text-purple-950">
                  ₹{(reports.totalCgstAmount + reports.totalSgstAmount).toFixed(2)}
                </p>
                <p className="text-[10px] text-gray-500">
                  CGST: ₹{reports.totalCgstAmount.toFixed(2)} | SGST: ₹{reports.totalSgstAmount.toFixed(2)}
                </p>
              </div>

              <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-5 shadow-sm space-y-1">
                <p className="text-xs font-bold text-amber-700 uppercase tracking-wider">Inter-State IGST</p>
                <p className="text-2xl font-black text-amber-950">₹{reports.totalIgstAmount.toFixed(2)}</p>
                <p className="text-[11px] text-gray-500">Out-of-state supplies</p>
              </div>
            </div>
          )}

          {/* Breakdown by Service Table */}
          {reports && reports.taxByServices.length > 0 && (
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-gray-900">Tax Collections by Service</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-gray-200 bg-gray-50 font-bold text-gray-700">
                    <tr>
                      <th className="py-2.5 px-3">Service Name</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3 text-right">Bookings</th>
                      <th className="py-2.5 px-3 text-right">Taxable Amount (₹)</th>
                      <th className="py-2.5 px-3 text-right">Tax Collected (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {reports.taxByServices.map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/50">
                        <td className="py-3 px-3 font-bold text-gray-900">{item.serviceName}</td>
                        <td className="py-3 px-3 text-gray-500">{item.categoryName}</td>
                        <td className="py-3 px-3 text-right font-medium">{item.bookingCount}</td>
                        <td className="py-3 px-3 text-right font-semibold text-gray-800">₹{item.taxableAmount.toFixed(2)}</td>
                        <td className="py-3 px-3 text-right font-bold text-blue-700">₹{item.taxAmount.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 4: AUDIT HISTORY ── */}
      {activeTab === 'AUDIT' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Tax Settings Audit Trail</h2>
              <p className="text-xs text-gray-500">
                Immutable chronological log of tax rule creations, updates, rate adjustments, and activations
              </p>
            </div>
            <button
              onClick={fetchAuditLogs}
              className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
            >
              <RefreshCw size={14} /> Refresh Logs
            </button>
          </div>

          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-600">
                <thead className="border-b border-gray-200 bg-gray-50/80 font-bold text-gray-900">
                  <tr>
                    <th className="py-3.5 px-4">Timestamp</th>
                    <th className="py-3.5 px-4">Action</th>
                    <th className="py-3.5 px-4">Target Rule</th>
                    <th className="py-3.5 px-4">Details</th>
                    <th className="py-3.5 px-4">Performed By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-gray-400 text-xs">
                        No audit logs recorded yet.
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50/50">
                        <td className="py-3.5 px-4 font-mono text-[11px] text-gray-500 whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded font-extrabold text-[10px] ${
                            log.action === 'Create' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            log.action === 'Update' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                            log.action === 'Delete' ? 'bg-red-50 text-red-700 border border-red-200' :
                            'bg-purple-50 text-purple-700 border border-purple-200'
                          }`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-gray-900">{log.ruleName}</td>
                        <td className="py-3.5 px-4 text-gray-600">{log.details}</td>
                        <td className="py-3.5 px-4 font-medium text-gray-700">{log.performedByName || 'Admin'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: CREATE / EDIT CUSTOM TAX RULE ── */}
      {ruleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900">
                {editingRuleId ? 'Edit Tax Rule' : 'Create Custom Tax Rule'}
              </h3>
              <button
                onClick={() => setRuleModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveRule} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-gray-700">Rule Name *</label>
                <input
                  type="text"
                  required
                  value={ruleFormData.name}
                  onChange={(e) => setRuleFormData({ ...ruleFormData, name: e.target.value })}
                  placeholder="e.g. Deep Cleaning Concessional GST 12%"
                  className="w-full rounded-xl border border-gray-300 px-3.5 py-2 text-xs font-semibold focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700">Description</label>
                <input
                  type="text"
                  value={ruleFormData.description}
                  onChange={(e) => setRuleFormData({ ...ruleFormData, description: e.target.value })}
                  placeholder="Applicable reason or statutory reference"
                  className="w-full rounded-xl border border-gray-300 px-3.5 py-2 text-xs focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Assign to Specific Category</label>
                  <select
                    value={ruleFormData.categoryId}
                    onChange={(e) => setRuleFormData({ ...ruleFormData, categoryId: Number(e.target.value) })}
                    className="w-full rounded-xl border border-gray-300 px-3.5 py-2 text-xs bg-white"
                  >
                    <option value={0}>-- None (Service Level or All) --</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Assign to Specific Service</label>
                  <select
                    value={ruleFormData.serviceId}
                    onChange={(e) => setRuleFormData({ ...ruleFormData, serviceId: Number(e.target.value) })}
                    className="w-full rounded-xl border border-gray-300 px-3.5 py-2 text-xs bg-white"
                  >
                    <option value={0}>-- None (Category Level or All) --</option>
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Tax Rate (%) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    required
                    value={ruleFormData.rate}
                    onChange={(e) => {
                      const r = parseFloat(e.target.value) || 0
                      setRuleFormData({
                        ...ruleFormData,
                        rate: r,
                        cgstRate: parseFloat((r / 2).toFixed(2)),
                        sgstRate: parseFloat((r / 2).toFixed(2)),
                        igstRate: r
                      })
                    }}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Calculation Type</label>
                  <select
                    value={ruleFormData.calculationType}
                    onChange={(e) => setRuleFormData({ ...ruleFormData, calculationType: e.target.value })}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs bg-white"
                  >
                    <option value="Percentage">Percentage (%)</option>
                    <option value="Fixed">Fixed (₹)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-700">GST SAC Code</label>
                  <input
                    type="text"
                    value={ruleFormData.hsnSacCode}
                    onChange={(e) => setRuleFormData({ ...ruleFormData, hsnSacCode: e.target.value })}
                    placeholder="9987"
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 bg-gray-50 p-3 rounded-xl border border-gray-200">
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase">CGST (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={ruleFormData.cgstRate}
                    onChange={(e) => setRuleFormData({ ...ruleFormData, cgstRate: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-lg border border-gray-300 px-2 py-1 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase">SGST (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={ruleFormData.sgstRate}
                    onChange={(e) => setRuleFormData({ ...ruleFormData, sgstRate: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-lg border border-gray-300 px-2 py-1 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase">IGST (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={ruleFormData.igstRate}
                    onChange={(e) => setRuleFormData({ ...ruleFormData, igstRate: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-lg border border-gray-300 px-2 py-1 text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={ruleFormData.isActive}
                    onChange={(e) => setRuleFormData({ ...ruleFormData, isActive: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="font-bold text-gray-800">Activate rule immediately</span>
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setRuleModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-gray-200 font-bold text-gray-600 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingRule}
                    className="px-4 py-2 rounded-xl bg-blue-600 font-bold text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {savingRule ? 'Saving...' : 'Save Rule'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
