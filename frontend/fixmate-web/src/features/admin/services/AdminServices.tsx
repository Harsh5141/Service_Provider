import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Zap, Droplets, Wind, Sparkles, Hammer, Wrench, ChevronDown, ChevronUp } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '@/lib/apiClient'

interface ServiceItem {
  id: number
  categoryId: number
  categoryName?: string
  name: string
  description: string
  basePrice: number
  estimatedDurationMinutes: number
  isActive: boolean
}

interface CategoryItem {
  id: number
  name: string
  slug: string
  description: string
  iconName?: string
  displayOrder: number
  isActive: boolean
  services: ServiceItem[]
}

const DEFAULT_CATEGORIES: CategoryItem[] = [
  {
    id: 1,
    name: 'Electrical & Power',
    slug: 'electrical-power',
    description: 'Switchboards, wiring, fans, fuses and electrical troubleshooting',
    iconName: 'Zap',
    displayOrder: 1,
    isActive: true,
    services: [
      { id: 1, categoryId: 1, name: 'Switchboard Installation & Repair', description: 'Modular switchboards repair', basePrice: 199, estimatedDurationMinutes: 45, isActive: true },
      { id: 2, categoryId: 1, name: 'Ceiling Fan Installation / Replacement', description: 'Bracket mounting & wiring', basePrice: 249, estimatedDurationMinutes: 60, isActive: true },
      { id: 3, categoryId: 1, name: 'MCB / Fuse Box Troubleshooting', description: 'Tripping diagnosis & fuse fix', basePrice: 399, estimatedDurationMinutes: 60, isActive: true }
    ]
  },
  {
    id: 2,
    name: 'Plumbing & Sanitary',
    slug: 'plumbing-sanitary',
    description: 'Pipes, taps, drains, flush tanks and sanitary fittings',
    iconName: 'Droplets',
    displayOrder: 2,
    isActive: true,
    services: [
      { id: 4, categoryId: 2, name: 'Tap & Mixer Repair / Replacement', description: 'Fix dripping faucets & washers', basePrice: 149, estimatedDurationMinutes: 30, isActive: true },
      { id: 5, categoryId: 2, name: 'Clogged Drain & Sink Cleaning', description: 'Mechanical drain unclogging', basePrice: 349, estimatedDurationMinutes: 60, isActive: true },
      { id: 6, categoryId: 2, name: 'Toilet Flush Tank & Cistern Repair', description: 'Syphon kit & leak stoppage', basePrice: 299, estimatedDurationMinutes: 45, isActive: true }
    ]
  },
  {
    id: 3,
    name: 'AC & Appliance Repair',
    slug: 'ac-appliance-repair',
    description: 'Split / Window ACs, washing machines, refrigerators',
    iconName: 'Wind',
    displayOrder: 3,
    isActive: true,
    services: [
      { id: 7, categoryId: 3, name: 'AC Foam Jet Deep Cleaning (Split / Window)', description: 'High-pressure foam wash', basePrice: 499, estimatedDurationMinutes: 60, isActive: true },
      { id: 8, categoryId: 3, name: 'Washing Machine Diagnostic & Repair', description: 'Spin fault & PCB check', basePrice: 399, estimatedDurationMinutes: 60, isActive: true },
      { id: 9, categoryId: 3, name: 'Refrigerator Cooling Troubleshooting', description: 'Relay & gas leak test', basePrice: 449, estimatedDurationMinutes: 60, isActive: true }
    ]
  },
  {
    id: 4,
    name: 'Home Cleaning & Pest',
    slug: 'cleaning-pest',
    description: 'Bathroom scrubbing, sofa shampooing, pest control',
    iconName: 'Sparkles',
    displayOrder: 4,
    isActive: true,
    services: [
      { id: 10, categoryId: 4, name: 'Intense Bathroom Deep Scrub & Descaling', description: 'Tile descaling & sanitization', basePrice: 599, estimatedDurationMinutes: 90, isActive: true },
      { id: 11, categoryId: 4, name: 'Sofa Shampooing & Extraction (3-Seater)', description: 'Fabric vacuum & scrub', basePrice: 699, estimatedDurationMinutes: 75, isActive: true }
    ]
  }
]

