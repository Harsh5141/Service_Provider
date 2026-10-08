import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Zap, Droplets, Wind, Sparkles, Check, ChevronRight,
  Clock, ShieldCheck, Calendar, CheckCircle2,
  ArrowLeft, MapPin, Plus, RefreshCw,
  Wrench, X, Tv, Hammer, Paintbrush, ShieldAlert, Flame, Camera,
  Search, ArrowRight, Award, FileText
} from 'lucide-react'
import api from '@/lib/apiClient'
import toast from 'react-hot-toast'
import { INDIAN_STATES, lookupPinCode } from '@/lib/locationConstants'
import { generateNewRequestOtp } from '@/lib/otpUtils'

interface ServiceItem {
  id: number
  categoryId: number
  categoryName: string
  name: string
  description: string
  basePrice: number
  estimatedDurationMinutes: number
}

interface AddressItem {
  id: number
  userId: number
  label?: string
  street: string
  city: string
  state: string
  postalCode: string
  latitude?: number
  longitude?: number
  isDefault: boolean
}

interface PublicProviderItem {
  id: number
  userId: number
  name: string
  email: string
  phone: string
  bio: string
  specialization?: string
  experienceYears: number
  serviceRadiusKm: number
  street?: string
  city: string
  state?: string
  postalCode: string
  ratingAverage: number
  ratingCount: number
  completedJobsCount?: number
  isAvailable: boolean
  skills: string[]
  categoryNames?: string[]
  categoryId: number
}

interface CategoryInfo {
  id: number
  name: string
  slug: string
  description: string
  iconName: string
}

// 10 Official Categories Metadata
const CATEGORY_META: Record<string, { icon: any; color: string; bg: string; badge: string }> = {
  'Electrical & Power Solutions': { icon: Zap, color: 'text-amber-500', bg: 'bg-amber-500/10', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  'Plumbing & Sanitary Works': { icon: Droplets, color: 'text-cyan-500', bg: 'bg-cyan-500/10', badge: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  'AC & HVAC Cooling Services': { icon: Wind, color: 'text-sky-500', bg: 'bg-sky-500/10', badge: 'bg-sky-50 text-sky-700 border-sky-200' },
  'Home Appliance Repair': { icon: Tv, color: 'text-indigo-500', bg: 'bg-indigo-500/10', badge: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  'Deep Cleaning & Sanitization': { icon: Sparkles, color: 'text-teal-500', bg: 'bg-teal-500/10', badge: 'bg-teal-50 text-teal-700 border-teal-200' },
  'Carpentry & Furniture Assembly': { icon: Hammer, color: 'text-orange-500', bg: 'bg-orange-500/10', badge: 'bg-orange-50 text-orange-700 border-orange-200' },
  'Painting & Wall Waterproofing': { icon: Paintbrush, color: 'text-rose-500', bg: 'bg-rose-500/10', badge: 'bg-rose-50 text-rose-700 border-rose-200' },
  'Pest Control & Disinfection': { icon: ShieldAlert, color: 'text-red-500', bg: 'bg-red-500/10', badge: 'bg-red-50 text-red-700 border-red-200' },
  'RO Water Purifier & Geyser Care': { icon: Flame, color: 'text-emerald-500', bg: 'bg-emerald-500/10', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  'Smart Home & CCTV Security': { icon: Camera, color: 'text-purple-500', bg: 'bg-purple-500/10', badge: 'bg-purple-50 text-purple-700 border-purple-200' }
}

const COMMON_PROBLEM_TAGS = [
  'Sudden breakdown / Not working',
  'Strange noise / vibration',
  'Water leakage / dripping',
  'Burnt smell / sparks',
  'Routine inspection & service',
  'New installation & setup'
]

export default function CreateRequestPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const queryServiceId = searchParams.get('serviceId') ? Number(searchParams.get('serviceId')) : null
  const queryCategoryId = searchParams.get('categoryId') ? Number(searchParams.get('categoryId')) : null
  const queryProviderId = searchParams.get('providerId') ? Number(searchParams.get('providerId')) : null

  // Wizard Step (1: Service, 2: Address & Slot, 3: Problem Description, 4: Review)
  const [step, setStep] = useState<number>(1)

  // Data States
  const [categories, setCategories] = useState<CategoryInfo[]>([])
  const [services, setServices] = useState<ServiceItem[]>([])
  const [providers, setProviders] = useState<PublicProviderItem[]>([])
  const [savedAddresses, setSavedAddresses] = useState<AddressItem[]>([])

  // Selection States
  const [selectedCategoryId, setSelectedCategoryId] = useState<number>(queryCategoryId || 0)
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null)
  const [preferredProvider, setPreferredProvider] = useState<PublicProviderItem | null>(null)
  const [selectedAddress, setSelectedAddress] = useState<AddressItem | null>(null)

  // Booking Flow States
  const [viewMode, setViewMode] = useState<'ALL' | 'SERVICES' | 'PROVIDERS'>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [scheduledDate, setScheduledDate] = useState<string>(() => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    return d.toISOString().split('T')[0]
  })
  const [timeSlot, setTimeSlot] = useState<string>('Morning (9 AM - 12 PM)')
  const [problemDescription, setProblemDescription] = useState<string>('')
  const [submitting, setSubmitting] = useState<boolean>(false)

  // Address Modal State
  const [showAddAddrModal, setShowAddAddrModal] = useState(false)
  const [newStreet, setNewStreet] = useState('')
  const [newCity, setNewCity] = useState('Valsad')
  const [newState, setNewState] = useState('Gujarat')
  const [newPostalCode, setNewPostalCode] = useState('')
  const [newIsDefault, setNewIsDefault] = useState(false)
  const [isLookingUpPin, setIsLookingUpPin] = useState(false)
  const [pinErrorMessage, setPinErrorMessage] = useState<string | null>(null)
  const [isPinValid, setIsPinValid] = useState<boolean | null>(null)
  const [savingAddr, setSavingAddr] = useState(false)

  // Booking Result State
  const [bookingResult, setBookingResult] = useState<{
    success: boolean
    requestId?: number
    providerAssigned?: boolean
    providerName?: string
    providerRating?: number
    distanceKm?: number
    estimatedArrivalMinutes?: number
  } | null>(null)

  // Fetch initial data
  useEffect(() => {
    async function loadInitialData() {
      try {
        const [catsRes, svcsRes, provsRes, addrsRes] = await Promise.allSettled([
          api.get('/services/categories'),
          api.get('/services'),
          api.get('/services/providers'),
          api.get('/addresses')
        ])

        // Categories
        if (catsRes.status === 'fulfilled' && catsRes.value.data?.data) {
          setCategories(catsRes.value.data.data)
        }

        // Services
        let loadedServices: ServiceItem[] = []
        if (svcsRes.status === 'fulfilled' && svcsRes.value.data?.data) {
          loadedServices = svcsRes.value.data.data
          setServices(loadedServices)
        }

        // Providers
        let loadedProviders: PublicProviderItem[] = []
        if (provsRes.status === 'fulfilled' && provsRes.value.data?.data) {
          loadedProviders = provsRes.value.data.data
          setProviders(loadedProviders)
        }

        // Addresses
        if (addrsRes.status === 'fulfilled' && addrsRes.value.data?.data) {
          const addrs: AddressItem[] = addrsRes.value.data.data
          setSavedAddresses(addrs)
          const def = addrs.find((a) => a.isDefault) || addrs[0]
          if (def) setSelectedAddress(def)
        }

        // Pre-select via URL params
        if (queryServiceId && loadedServices.length > 0) {
          const matchedSvc = loadedServices.find((s) => s.id === queryServiceId)
          if (matchedSvc) {
            setSelectedService(matchedSvc)
            setSelectedCategoryId(matchedSvc.categoryId)
          }
        } else if (queryCategoryId) {
          setSelectedCategoryId(queryCategoryId)
        }

        if (queryProviderId && loadedProviders.length > 0) {
          const matchedProv = loadedProviders.find((p) => p.id === queryProviderId || p.userId === queryProviderId)
          if (matchedProv) {
            setPreferredProvider(matchedProv)
            setSelectedCategoryId(matchedProv.categoryId)
          }
        }
      } catch (err) {
        console.error('Failed to load booking data', err)
      }
    }
    loadInitialData()
  }, [])

  // Filtered Services
  const filteredServices = useMemo(() => {
    return services.filter((s) => {
      if (selectedCategoryId !== 0 && s.categoryId !== selectedCategoryId) return false
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        return (
          s.name.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.categoryName?.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [services, selectedCategoryId, searchQuery])

  // Filtered Providers
  const filteredProviders = useMemo(() => {
    return providers.filter((p) => {
      if (selectedCategoryId !== 0 && p.categoryId !== selectedCategoryId) return false
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        return (
          p.name.toLowerCase().includes(q) ||
          p.bio?.toLowerCase().includes(q) ||
          p.specialization?.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [providers, selectedCategoryId, searchQuery])

  // Select Service Handler
  const handleSelectService = (svc: ServiceItem) => {
    setSelectedService(svc)
    setSelectedCategoryId(svc.categoryId)
    toast.success(`Selected ${svc.name}!`)
    setStep(2)
  }

  // Select Provider Handler
  const handleSelectProvider = (prov: PublicProviderItem) => {
    setPreferredProvider(prov)
    setSelectedCategoryId(prov.categoryId)

    // Auto find matching service in provider's category
    const catServices = services.filter((s) => s.categoryId === prov.categoryId)
    if (catServices.length > 0 && (!selectedService || selectedService.categoryId !== prov.categoryId)) {
      setSelectedService(catServices[0])
      toast.success(`Selected specialist ${prov.name} for ${catServices[0].name}!`)
    } else {
      toast.success(`Selected specialist ${prov.name}!`)
    }
    setStep(2)
  }

  // PIN Code Handler for Add Address Modal
  const handlePinChange = async (rawVal: string, targetState?: string) => {
    const clean = rawVal.replace(/\D/g, '').slice(0, 6)
    setNewPostalCode(clean)
    const activeState = targetState !== undefined ? targetState : newState

    if (!clean) {
      setNewCity('')
      setIsPinValid(null)
      setPinErrorMessage(null)
      return
    }

    if (clean.length < 6) {
      setNewCity('')
      setIsPinValid(false)
      setPinErrorMessage('Enter a valid 6-digit PIN Code')
      return
    }

    setIsLookingUpPin(true)
    setPinErrorMessage(null)
    try {
      const res = await lookupPinCode(clean, activeState)
      if (res.isValid && res.city) {
        setNewCity(res.city)
        setIsPinValid(true)
        setPinErrorMessage(null)
      } else {
        setNewCity('')
        setIsPinValid(false)
        setPinErrorMessage(res.errorMessage || 'PIN Code does not belong to the selected State')
      }
    } catch {
      setNewCity('')
      setIsPinValid(false)
      setPinErrorMessage('PIN Code does not belong to the selected State')
    } finally {
      setIsLookingUpPin(false)
    }
  }

  const handleSaveNewAddress = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newStreet.trim()) {
      toast.error('Address street is required')
      return
    }
    if (!newPostalCode.trim() || newPostalCode.length !== 6 || !isPinValid) {
      toast.error(pinErrorMessage || 'Valid 6-digit PIN Code is required')
      return
    }

    setSavingAddr(true)
    try {
      const res = await api.post('/addresses', {
        label: 'Home',
        street: newStreet.trim(),
        city: newCity.trim() || 'Valsad',
        state: newState.trim() || 'Gujarat',
        postalCode: newPostalCode.trim(),
        isDefault: newIsDefault
      })

      const created: AddressItem = res.data?.data
      if (created) {
        setSavedAddresses((prev) => [...prev, created])
        setSelectedAddress(created)
      } else {
        const mock: AddressItem = {
          id: Date.now(),
          userId: 1,
          street: newStreet.trim(),
          city: newCity.trim() || 'Valsad',
          state: newState.trim() || 'Gujarat',
          postalCode: newPostalCode.trim(),
          isDefault: newIsDefault
        }
        setSavedAddresses((prev) => [...prev, mock])
        setSelectedAddress(mock)
      }

      setShowAddAddrModal(false)
      toast.success('Service location added!')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save address')
    } finally {
      setSavingAddr(false)
    }
  }

  // Pricing calculations
  const basePrice = selectedService?.basePrice ?? 199
  const safetyFee = 49
  const totalAmount = basePrice + safetyFee

  // Final Booking Submission
  const handleSubmitBooking = async () => {
    if (!selectedService) {
      toast.error('Please select a service')
      setStep(1)
      return
    }
    if (!selectedAddress) {
      toast.error('Please select or add a service location')
      setStep(2)
      return
    }
    if (!problemDescription.trim()) {
      toast.error('Please enter a brief problem description')
      setStep(3)
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        serviceId: selectedService.id,
        addressId: selectedAddress.id,
        street: selectedAddress.street,
        city: selectedAddress.city,
        state: selectedAddress.state,
        postalCode: selectedAddress.postalCode,
        providerProfileId: preferredProvider?.id || undefined,
        scheduledDate: new Date(scheduledDate).toISOString(),
        preferredTimeSlot: timeSlot,
        problemDescription: problemDescription.trim(),
        estimatedCost: totalAmount
      }

      const res = await api.post('/requests', payload)
      const data = res.data?.data

      if (data) {
        const isAssigned = !!data.providerId || !!data.providerName
        generateNewRequestOtp(data.id)
        setBookingResult({
          success: true,
          requestId: data.id,
          providerAssigned: isAssigned,
          providerName: data.providerName || undefined,
          providerRating: data.providerRating || undefined,
          distanceKm: data.distanceKm || 1.8,
          estimatedArrivalMinutes: data.estimatedArrivalMinutes || 25
        })
      } else {
        const reqId = Math.floor(100 + Math.random() * 900)
        generateNewRequestOtp(reqId)
        setBookingResult({
          success: true,
          requestId: reqId,
          providerAssigned: false,
          distanceKm: 2.1,
          estimatedArrivalMinutes: 25
        })
      }

      toast.success('Service booking confirmed & specialist dispatched!')
      window.dispatchEvent(new Event('fixmate_job_updated'))
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || 'Booking submission failed'
      console.warn('Booking error', err)
      setBookingResult({
        success: false,
        providerAssigned: false
      })
      toast.error(errMsg)
    } finally {
      setSubmitting(false)
    }
  }

  // ── RESULT SCREEN (AFTER SUBMISSION) ──────────────────────────────────────
  if (bookingResult) {
    if (bookingResult.success && bookingResult.requestId) {
      return (
        <div className="mx-auto max-w-xl py-12 px-4 space-y-6 animate-in fade-in duration-300">
          <div className="rounded-3xl border border-emerald-100 bg-white p-8 text-center shadow-xl space-y-6">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-50 text-emerald-600 border border-emerald-200 animate-bounce">
              <CheckCircle2 size={42} />
            </div>

            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3.5 py-1 text-xs font-bold text-emerald-800 border border-emerald-200">
                Booking #{bookingResult.requestId} Confirmed
              </span>
              <h2 className="text-2xl font-extrabold text-gray-900">
                {bookingResult.providerAssigned ? 'Specialist Assigned!' : 'Technician Dispatch Active!'}
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 max-w-md mx-auto">
                {bookingResult.providerAssigned
                  ? `Your service has been confirmed and assigned to ${bookingResult.providerName}.`
                  : 'FixMate has broadcasted your request to top-rated certified partners in Valsad.'}
              </p>
            </div>

            {/* Booking Details Summary */}
            <div className="rounded-2xl bg-gray-50 p-4 border border-gray-200 text-xs text-left space-y-2.5">
              <div className="flex justify-between items-center text-gray-600">
                <span className="font-semibold">Service:</span>
                <span className="font-bold text-gray-900">{selectedService?.name}</span>
              </div>
              <div className="flex justify-between items-center text-gray-600">
                <span className="font-semibold">Scheduled Slot:</span>
                <span className="font-bold text-gray-900">{scheduledDate} · {timeSlot}</span>
              </div>
              <div className="flex justify-between items-center text-gray-600">
                <span className="font-semibold">Service Address:</span>
                <span className="font-bold text-gray-900">{selectedAddress?.street}, {selectedAddress?.city}</span>
              </div>
              <div className="flex justify-between items-center text-gray-600 border-t border-gray-200 pt-2 font-bold">
                <span>Total Upfront Amount:</span>
                <span className="text-emerald-600 text-sm font-extrabold">₹{totalAmount}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={() => navigate(`/requests/${bookingResult.requestId}`)}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-xs font-bold text-white shadow-md hover:bg-blue-700 transition"
              >
                <span>Track Live Status</span>
                <ArrowRight size={14} />
              </button>
              <button
                onClick={() => navigate('/requests')}
                className="flex-1 rounded-xl border border-gray-200 bg-white py-3 text-xs font-bold text-gray-700 hover:bg-gray-50 transition"
              >
                Go to My Bookings
              </button>
            </div>
          </div>
        </div>
      )
    }
  }

  return (
    <div className="space-y-8 pb-16">
      {/* ── 1. Top Header Banner & Step Indicator ──────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-900 p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute -right-10 -top-10 h-60 w-60 rounded-full bg-blue-500/20 blur-3xl pointer-events-none" />
        <div className="absolute right-1/3 -bottom-10 h-48 w-48 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => (step > 1 ? setStep(step - 1) : navigate('/requests'))}
                  className="inline-flex items-center gap-1 rounded-lg bg-white/10 hover:bg-white/20 px-2.5 py-1 text-xs font-semibold text-blue-200 transition backdrop-blur-md"
                >
                  <ArrowLeft size={13} />
                  <span>{step > 1 ? 'Previous Step' : 'All Bookings'}</span>
                </button>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300 border border-emerald-500/30">
                  <ShieldCheck size={12} />
                  30-Day FixMate Warranty
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                Book a Home Service
              </h1>
              <p className="text-xs sm:text-sm text-slate-300">
                Transparent upfront pricing, background-verified specialists & nearest automatic matching
              </p>
            </div>

            {/* Quick Status Pill */}
            {selectedService && (
              <div className="rounded-2xl bg-white/10 border border-white/15 p-3 backdrop-blur-md text-right hidden md:block">
                <p className="text-[10px] uppercase font-bold text-blue-300">Selected Package</p>
                <p className="text-sm font-bold text-white line-clamp-1">{selectedService.name}</p>
                <p className="text-xs font-extrabold text-emerald-300">₹{selectedService.basePrice}</p>
              </div>
            )}
          </div>

          {/* 4-Step Interactive Breadcrumb Pill Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-white/10">
            {[
              { num: 1, label: 'Select Service / Pro', active: step === 1, done: step > 1 },
              { num: 2, label: 'Location & Slot', active: step === 2, done: step > 2 },
              { num: 3, label: 'Problem Details', active: step === 3, done: step > 3 },
              { num: 4, label: 'Review & Confirm', active: step === 4, done: false }
            ].map((s) => (
              <button
                key={s.num}
                onClick={() => {
                  if (s.done || (s.num === 2 && selectedService) || (s.num === 3 && selectedAddress)) {
                    setStep(s.num)
                  }
                }}
                disabled={!s.done && s.num > step}
                className={`flex items-center gap-2.5 rounded-xl p-2.5 text-left transition ${
                  s.active
                    ? 'bg-blue-600 text-white shadow-md'
                    : s.done
                    ? 'bg-white/15 text-blue-200 hover:bg-white/20 cursor-pointer'
                    : 'bg-white/5 text-slate-400 opacity-60 cursor-not-allowed'
                }`}
              >
                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-lg text-xs font-bold ${
                    s.done ? 'bg-emerald-400 text-slate-900' : s.active ? 'bg-white text-blue-600' : 'bg-white/20 text-white'
                  }`}
                >
                  {s.done ? <Check size={13} /> : s.num}
                </div>
                <span className="text-xs font-bold truncate">{s.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── STEP 1: SERVICE & SPECIALIST BROWSER ────────────────────────── */}
      {step === 1 && (
        <div className="space-y-6">
          {/* Domain Categories Section */}
          <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-blue-50 text-blue-600 font-bold">
                  <Sparkles size={16} />
                </span>
                <div>
                  <h3 className="text-sm font-extrabold text-gray-900">Explore Service Domains</h3>
                  <p className="text-[11px] text-gray-500">Filter background-verified specialists & fixed-price packages by domain</p>
                </div>
              </div>
              <span className="hidden sm:inline-flex items-center gap-1 text-xs font-extrabold text-blue-700 bg-blue-50 border border-blue-100 px-3 py-1 rounded-full">
                {categories.length} Specialized Domains
              </span>
            </div>

            {/* Responsive Category Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
              <button
                onClick={() => setSelectedCategoryId(0)}
                className={`flex items-center justify-between gap-2 rounded-2xl p-3 text-left transition-all border ${
                  selectedCategoryId === 0
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-600/20'
                    : 'bg-gray-50/70 text-gray-800 border-gray-200/70 hover:bg-white hover:border-blue-300 hover:shadow-xs'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                    selectedCategoryId === 0 ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-600'
                  }`}>
                    <Sparkles size={15} />
                  </div>
                  <span className="text-xs font-bold truncate">All Services</span>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-black shrink-0 ${
                  selectedCategoryId === 0 ? 'bg-white/20 text-white' : 'bg-gray-200/80 text-gray-700'
                }`}>
                  {services.length}
                </span>
              </button>

              {categories.map((cat) => {
                const meta = CATEGORY_META[cat.name] || { icon: Wrench, color: 'text-blue-500', bg: 'bg-blue-50', badge: 'bg-blue-50 text-blue-700 border-blue-200' }
                const Icon = meta.icon
                const isSelected = selectedCategoryId === cat.id
                const catServiceCount = services.filter((s) => s.categoryId === cat.id).length

                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategoryId(cat.id)}
                    className={`flex items-center justify-between gap-2 rounded-2xl p-3 text-left transition-all border ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-600/20'
                        : 'bg-white text-gray-800 border-gray-200/80 hover:bg-blue-50/40 hover:border-blue-300 hover:shadow-xs'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition ${
                        isSelected ? 'bg-white/20 text-white' : `${meta.bg} ${meta.color}`
                      }`}>
                        <Icon size={15} />
                      </div>
                      <span className="text-xs font-bold truncate">{cat.name}</span>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-black shrink-0 ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {catServiceCount}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Sub-Header & Mode Switcher */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
            <div className="flex items-center gap-1.5">
              {[
                { key: 'ALL', label: `All (${filteredServices.length + filteredProviders.length})` },
                { key: 'SERVICES', label: `Packages (${filteredServices.length})` },
                { key: 'PROVIDERS', label: `Specialists (${filteredProviders.length})` }
              ].map((m) => (
                <button
                  key={m.key}
                  onClick={() => setViewMode(m.key as any)}
                  className={`rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                    viewMode === m.key
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search packages, repairs, pros..."
                className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-8 pr-3 py-2 text-xs text-gray-800 placeholder-gray-400 outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>
          </div>

          {/* Service Packages Grid */}
          {(viewMode === 'ALL' || viewMode === 'SERVICES') && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Wrench size={15} className="text-blue-600" />
                  Available Fixed-Price Service Packages ({filteredServices.length})
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredServices.map((svc) => {
                  const meta = CATEGORY_META[svc.categoryName] || { icon: Wrench, color: 'text-blue-500', badge: 'bg-blue-50 text-blue-700' }
                  const Icon = meta.icon
                  const isSelected = selectedService?.id === svc.id

                  return (
                    <div
                      key={svc.id}
                      className={`group relative rounded-2xl border bg-white p-5 transition-all duration-200 shadow-xs hover:border-blue-400 hover:shadow-lg flex flex-col justify-between space-y-4 ${
                        isSelected ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-gray-200'
                      }`}
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-0.5 text-[10px] font-bold border ${meta.badge}`}>
                            <Icon size={12} />
                            <span>{svc.categoryName}</span>
                          </span>
                          <span className="text-base font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg">
                            ₹{svc.basePrice}
                          </span>
                        </div>

                        <h4 className="text-sm sm:text-base font-bold text-gray-900 group-hover:text-blue-600 transition">
                          {svc.name}
                        </h4>
                        <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                          {svc.description}
                        </p>

                        {/* Inclusions Checklist */}
                        <div className="pt-2 border-t border-gray-100 space-y-1 text-[11px] text-gray-600">
                          <div className="flex items-center gap-1.5 text-emerald-700">
                            <CheckCircle2 size={12} className="text-emerald-500" />
                            <span>Full diagnostic inspection included</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-emerald-700">
                            <CheckCircle2 size={12} className="text-emerald-500" />
                            <span>30-Day FixMate warranty</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-xs">
                        <span className="flex items-center gap-1 text-gray-500">
                          <Clock size={13} className="text-gray-400" />
                          <span>~{svc.estimatedDurationMinutes} mins</span>
                        </span>
                        <button
                          onClick={() => handleSelectService(svc)}
                          className={`inline-flex items-center gap-1 rounded-xl px-3.5 py-1.5 font-bold transition shadow-2xs ${
                            isSelected
                              ? 'bg-emerald-600 text-white'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                        >
                          <span>{isSelected ? 'Selected' : 'Select Package'}</span>
                          <ChevronRight size={13} />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Verified Specialists Grid */}
          {(viewMode === 'ALL' || viewMode === 'PROVIDERS') && filteredProviders.length > 0 && (
            <div className="space-y-4 pt-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Award size={15} className="text-amber-500" />
                  Verified Specialists in Valsad ({filteredProviders.length})
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProviders.map((prov) => {
                  const isSelected = preferredProvider?.id === prov.id

                  return (
                    <div
                      key={prov.id}
                      className={`group rounded-2xl border bg-white p-5 transition-all duration-200 shadow-xs hover:border-blue-400 hover:shadow-lg flex flex-col justify-between space-y-4 ${
                        isSelected ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-gray-200'
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-extrabold text-sm shadow-xs">
                            {prov.name.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h4 className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition">
                                {prov.name}
                              </h4>
                              <span className="rounded-md bg-emerald-100 px-1.5 py-0.2 text-[9px] font-extrabold text-emerald-800">
                                Verified
                              </span>
                            </div>
                            <p className="text-[11px] text-gray-500">{prov.specialization}</p>
                          </div>
                        </div>

                        <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                          {prov.bio}
                        </p>

                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span className="font-bold text-amber-600">⭐ {prov.ratingAverage?.toFixed(1) || '4.9'} ({prov.ratingCount || 50}+ jobs)</span>
                          <span>·</span>
                          <span>{prov.experienceYears || 5}+ Yrs Exp</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-xs">
                        <span className="text-gray-500">{prov.city}, Gujarat</span>
                        <button
                          onClick={() => handleSelectProvider(prov)}
                          className={`inline-flex items-center gap-1 rounded-xl px-3.5 py-1.5 font-bold transition shadow-2xs ${
                            isSelected
                              ? 'bg-emerald-600 text-white'
                              : 'bg-indigo-600 text-white hover:bg-indigo-700'
                          }`}
                        >
                          <span>{isSelected ? 'Specialist Picked' : 'Book Specialist'}</span>
                          <ChevronRight size={13} />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── STEP 2: SERVICE LOCATION & SCHEDULE ────────────────────────── */}
      {step === 2 && (
        <div className="w-full space-y-6">
          {/* Address Picker */}
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <MapPin size={18} className="text-rose-500" />
                <h3 className="text-base font-bold text-gray-900">Select Service Location</h3>
              </div>
              <button
                onClick={() => setShowAddAddrModal(true)}
                className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700"
              >
                <Plus size={14} /> Add New Address
              </button>
            </div>

            <div className="space-y-3">
              {savedAddresses.map((addr) => (
                <div
                  key={addr.id}
                  onClick={() => setSelectedAddress(addr)}
                  className={`rounded-2xl border p-4 cursor-pointer transition flex items-start justify-between gap-3 ${
                    selectedAddress?.id === addr.id
                      ? 'border-blue-500 bg-blue-50/40 ring-2 ring-blue-500/20'
                      : 'border-gray-200 hover:border-blue-200 bg-white'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-gray-900">{addr.label || 'Home'}</span>
                      {addr.isDefault && (
                        <span className="rounded-md bg-blue-100 px-1.5 py-0.2 text-[10px] font-extrabold text-blue-800">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-semibold text-gray-800">{addr.street}</p>
                    <p className="text-[11px] text-gray-500">{addr.city}, {addr.state} — {addr.postalCode}</p>
                  </div>
                  <div
                    className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                      selectedAddress?.id === addr.id ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300'
                    }`}
                  >
                    {selectedAddress?.id === addr.id && <Check size={12} />}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Schedule Date & Time Slot */}
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-xs space-y-5">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <Calendar size={18} className="text-blue-600" />
              <h3 className="text-base font-bold text-gray-900">Preferred Date & Arrival Slot</h3>
            </div>

            {/* Quick Date Chips */}
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-2">Select Service Date</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    label: 'Today',
                    dateStr: new Date().toISOString().split('T')[0],
                    desc: 'Express Arrival'
                  },
                  {
                    label: 'Tomorrow',
                    dateStr: (() => {
                      const d = new Date()
                      d.setDate(d.getDate() + 1)
                      return d.toISOString().split('T')[0]
                    })(),
                    desc: 'Standard Dispatch'
                  },
                  {
                    label: 'Custom Date',
                    dateStr: scheduledDate,
                    desc: 'Pick your calendar'
                  }
                ].map((dOption, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setScheduledDate(dOption.dateStr)}
                    className={`rounded-2xl border p-3.5 text-left transition ${
                      scheduledDate === dOption.dateStr
                        ? 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-500/20'
                        : 'border-gray-200 hover:border-blue-200 bg-white'
                    }`}
                  >
                    <p className="text-xs font-extrabold text-gray-900">{dOption.label}</p>
                    <p className="text-[11px] text-gray-500">{dOption.desc}</p>
                    <p className="text-[11px] font-bold text-blue-700 mt-1">{dOption.dateStr}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Time Slot Grid */}
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-2">Select Time Window</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  'Morning (9 AM - 12 PM)',
                  'Afternoon (12 PM - 3 PM)',
                  'Evening (3 PM - 7 PM)',
                  'Night (7 PM - 9 PM)'
                ].map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setTimeSlot(slot)}
                    className={`rounded-xl border p-3 text-xs font-bold transition text-center ${
                      timeSlot === slot
                        ? 'border-blue-600 bg-blue-600 text-white shadow-xs'
                        : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setStep(1)}
              className="rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-50"
            >
              Back to Services
            </button>
            <button
              onClick={() => {
                if (!selectedAddress) {
                  toast.error('Please select a service address')
                  return
                }
                setStep(3)
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-blue-700"
            >
              <span>Continue to Problem Details</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 3: PROBLEM DETAILS ────────────────────────────────────── */}
      {step === 3 && (
        <div className="w-full space-y-6">
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-xs space-y-5">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <FileText size={18} className="text-blue-600" />
              <h3 className="text-base font-bold text-gray-900">Describe the Issue</h3>
            </div>

            {/* Quick problem tags */}
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-2">Quick Problem Suggestions</label>
              <div className="flex flex-wrap gap-2">
                {COMMON_PROBLEM_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      if (!problemDescription.includes(tag)) {
                        setProblemDescription((prev) => (prev ? `${prev}, ${tag}` : tag))
                      }
                    }}
                    className="rounded-xl bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition"
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Textarea */}
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">
                Specific Problem Description *
              </label>
              <textarea
                rows={4}
                required
                value={problemDescription}
                onChange={(e) => setProblemDescription(e.target.value)}
                placeholder="e.g. Master bedroom split AC is not cooling properly and indoor unit is dripping water..."
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 p-4 text-xs text-gray-900 outline-none focus:border-blue-600 focus:bg-white transition leading-relaxed"
              />
              <p className="text-[11px] text-gray-400 text-right mt-1">{problemDescription.length} characters</p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setStep(2)}
              className="rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-50"
            >
              Back to Schedule
            </button>
            <button
              onClick={() => {
                if (!problemDescription.trim()) {
                  toast.error('Please enter a brief problem description')
                  return
                }
                setStep(4)
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-blue-700"
            >
              <span>Review Upfront Order</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 4: REVIEW & CONFIRM ───────────────────────────────────── */}
      {step === 4 && selectedService && selectedAddress && (
        <div className="w-full space-y-6">
          <div className="rounded-3xl border border-gray-200 bg-white p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-4">
              <ShieldCheck size={20} className="text-emerald-600" />
              <div>
                <h3 className="text-lg font-bold text-gray-900">Review Booking & Upfront Rate</h3>
                <p className="text-xs text-gray-500">Pay securely via Cash or UPI after service completion</p>
              </div>
            </div>

            {/* Itemized summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="rounded-2xl bg-gray-50 p-4 border border-gray-200 space-y-2">
                <p className="font-bold text-gray-400 uppercase tracking-wider text-[10px]">Service Package</p>
                <p className="text-sm font-extrabold text-gray-900">{selectedService.name}</p>
                <p className="text-gray-500">{selectedService.categoryName}</p>
              </div>

              <div className="rounded-2xl bg-gray-50 p-4 border border-gray-200 space-y-2">
                <p className="font-bold text-gray-400 uppercase tracking-wider text-[10px]">Assigned Specialist</p>
                <p className="text-sm font-extrabold text-blue-700">
                  {preferredProvider ? preferredProvider.name : 'Nearest Verified Partner (Valsad)'}
                </p>
                <p className="text-gray-500">
                  {preferredProvider ? `⭐ ${preferredProvider.ratingAverage.toFixed(1)} Verified Specialist` : 'Automated 45-Min Nearest Dispatch'}
                </p>
              </div>

              <div className="rounded-2xl bg-gray-50 p-4 border border-gray-200 space-y-2">
                <p className="font-bold text-gray-400 uppercase tracking-wider text-[10px]">Date & Time Slot</p>
                <p className="text-sm font-bold text-gray-900">{scheduledDate}</p>
                <p className="text-gray-500">{timeSlot}</p>
              </div>

              <div className="rounded-2xl bg-gray-50 p-4 border border-gray-200 space-y-2">
                <p className="font-bold text-gray-400 uppercase tracking-wider text-[10px]">Service Location</p>
                <p className="text-sm font-bold text-gray-900 truncate">{selectedAddress.street}</p>
                <p className="text-gray-500">{selectedAddress.city}, Gujarat — {selectedAddress.postalCode}</p>
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="rounded-2xl bg-slate-50 p-5 border border-slate-200 space-y-3 text-xs">
              <div className="flex justify-between items-center text-gray-600">
                <span>Base Service Package:</span>
                <span className="font-bold text-gray-900">₹{selectedService.basePrice}</span>
              </div>
              <div className="flex justify-between items-center text-gray-600">
                <span>FixMate Safety & Hygiene Fee:</span>
                <span className="font-bold text-gray-900">₹49</span>
              </div>
              <div className="flex justify-between items-center text-gray-600">
                <span>30-Day Post-Service Guarantee:</span>
                <span className="font-bold text-emerald-600">FREE</span>
              </div>
              <div className="border-t border-slate-300 pt-3 flex justify-between items-center text-sm font-extrabold text-gray-900">
                <span>Total Amount Due at Completion:</span>
                <span className="text-lg text-emerald-600 font-black">₹{totalAmount}</span>
              </div>
            </div>

            {/* Guarantee Note */}
            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3.5 border border-emerald-200/80 text-xs text-emerald-800">
              <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
              <span>
                <strong>FixMate Assurance:</strong> No advance payment required. Pay your certified specialist via cash or UPI after complete satisfaction.
              </span>
            </div>

            {/* Submit Action */}
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setStep(3)}
                className="rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-50"
              >
                Back to Details
              </button>
              <button
                disabled={submitting}
                onClick={handleSubmitBooking}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 px-7 py-3 text-xs sm:text-sm font-extrabold text-white shadow-lg shadow-blue-500/30 hover:from-blue-700 hover:to-indigo-800 transition disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Dispatching Specialist...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    <span>Confirm Booking & Dispatch</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ADD ADDRESS MODAL ──────────────────────────────────────────── */}
      {showAddAddrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 sm:p-7 shadow-2xl border border-gray-100 space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 font-bold">
                  <MapPin size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Add Service Location</h3>
                  <p className="text-xs text-gray-500">Auto-validates PIN code & location coordinates</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddAddrModal(false)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveNewAddress} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-gray-700">State *</label>
                <select
                  value={newState}
                  onChange={(e) => {
                    setNewState(e.target.value)
                    if (newPostalCode.length === 6) handlePinChange(newPostalCode, e.target.value)
                  }}
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-900 font-medium outline-none focus:border-blue-600 focus:bg-white"
                >
                  {INDIAN_STATES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700">6-Digit PIN Code *</label>
                  <div className="relative mt-1">
                    <input
                      type="text"
                      maxLength={6}
                      required
                      placeholder="e.g. 396001"
                      value={newPostalCode}
                      onChange={(e) => handlePinChange(e.target.value)}
                      className={`w-full rounded-xl border p-3 text-xs font-medium outline-none transition ${
                        isPinValid === true
                          ? 'border-emerald-500 bg-emerald-50/30'
                          : isPinValid === false
                          ? 'border-rose-500 bg-rose-50/30'
                          : 'border-gray-200 bg-gray-50 focus:border-blue-600 focus:bg-white'
                      }`}
                    />
                    {isLookingUpPin && (
                      <RefreshCw className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-blue-600" size={14} />
                    )}
                  </div>
                  {pinErrorMessage && (
                    <p className="mt-1 text-[11px] text-rose-600">{pinErrorMessage}</p>
                  )}
                </div>

                <div>
                  <label className="font-bold text-gray-700">City / District (Auto-Resolved)</label>
                  <div className="relative mt-1">
                    <input
                      type="text"
                      readOnly
                      placeholder="e.g. Valsad"
                      value={newCity}
                      className="w-full rounded-xl border border-gray-200 bg-gray-100 p-3 text-xs text-gray-800 font-bold cursor-not-allowed"
                    />
                    {isPinValid && (
                      <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600" size={14} />
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700">Flat / House No. & Street Address *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. Flat 402, Sunshine Heights, 12th Cross, Near Station"
                  value={newStreet}
                  onChange={(e) => setNewStreet(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-900 outline-none focus:border-blue-600 focus:bg-white transition"
                />
              </div>

              <label className="flex items-center gap-2 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newIsDefault}
                  onChange={(e) => setNewIsDefault(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-xs font-semibold text-gray-700">Set as primary default address</span>
              </label>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddAddrModal(false)}
                  className="rounded-xl border border-gray-200 px-4 py-2.5 font-bold text-gray-600 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingAddr || isLookingUpPin}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2.5 font-bold text-white shadow-md hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {savingAddr ? 'Saving...' : 'Save & Select Address'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