export default function AdminServices() {
  const [categories, setCategories] = useState<CategoryItem[]>(DEFAULT_CATEGORIES)
  const [expandedCatId, setExpandedCatId] = useState<number | null>(1)

  // Category Modal States
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null)
  const [catName, setCatName] = useState('')
  const [catDescription, setCatDescription] = useState('')
  const [catIcon, setCatIcon] = useState('Zap')
  const [catIsActive, setCatIsActive] = useState(true)

  // Service Modal States
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false)
  const [editingService, setEditingService] = useState<ServiceItem | null>(null)
  const [svcCategoryId, setSvcCategoryId] = useState<number>(1)
  const [svcName, setSvcName] = useState('')
  const [svcDescription, setSvcDescription] = useState('')
  const [svcBasePrice, setSvcBasePrice] = useState<number>(249)
  const [svcDuration, setSvcDuration] = useState<number>(45)
  const [svcIsActive, setSvcIsActive] = useState(true)

  // Delete Modal State
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'category' | 'service'; id: number; name: string } | null>(null)

  const loadCatalog = async () => {
    try {
      const res = await api.get('/services/categories')
      if (res.data?.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
        setCategories(res.data.data)
      }
    } catch (err) {
      console.warn('Using fallback categories catalog', err)
    }
  }

  useEffect(() => {
    loadCatalog()
  }, [])

  const getIconComponent = (iconName?: string) => {
    switch (iconName?.toLowerCase()) {
      case 'zap': return <Zap className="text-amber-500" size={18} />
      case 'droplets': return <Droplets className="text-cyan-500" size={18} />
      case 'wind': return <Wind className="text-blue-500" size={18} />
      case 'sparkles': return <Sparkles className="text-purple-500" size={18} />
      case 'hammer': return <Hammer className="text-orange-500" size={18} />
      default: return <Wrench className="text-emerald-500" size={18} />
    }
  }

  // ── CATEGORY HANDLERS ──────────────────────────────────────────────────────
  const openAddCategoryModal = () => {
    setEditingCategory(null)
    setCatName('')
    setCatDescription('')
    setCatIcon('Zap')
    setCatIsActive(true)
    setIsCategoryModalOpen(true)
  }

  const openEditCategoryModal = (cat: CategoryItem) => {
    setEditingCategory(cat)
    setCatName(cat.name)
    setCatDescription(cat.description)
    setCatIcon(cat.iconName || 'Zap')
    setCatIsActive(cat.isActive)
    setIsCategoryModalOpen(true)
  }

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!catName.trim()) {
      toast.error('Category name is required')
      return
    }

    try {
      if (editingCategory) {
        // Update
        await api.put(`/services/categories/${editingCategory.id}`, {
          name: catName.trim(),
          description: catDescription.trim(),
          iconName: catIcon,
          isActive: catIsActive
        })

        setCategories((prev) =>
          prev.map((c) =>
            c.id === editingCategory.id
              ? { ...c, name: catName.trim(), description: catDescription.trim(), iconName: catIcon, isActive: catIsActive }
              : c
          )
        )
        toast.success(`Category "${catName}" updated!`)
      } else {
        // Create
        const res = await api.post('/services/categories', {
          name: catName.trim(),
          description: catDescription.trim(),
          iconName: catIcon,
          displayOrder: categories.length + 1
        })

        const created = res.data?.data
        if (created) {
          setCategories((prev) => [...prev, { ...created, services: [] }])
        } else {
          const mockCat: CategoryItem = {
            id: Date.now(),
            name: catName.trim(),
            slug: catName.toLowerCase().replace(/\s+/g, '-'),
            description: catDescription.trim(),
            iconName: catIcon,
            displayOrder: categories.length + 1,
            isActive: true,
            services: []
          }
          setCategories((prev) => [...prev, mockCat])
        }
        toast.success(`Category "${catName}" added!`)
      }

      setIsCategoryModalOpen(false)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save category')
    }
  }

  // ── SERVICE HANDLERS ───────────────────────────────────────────────────────
  const openAddServiceModal = (catId?: number) => {
    setEditingService(null)
    setSvcCategoryId(catId || (categories[0]?.id ?? 1))
    setSvcName('')
    setSvcDescription('')
    setSvcBasePrice(249)
    setSvcDuration(45)
    setSvcIsActive(true)
    setIsServiceModalOpen(true)
  }

  const openEditServiceModal = (svc: ServiceItem) => {
    setEditingService(svc)
    setSvcCategoryId(svc.categoryId)
    setSvcName(svc.name)
    setSvcDescription(svc.description)
    setSvcBasePrice(svc.basePrice)
    setSvcDuration(svc.estimatedDurationMinutes)
    setSvcIsActive(svc.isActive)
    setIsServiceModalOpen(true)
  }

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!svcName.trim()) {
      toast.error('Service name is required')
      return
    }

    try {
      if (editingService) {
        // Update
        await api.put(`/services/${editingService.id}`, {
          categoryId: svcCategoryId,
          name: svcName.trim(),
          description: svcDescription.trim(),
          basePrice: Number(svcBasePrice),
          estimatedDurationMinutes: Number(svcDuration),
          isActive: svcIsActive
        })

        setCategories((prev) =>
          prev.map((cat) => ({
            ...cat,
            services: cat.services.map((s) =>
              s.id === editingService.id
                ? {
                    ...s,
                    categoryId: svcCategoryId,
                    name: svcName.trim(),
                    description: svcDescription.trim(),
                    basePrice: Number(svcBasePrice),
                    estimatedDurationMinutes: Number(svcDuration),
                    isActive: svcIsActive
                  }
                : s
            )
          }))
        )
        toast.success(`Service "${svcName}" updated!`)
      } else {
        // Create
        const res = await api.post('/services', {
          categoryId: svcCategoryId,
          name: svcName.trim(),
          description: svcDescription.trim(),
          basePrice: Number(svcBasePrice),
          estimatedDurationMinutes: Number(svcDuration)
        })

        const created = res.data?.data
        const newSvc: ServiceItem = created || {
          id: Date.now(),
          categoryId: svcCategoryId,
          name: svcName.trim(),
          description: svcDescription.trim(),
          basePrice: Number(svcBasePrice),
          estimatedDurationMinutes: Number(svcDuration),
          isActive: true
        }

        setCategories((prev) =>
          prev.map((cat) =>
            cat.id === svcCategoryId
              ? { ...cat, services: [...cat.services, newSvc] }
              : cat
          )
        )
        toast.success(`Service "${svcName}" added!`)
      }

      setIsServiceModalOpen(false)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save service')
    }
  }

  // ── DELETE HANDLER ─────────────────────────────────────────────────────────
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return

    try {
      if (deleteTarget.type === 'category') {
        await api.delete(`/services/categories/${deleteTarget.id}`)
        setCategories((prev) => prev.filter((c) => c.id !== deleteTarget.id))
        toast.success(`Category "${deleteTarget.name}" deleted.`)
      } else {
        await api.delete(`/services/${deleteTarget.id}`)
        setCategories((prev) =>
          prev.map((cat) => ({
            ...cat,
            services: cat.services.filter((s) => s.id !== deleteTarget.id)
          }))
        )
        toast.success(`Service "${deleteTarget.name}" deleted.`)
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Delete operation failed')
    } finally {
      setDeleteTarget(null)
    }
  }

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Service Catalog & Pricing</h1>
          <p className="text-xs sm:text-sm text-gray-500">Configure marketplace categories, base price limits, duration, and active services</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => openAddServiceModal()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-300 bg-white px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 cursor-pointer shadow-xs"
          >
            <Plus size={15} /> Add Service
          </button>
          <button
            onClick={openAddCategoryModal}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 cursor-pointer shadow-md transition"
          >
            <Plus size={15} /> Add New Category
          </button>
        </div>
      </div>

      {/* Category & Services Table */}
      <div className="space-y-4">
        {categories.map((cat) => {
          const isExpanded = expandedCatId === cat.id
          const activeServicesCount = cat.services?.filter((s) => s.isActive).length ?? 0

          return (
            <div key={cat.id} className="rounded-2xl border border-gray-200 bg-white shadow-2xs overflow-hidden transition">
              {/* Category Header Bar */}
              <div className="flex items-center justify-between p-5 bg-gray-50/60 border-b border-gray-100">
                <div className="flex items-center gap-3 cursor-pointer select-none" onClick={() => setExpandedCatId(isExpanded ? null : cat.id)}>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-gray-200 shadow-2xs">
                    {getIconComponent(cat.iconName)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-gray-900 text-sm sm:text-base">{cat.name}</h3>
                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${cat.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-500'}`}>
                        {cat.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">{cat.description} · <span className="font-semibold text-blue-700">{activeServicesCount} Active Services</span></p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openAddServiceModal(cat.id)}
                    className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 hover:bg-blue-100 cursor-pointer"
                  >
                    <Plus size={13} /> Add Service
                  </button>
                  <button
                    onClick={() => openEditCategoryModal(cat)}
                    className="rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer"
                  >
                    <Edit2 size={13} /> Edit
                  </button>
                  <button
                    onClick={() => setDeleteTarget({ type: 'category', id: cat.id, name: cat.name })}
                    className="rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-100 cursor-pointer"
                  >
                    <Trash2 size={13} />
                  </button>
                  <button
                    onClick={() => setExpandedCatId(isExpanded ? null : cat.id)}
                    className="p-1 text-gray-400 hover:text-gray-700"
                  >
                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                </div>
              </div>

              {/* Nested Services List */}
              {isExpanded && (
                <div className="p-4 bg-white space-y-2">
                  {cat.services && cat.services.length > 0 ? (
                    <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl">
                      {cat.services.map((svc) => (
                        <div key={svc.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 hover:bg-blue-50/30 transition gap-2">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-gray-900 text-xs sm:text-sm">{svc.name}</h4>
                              <span className={`px-2 py-0.2 rounded-md text-[10px] font-bold ${svc.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                                {svc.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 line-clamp-1">{svc.description}</p>
                          </div>

                          <div className="flex items-center gap-4 text-xs shrink-0">
                            <div className="text-right">
                              <span className="text-gray-400 text-[10px]">Base Price</span>
                              <p className="font-extrabold text-emerald-600 text-sm">₹{svc.basePrice}</p>
                            </div>
                            <div className="text-right">
                              <span className="text-gray-400 text-[10px]">Duration</span>
                              <p className="font-semibold text-gray-800">~{svc.estimatedDurationMinutes} mins</p>
                            </div>
                            <div className="flex items-center gap-1.5 pl-2">
                              <button
                                onClick={() => openEditServiceModal(svc)}
                                className="rounded-md border border-gray-200 p-1.5 text-gray-600 hover:bg-gray-100 cursor-pointer"
                                title="Edit Service"
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                onClick={() => setDeleteTarget({ type: 'service', id: svc.id, name: svc.name })}
                                className="rounded-md border border-red-200 bg-red-50 p-1.5 text-red-600 hover:bg-red-100 cursor-pointer"
                                title="Delete Service"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-xs text-gray-400 border border-dashed border-gray-200 rounded-xl">
                      No active services created in this category. Click "+ Add Service" to add items.
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* ── MODAL 1: ADD / EDIT CATEGORY ────────────────────────────────── */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-gray-900">
              {editingCategory ? 'Edit Service Category' : 'Create New Service Category'}
            </h3>

            <form onSubmit={handleSaveCategory} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Category Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Electrical & Power"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 p-2.5 text-sm focus:border-blue-600 outline-none"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Brief description of service offerings in this category"
                  value={catDescription}
                  onChange={(e) => setCatDescription(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 p-2.5 text-sm focus:border-blue-600 outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Icon Style</label>
                <select
                  value={catIcon}
                  onChange={(e) => setCatIcon(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 p-2.5 text-sm focus:border-blue-600 outline-none cursor-pointer"
                >
                  <option value="Zap">⚡ Zap (Electrical)</option>
                  <option value="Droplets">💧 Droplets (Plumbing)</option>
                  <option value="Wind">🌬️ Wind (AC & Appliances)</option>
                  <option value="Sparkles">✨ Sparkles (Cleaning)</option>
                  <option value="Hammer">🔨 Hammer (Carpentry)</option>
                  <option value="Wrench">🔧 Wrench (General Servicing)</option>
                </select>
              </div>

              {editingCategory && (
                <div className="pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={catIsActive}
                      onChange={(e) => setCatIsActive(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600"
                    />
                    <span className="text-gray-700 font-semibold">Active & Visible in Catalog</span>
                  </label>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="rounded-xl border border-gray-300 px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-blue-700"
                >
                  {editingCategory ? 'Save Changes' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 2: ADD / EDIT SERVICE ─────────────────────────────────── */}
      {isServiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-gray-900">
              {editingService ? 'Edit Service Offering' : 'Add New Service Offering'}
            </h3>

            <form onSubmit={handleSaveService} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Target Category *</label>
                <select
                  value={svcCategoryId}
                  onChange={(e) => setSvcCategoryId(Number(e.target.value))}
                  className="w-full rounded-xl border border-gray-300 p-2.5 text-sm focus:border-blue-600 outline-none cursor-pointer"
                  required
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Service Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Switchboard Repair & Replacement"
                  value={svcName}
                  onChange={(e) => setSvcName(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 p-2.5 text-sm focus:border-blue-600 outline-none"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="What is included in this service..."
                  value={svcDescription}
                  onChange={(e) => setSvcDescription(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 p-2.5 text-sm focus:border-blue-600 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Base Price (₹) *</label>
                  <input
                    type="number"
                    min="1"
                    value={svcBasePrice}
                    onChange={(e) => setSvcBasePrice(Number(e.target.value))}
                    className="w-full rounded-xl border border-gray-300 p-2.5 text-sm focus:border-blue-600 outline-none font-bold text-emerald-600"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">Est. Duration (Mins) *</label>
                  <input
                    type="number"
                    min="15"
                    step="15"
                    value={svcDuration}
                    onChange={(e) => setSvcDuration(Number(e.target.value))}
                    className="w-full rounded-xl border border-gray-300 p-2.5 text-sm focus:border-blue-600 outline-none font-bold text-gray-800"
                    required
                  />
                </div>
              </div>

              {editingService && (
                <div className="pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={svcIsActive}
                      onChange={(e) => setSvcIsActive(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600"
                    />
                    <span className="text-gray-700 font-semibold">Active & Bookable</span>
                  </label>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsServiceModalOpen(false)}
                  className="rounded-xl border border-gray-300 px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-blue-700"
                >
                  {editingService ? 'Save Changes' : 'Create Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 3: DELETE CONFIRMATION ──────────────────────────────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600">
              <Trash2 size={28} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Delete {deleteTarget.type === 'category' ? 'Category' : 'Service'}?</h3>
              <p className="text-xs text-gray-500 mt-1">
                Are you sure you want to delete <span className="font-bold text-gray-800">"{deleteTarget.name}"</span>? This action will disable it from customer bookings.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 rounded-xl border border-gray-300 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 rounded-xl bg-red-600 py-2.5 text-xs font-bold text-white hover:bg-red-700 shadow-md"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
