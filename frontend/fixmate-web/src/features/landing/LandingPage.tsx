import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Zap,
  Droplets,
  Wind,
  Sparkles,
  Tv,
  Paintbrush,
  Hammer,
  ShieldAlert,
  Flame,
  Camera,
  Wrench,
  ShieldCheck,
  Clock,
  CreditCard,
  Star,
  Search,
  ArrowRight,
  CheckCircle2,
  Cpu,
  BadgeCheck,
  BellRing,
  ChevronDown,
  Loader2,
  X,
  Lock
} from 'lucide-react'
import api from '@/lib/apiClient'
import { useAppSelector } from '@/hooks/useAppSelector'

interface ServiceItem {
  id: number
  categoryId: number
  categoryName?: string
  name: string
  description: string
  basePrice: number
  estimatedDurationMinutes: number
}

interface ServiceCategoryDto {
  id: number
  name: string
  slug: string
  description: string
  iconName?: string
  displayOrder: number
  isActive: boolean
  services: ServiceItem[]
}

interface PublicProviderDto {
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

const CATEGORY_STYLE_MAP: Record<string, { icon: any; color: string; bgLight: string; badge?: string }> = {
  'Electrical & Power Solutions': {
    icon: Zap,
    color: 'text-amber-600',
    bgLight: 'bg-amber-50 border-amber-200/60 hover:border-amber-300'
  },
  'Plumbing & Sanitary Works': {
    icon: Droplets,
    color: 'text-blue-600',
    bgLight: 'bg-blue-50 border-blue-200/60 hover:border-blue-300'
  },
  'AC & HVAC Cooling Services': {
    icon: Wind,
    color: 'text-cyan-600',
    bgLight: 'bg-cyan-50 border-cyan-200/60 hover:border-cyan-300',
    badge: 'Most Popular'
  },
  'Home Appliance Repair': {
    icon: Tv,
    color: 'text-indigo-600',
    bgLight: 'bg-indigo-50 border-indigo-200/60 hover:border-indigo-300'
  },
  'Deep Cleaning & Sanitization': {
    icon: Sparkles,
    color: 'text-emerald-600',
    bgLight: 'bg-emerald-50 border-emerald-200/60 hover:border-emerald-300',
    badge: '30% Off'
  },
  'Carpentry & Furniture Assembly': {
    icon: Hammer,
    color: 'text-orange-600',
    bgLight: 'bg-orange-50 border-orange-200/60 hover:border-orange-300'
  },
  'Painting & Wall Waterproofing': {
    icon: Paintbrush,
    color: 'text-rose-600',
    bgLight: 'bg-rose-50 border-rose-200/60 hover:border-rose-300'
  },
  'Pest Control & Disinfection': {
    icon: ShieldAlert,
    color: 'text-red-600',
    bgLight: 'bg-red-50 border-red-200/60 hover:border-red-300'
  },
  'RO Water Purifier & Geyser Care': {
    icon: Flame,
    color: 'text-teal-600',
    bgLight: 'bg-teal-50 border-teal-200/60 hover:border-teal-300'
  },
  'Smart Home & CCTV Security': {
    icon: Camera,
    color: 'text-purple-600',
    bgLight: 'bg-purple-50 border-purple-200/60 hover:border-purple-300'
  }
}

const FALLBACK_CATEGORIES = [
  { id: 6, name: 'AC & HVAC Cooling Services', startingPrice: 499, description: 'Split & window air conditioner maintenance, gas charging, coil cleaning & PCB repairs' },
  { id: 1, name: 'Electrical & Power Solutions', startingPrice: 199, description: 'Switchboard fixes, MCB fuses, ceiling fans, home wiring, and inverter installations' },
  { id: 2, name: 'Plumbing & Sanitary Works', startingPrice: 249, description: 'Pipe leakages, tap fittings, drain blockages, water motors, and bathroom cisterns' },
  { id: 8, name: 'Deep Cleaning & Sanitization', startingPrice: 799, description: 'Intense bathroom descaling, sofa fabric shampooing, kitchen degreasing, and full home deep clean' },
  { id: 7, name: 'Home Appliance Repair', startingPrice: 349, description: 'Front/top load washing machines, refrigerators, microwaves, and induction cooktops' },
  { id: 13, name: 'Smart Home & CCTV Security', startingPrice: 299, description: 'CCTV camera setup, smart video doorbells, smart locks, Wi-Fi mesh configuration, and sensors' },
  { id: 10, name: 'Painting & Wall Waterproofing', startingPrice: 999, description: 'Interior room wall painting, dampness proofing, texture finishes, and ceiling touch-ups' },
  { id: 9, name: 'Carpentry & Furniture Assembly', startingPrice: 249, description: 'Wooden doors, locks, hinges, modular furniture setup, cabinet fittings, and custom shelves' }
]

const TESTIMONIALS = [
  {
    name: 'Aarav Sharma',
    city: 'Bengaluru',
    role: 'Homeowner',
    rating: 5,
    comment: 'The AC technician arrived in 25 minutes! Fixed the cooling issue and replaced the capacitor. The live SignalR tracking was identical to Uber. Super transparent pricing.',
    service: 'AC Master Service'
  },
  {
    name: 'Priya Mukherjee',
    city: 'Mumbai',
    role: 'Working Professional',
    rating: 5,
    comment: 'FixMate’s Smart Appliance tracker is a lifesaver. It automatically reminded me that my RO filter was due for replacement. Booked in one click and paid securely via Razorpay.',
    service: 'RO Water Purifier Service'
  },
  {
    name: 'Vikram Mehta',
    city: 'Delhi NCR',
    role: 'Apartment Owner',
    rating: 5,
    comment: 'Had a major bathroom pipe burst late at night. The verified emergency plumber came quickly, fixed the valve, and gave a 30-day warranty card. Highly recommended!',
    service: 'Emergency Plumbing'
  }
]

const FAQS = [
  {
    q: 'How does FixMate ensure service quality and safety?',
    a: 'Every service professional undergoes police verification, identity background checks (Aadhaar/PAN), and skill certification before onboarding. In addition, all services include a complimentary 30-day rework guarantee.'
  },
  {
    q: 'Can I track the provider in real time?',
    a: 'Yes! FixMate features a live real-time timeline. You will see live status transitions: Request Created ➔ Provider Assigned ➔ Provider On The Way ➔ Service In Progress ➔ Completed.'
  },
  {
    q: 'What payment methods are supported?',
    a: 'We support all online payment methods via Razorpay (UPI, Google Pay, PhonePe, Debit/Credit Cards, Net Banking) as well as Cash on Completion.'
  },
  {
    q: 'What is the Smart Service History feature?',
    a: 'You can register your household appliances (e.g. "Living Room LG AC") on your dashboard. FixMate logs all service records, parts replaced, amounts paid, and automatically alerts you when periodic maintenance is recommended.'
  }
]

export default function LandingPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  
  // Real database states
  const [categories, setCategories] = useState<ServiceCategoryDto[]>([])
  const [services, setServices] = useState<ServiceItem[]>([])
  const [providers, setProviders] = useState<PublicProviderDto[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [dataError, setDataError] = useState<string | null>(null)

  // Public Guest Details Modal
  const [guestModalItem, setGuestModalItem] = useState<{
    type: 'SERVICE' | 'PROVIDER'
    service?: ServiceItem
    provider?: PublicProviderDto
    categoryName?: string
  } | null>(null)

  const { isAuthenticated } = useAppSelector((s) => s.auth)
  const navigate = useNavigate()
  const searchContainerRef = useRef<HTMLDivElement>(null)

  // Fetch real database data on landing page mount
  useEffect(() => {
    let isMounted = true
    async function loadData() {
      setLoadingData(true)
      setDataError(null)
      try {
        const [catsRes, svcsRes, provsRes] = await Promise.allSettled([
          api.get('/services/categories'),
          api.get('/services'),
          api.get('/services/providers')
        ])

        if (!isMounted) return

        if (catsRes.status === 'fulfilled' && catsRes.value.data?.data) {
          setCategories(catsRes.value.data.data)
        }
        if (svcsRes.status === 'fulfilled' && svcsRes.value.data?.data) {
          setServices(svcsRes.value.data.data)
        }
        if (provsRes.status === 'fulfilled' && provsRes.value.data?.data) {
          setProviders(provsRes.value.data.data)
        }
      } catch (err: any) {
        if (isMounted) {
          setDataError('Unable to load some real-time services. Showing available local network.')
        }
      } finally {
        if (isMounted) {
          setLoadingData(false)
        }
      }
    }

    loadData()
    return () => {
      isMounted = false
    }
  }, [])

  // Close search popup when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Search Results Filtering across 3 domains: Services, Categories, Providers
  const trimmedQuery = searchQuery.trim().toLowerCase()

  const matchingServices = trimmedQuery && services.length > 0
    ? services.filter(
        (s) =>
          s.name.toLowerCase().includes(trimmedQuery) ||
          s.description.toLowerCase().includes(trimmedQuery) ||
          (s.categoryName && s.categoryName.toLowerCase().includes(trimmedQuery))
      )
    : []

  const matchingCategories = trimmedQuery && categories.length > 0
    ? categories.filter(
        (c) =>
          c.name.toLowerCase().includes(trimmedQuery) ||
          c.description.toLowerCase().includes(trimmedQuery)
      )
    : []

  const matchingProviders = trimmedQuery && providers.length > 0
    ? providers.filter(
        (p) =>
          p.name.toLowerCase().includes(trimmedQuery) ||
          p.bio.toLowerCase().includes(trimmedQuery) ||
          (p.specialization && p.specialization.toLowerCase().includes(trimmedQuery)) ||
          (p.skills && p.skills.some((sk) => sk.toLowerCase().includes(trimmedQuery)))
      )
    : []

  const hasSearchResults = matchingServices.length > 0 || matchingCategories.length > 0 || matchingProviders.length > 0

  // Auth-aware Navigation Handlers
  const handleProceedToBooking = (params: { serviceId?: number; categoryId?: number; providerId?: number }) => {
    const searchParams = new URLSearchParams()
    if (params.serviceId) searchParams.set('serviceId', params.serviceId.toString())
    if (params.categoryId) searchParams.set('categoryId', params.categoryId.toString())
    if (params.providerId) searchParams.set('providerId', params.providerId.toString())

    const bookingTargetUrl = `/requests/new?${searchParams.toString()}`

    if (isAuthenticated) {
      navigate(bookingTargetUrl)
    } else {
      // Redirect to login while remembering destination URL
      navigate('/login', { state: { from: bookingTargetUrl } })
    }
  }

  const handleOpenGuestServiceDetails = (service: ServiceItem) => {
    setIsSearchOpen(false)
    setGuestModalItem({
      type: 'SERVICE',
      service,
      categoryName: service.categoryName || categories.find((c) => c.id === service.categoryId)?.name
    })
  }

  const handleOpenGuestProviderDetails = (provider: PublicProviderDto) => {
    setIsSearchOpen(false)
    setGuestModalItem({
      type: 'PROVIDER',
      provider,
      categoryName: provider.categoryNames?.[0] || categories.find((c) => c.id === provider.categoryId)?.name
    })
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (trimmedQuery) {
      setIsSearchOpen(true)
    }
  }

  return (
    <div className="space-y-20 pb-20">
      {/* ── 1. Hero Section ────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/70 via-indigo-50/40 to-white pt-12 pb-20 sm:pt-20 sm:pb-28">
        {/* Decorative background blobs */}
        <div className="absolute top-0 -left-20 h-96 w-96 rounded-full bg-blue-400/10 blur-3xl" />
        <div className="absolute top-40 -right-20 h-96 w-96 rounded-full bg-purple-400/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/80 px-3.5 py-1.5 text-xs font-semibold text-blue-700 shadow-sm backdrop-blur-sm sm:text-sm">
            <BadgeCheck className="h-4 w-4 text-blue-600" />
            <span>India&apos;s #1 Trusted Smart Home Service Network</span>
          </div>

          <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-6xl sm:leading-none">
            Smart Home & Local Services, <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Delivered to Your Doorstep
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base text-slate-600 sm:text-lg">
            Instant booking for electrical, plumbing, AC repair, home deep cleaning, and appliance servicing. Live real-time technician tracking with guaranteed upfront pricing.
          </p>

          {/* Search Bar Container */}
          <div ref={searchContainerRef} className="relative mx-auto mt-8 max-w-2xl">
            <form
              onSubmit={handleSearchSubmit}
              className="flex items-center rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-blue-900/5 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all"
            >
              <div className="flex items-center pl-3 text-slate-400">
                <Search className="h-5 w-5" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onFocus={() => {
                  if (searchQuery.trim()) setIsSearchOpen(true)
                }}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setIsSearchOpen(true)
                }}
                placeholder="Search for 'AC service', 'Tap leakage', 'Deep cleaning' or provider name..."
                className="w-full border-0 bg-transparent px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0 sm:text-base"
              />
              {loadingData && (
                <div className="mr-2 text-blue-500 animate-spin">
                  <Loader2 className="h-4 w-4" />
                </div>
              )}
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('')
                    setIsSearchOpen(false)
                  }}
                  className="mr-2 text-xs font-semibold text-slate-400 hover:text-slate-600 px-2 py-1"
                >
                  Clear
                </button>
              )}
              <button
                type="submit"
                className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-blue-600/30 hover:bg-blue-700 transition-all flex items-center gap-1.5 shrink-0"
              >
                <span>Search</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            {/* Live Search Results Dropdown Overlay */}
            {isSearchOpen && trimmedQuery && (
              <div className="absolute left-0 right-0 top-full mt-2 z-50 rounded-2xl border border-slate-200 bg-white shadow-2xl p-4 max-h-[460px] overflow-y-auto text-left space-y-4 animate-in fade-in slide-in-from-top-2 duration-150">
                {loadingData ? (
                  <div className="flex items-center justify-center py-8 text-slate-500 text-sm gap-2">
                    <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                    <span>Searching database...</span>
                  </div>
                ) : !hasSearchResults ? (
                  <div className="py-6 text-center text-sm text-slate-500">
                    <p className="font-semibold text-slate-700">No results found for &ldquo;{searchQuery}&rdquo;</p>
                    <p className="text-xs text-slate-400 mt-1">Try searching for AC, Electrician, Tap, Plumber, or Technician names.</p>
                  </div>
                ) : (
                  <>
                    {/* 1. Matching Services */}
                    {matchingServices.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 mb-2">
                          <span className="text-xs font-extrabold uppercase tracking-wider text-blue-600 flex items-center gap-1.5">
                            <Wrench className="h-3.5 w-3.5" />
                            Matching Services ({matchingServices.length})
                          </span>
                        </div>
                        <div className="space-y-1.5">
                          {matchingServices.slice(0, 5).map((svc) => (
                            <div
                              key={svc.id}
                              onClick={() => handleOpenGuestServiceDetails(svc)}
                              className="group flex items-center justify-between p-2.5 rounded-xl hover:bg-blue-50/80 cursor-pointer transition border border-transparent hover:border-blue-100"
                            >
                              <div className="min-w-0 pr-3">
                                <p className="text-sm font-bold text-slate-900 group-hover:text-blue-600 truncate">
                                  {svc.name}
                                </p>
                                <p className="text-xs text-slate-500 truncate">
                                  {svc.categoryName || 'Service'} &bull; ~{svc.estimatedDurationMinutes} mins
                                </p>
                              </div>
                              <div className="text-right shrink-0">
                                <span className="font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg text-xs">
                                  &#8377;{svc.basePrice}
                                </span>
                                <span className="block text-[10px] text-blue-600 font-semibold mt-0.5 group-hover:underline">
                                  View Details &rarr;
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 2. Matching Categories */}
                    {matchingCategories.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 mb-2">
                          <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-600 flex items-center gap-1.5">
                            <Sparkles className="h-3.5 w-3.5" />
                            Matching Categories ({matchingCategories.length})
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {matchingCategories.map((cat) => (
                            <button
                              key={cat.id}
                              onClick={() => {
                                setIsSearchOpen(false)
                                handleProceedToBooking({ categoryId: cat.id })
                              }}
                              className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200/80 hover:border-indigo-400 hover:bg-indigo-50/60 text-left transition"
                            >
                              <div>
                                <p className="text-xs font-bold text-slate-900">{cat.name}</p>
                                <p className="text-[11px] text-slate-500 line-clamp-1">{cat.description}</p>
                              </div>
                              <ArrowRight className="h-3.5 w-3.5 text-indigo-500 shrink-0 ml-2" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 3. Matching Providers */}
                    {matchingProviders.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 mb-2">
                          <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
                            <BadgeCheck className="h-3.5 w-3.5 text-emerald-600" />
                            Available Service Providers ({matchingProviders.length})
                          </span>
                        </div>
                        <div className="space-y-1.5">
                          {matchingProviders.slice(0, 4).map((prov) => (
                            <div
                              key={prov.id}
                              onClick={() => handleOpenGuestProviderDetails(prov)}
                              className="group flex items-center justify-between p-2.5 rounded-xl hover:bg-emerald-50/60 cursor-pointer transition border border-transparent hover:border-emerald-100"
                            >
                              <div className="flex items-center gap-2.5 min-w-0 pr-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-extrabold text-xs">
                                  {prov.name.substring(0, 2).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <p className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 truncate">
                                      {prov.name}
                                    </p>
                                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">
                                      Verified
                                    </span>
                                  </div>
                                  <p className="text-xs text-slate-500 truncate">
                                    {prov.specialization || prov.city} &bull; {prov.experienceYears}+ yrs exp
                                  </p>
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                                  {prov.ratingAverage?.toFixed(1) || '4.9'}
                                </span>
                                <span className="block text-[10px] text-emerald-600 font-semibold mt-0.5 group-hover:underline">
                                  Profile &rarr;
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Quick Category Chips */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500">
            <span className="font-semibold text-slate-700">Popular:</span>
            {['AC Service', 'Electrician', 'Plumber', 'Sofa Clean', 'Washing Machine'].map((chip) => (
              <button
                key={chip}
                onClick={() => {
                  setSearchQuery(chip)
                  setIsSearchOpen(true)
                }}
                className="rounded-lg bg-white/90 border border-slate-200 px-2.5 py-1 font-medium hover:border-blue-400 hover:text-blue-600 transition-colors"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Trust Highlights */}
          <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white/90 p-3.5 shadow-sm">
              <ShieldCheck className="h-6 w-6 text-emerald-600 shrink-0" />
              <div className="text-left">
                <div className="text-xs font-bold text-slate-900">100% Verified Pros</div>
                <div className="text-[11px] text-slate-500">Background checked</div>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white/90 p-3.5 shadow-sm">
              <Clock className="h-6 w-6 text-blue-600 shrink-0" />
              <div className="text-left">
                <div className="text-xs font-bold text-slate-900">30-Min Response</div>
                <div className="text-[11px] text-slate-500">On-demand arrival</div>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white/90 p-3.5 shadow-sm">
              <CreditCard className="h-6 w-6 text-purple-600 shrink-0" />
              <div className="text-left">
                <div className="text-xs font-bold text-slate-900">Upfront Pricing</div>
                <div className="text-[11px] text-slate-500">No hidden charges</div>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white/90 p-3.5 shadow-sm">
              <Star className="h-6 w-6 text-amber-500 shrink-0" />
              <div className="text-left">
                <div className="text-xs font-bold text-slate-900">4.9/5 Average Rating</div>
                <div className="text-[11px] text-slate-500">25,000+ bookings</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. Service Categories Grid ─────────────────────────────── */}
      <section id="services" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-xs font-bold tracking-widest text-blue-600 uppercase">Our Services</h2>
          <p className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Choose What You Need Fixed
          </p>
          <p className="mx-auto mt-3 max-w-xl text-sm text-slate-600">
            Book professional certified technicians for home repairs, maintenance, and deep cleaning.
          </p>
        </div>

        {dataError && (
          <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 text-center max-w-xl mx-auto">
            {dataError}
          </div>
        )}

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {(categories.length > 0 ? categories : FALLBACK_CATEGORIES).map((cat: any) => {
            const style = CATEGORY_STYLE_MAP[cat.name] || {
              icon: Wrench,
              color: 'text-blue-600',
              bgLight: 'bg-blue-50 border-blue-200/60 hover:border-blue-300'
            }
            const Icon = style.icon
            const startPrice = cat.services && cat.services.length > 0
              ? Math.min(...cat.services.map((s: any) => s.basePrice))
              : cat.startingPrice || 249

            const firstService = cat.services && cat.services[0]

            return (
              <div
                key={cat.id}
                className={`group relative flex flex-col justify-between rounded-2xl border p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-xl ${style.bgLight}`}
              >
                {style.badge && (
                  <span className="absolute -top-3 right-4 rounded-full bg-blue-600 px-3 py-0.5 text-[11px] font-bold text-white shadow-sm">
                    {style.badge}
                  </span>
                )}

                <div>
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-md group-hover:scale-110 transition-transform ${style.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>

                  <h3 className="mt-5 text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                    {cat.name}
                  </h3>
                  <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                    {cat.description}
                  </p>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-slate-200/60 pt-4">
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-slate-400">Starts at</span>
                    <div className="text-base font-extrabold text-slate-900">&#8377;{startPrice}</div>
                  </div>

                  <div className="flex items-center gap-2">
                    {firstService && (
                      <button
                        onClick={() => handleOpenGuestServiceDetails(firstService)}
                        className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-2 py-1"
                      >
                        Details
                      </button>
                    )}
                    <button
                      onClick={() => handleProceedToBooking({ categoryId: cat.id, serviceId: firstService?.id })}
                      className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 group-hover:text-blue-700 group-hover:translate-x-0.5 transition-all cursor-pointer"
                    >
                      <span>Book Now</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── Public Service / Provider Details Modal (Guest Friendly) ───────────────────────── */}
      {guestModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl space-y-6">
            <button
              onClick={() => setGuestModalItem(null)}
              className="absolute right-5 top-5 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
            >
              <X className="h-5 w-5" />
            </button>

            {guestModalItem.type === 'SERVICE' && guestModalItem.service && (
              <div className="space-y-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
                    <Wrench className="h-6 w-6" />
                  </div>
                  <div>
                    <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold text-blue-700 border border-blue-200">
                      {guestModalItem.categoryName || 'Service Package'}
                    </span>
                    <h3 className="text-xl font-extrabold text-slate-900 mt-1">
                      {guestModalItem.service.name}
                    </h3>
                  </div>
                </div>

                <p className="text-sm text-slate-600 leading-relaxed">
                  {guestModalItem.service.description}
                </p>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-xl bg-slate-50 p-3 border border-slate-200">
                    <span className="text-slate-400 block font-semibold">Fixed Base Rate</span>
                    <span className="text-lg font-black text-emerald-600">
                      &#8377;{guestModalItem.service.basePrice}
                    </span>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3 border border-slate-200">
                    <span className="text-slate-400 block font-semibold">Estimated Time</span>
                    <span className="text-sm font-bold text-slate-800 flex items-center gap-1 mt-1">
                      <Clock className="h-3.5 w-3.5 text-slate-500" />
                      ~{guestModalItem.service.estimatedDurationMinutes} Minutes
                    </span>
                  </div>
                </div>

                <div className="rounded-xl bg-emerald-50/70 border border-emerald-200 p-3.5 text-xs text-emerald-900 space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-emerald-800">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>FixMate Service Guarantee Included</span>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    Includes diagnostic inspection, certified tools, post-service cleanup, and 30-day warranty coverage.
                  </p>
                </div>

                {!isAuthenticated && (
                  <div className="flex items-center gap-2 rounded-xl bg-amber-50 p-3 text-xs text-amber-800 border border-amber-200">
                    <Lock className="h-4 w-4 text-amber-600 shrink-0" />
                    <span>
                      You are currently browsing as guest. You will be redirected to sign in before confirming your booking.
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => setGuestModalItem(null)}
                    className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      const svc = guestModalItem.service!
                      setGuestModalItem(null)
                      handleProceedToBooking({ serviceId: svc.id, categoryId: svc.categoryId })
                    }}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-blue-700 transition"
                  >
                    <span>{isAuthenticated ? 'Book Service Now' : 'Login to Book Service'}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}

            {guestModalItem.type === 'PROVIDER' && guestModalItem.provider && (
              <div className="space-y-5">
                <div className="flex items-start gap-3.5">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-extrabold text-lg shadow-md">
                    {guestModalItem.provider.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-extrabold text-slate-900">
                        {guestModalItem.provider.name}
                      </h3>
                      <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-extrabold text-emerald-800">
                        100% Verified
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {guestModalItem.provider.specialization} &bull; {guestModalItem.provider.city}, Gujarat
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-200">
                    <span className="text-amber-500 font-bold flex items-center justify-center gap-1">
                      <Star className="h-3.5 w-3.5 fill-amber-400" />
                      {guestModalItem.provider.ratingAverage?.toFixed(1) || '4.9'}
                    </span>
                    <span className="text-[10px] text-slate-400">Rating ({guestModalItem.provider.ratingCount || 50}+)</span>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-200">
                    <span className="font-extrabold text-slate-900">{guestModalItem.provider.experienceYears}+ Yrs</span>
                    <span className="text-[10px] text-slate-400">Experience</span>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-200">
                    <span className="font-extrabold text-emerald-600">Available</span>
                    <span className="text-[10px] text-slate-400">{guestModalItem.provider.serviceRadiusKm || 15} km Radius</span>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-900 mb-1">About the Specialist</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {guestModalItem.provider.bio}
                  </p>
                </div>

                {guestModalItem.provider.skills && guestModalItem.provider.skills.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 mb-1.5">Specialized Skills</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {guestModalItem.provider.skills.map((skill, idx) => (
                        <span
                          key={idx}
                          className="rounded-lg bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700 border border-blue-200/60"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {!isAuthenticated && (
                  <div className="flex items-center gap-2 rounded-xl bg-amber-50 p-3 text-xs text-amber-800 border border-amber-200">
                    <Lock className="h-4 w-4 text-amber-600 shrink-0" />
                    <span>
                      Public profile. You will be redirected to sign in to schedule service with this specialist.
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => setGuestModalItem(null)}
                    className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      const prov = guestModalItem.provider!
                      setGuestModalItem(null)
                      handleProceedToBooking({ providerId: prov.id, categoryId: prov.categoryId })
                    }}
                    className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-indigo-700 transition"
                  >
                    <span>{isAuthenticated ? 'Book This Specialist' : 'Login to Book Specialist'}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── 3. How FixMate Works (Timeline Workflow) ───────────────── */}
      <section id="how-it-works" className="bg-slate-900 py-16 sm:py-24 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <span className="rounded-full bg-blue-500/10 px-3.5 py-1 text-xs font-semibold text-blue-400 border border-blue-500/20">
              Seamless 4-Step Experience
            </span>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
              How FixMate Works
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-slate-400">
              From problem reporting to live tracking and contactless payment in 4 simple steps.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-4 relative">
            {/* Step 1 */}
            <div className="relative rounded-2xl bg-slate-800/80 border border-slate-700/60 p-6 flex flex-col items-center text-center hover:border-blue-500/50 transition-colors">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white font-black text-lg shadow-lg shadow-blue-500/30">
                1
              </div>
              <h3 className="mt-5 text-base font-bold text-white">Select Service & Upload</h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Choose category, specify preferred date/time slot, and attach photos or videos of the issue.
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative rounded-2xl bg-slate-800/80 border border-slate-700/60 p-6 flex flex-col items-center text-center hover:border-blue-500/50 transition-colors">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white font-black text-lg shadow-lg shadow-indigo-500/30">
                2
              </div>
              <h3 className="mt-5 text-base font-bold text-white">Verified Pro Assigned</h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Our smart dispatch assigns a certified nearby technician with complete ID & rating details.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative rounded-2xl bg-slate-800/80 border border-slate-700/60 p-6 flex flex-col items-center text-center hover:border-blue-500/50 transition-colors">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-600 text-white font-black text-lg shadow-lg shadow-purple-500/30">
                3
              </div>
              <h3 className="mt-5 text-base font-bold text-white">Live SignalR Tracking</h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Watch real-time status updates: Provider On The Way &rarr; Work In Progress &rarr; Job Completed.
              </p>
            </div>

            {/* Step 4 */}
            <div className="relative rounded-2xl bg-slate-800/80 border border-slate-700/60 p-6 flex flex-col items-center text-center hover:border-blue-500/50 transition-colors">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-white font-black text-lg shadow-lg shadow-emerald-500/30">
                4
              </div>
              <h3 className="mt-5 text-base font-bold text-white">Razorpay & 30-Day Cover</h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Pay online or cash upon satisfaction. Get instant invoice and 30-day rework warranty.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. Smart Appliance Service History Highlight ──────────── */}
      <section id="smart-history" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-3xl bg-gradient-to-tr from-blue-900 via-indigo-900 to-slate-900 p-8 sm:p-14 text-white shadow-2xl">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/20 px-3.5 py-1 text-xs font-semibold text-blue-300 border border-blue-400/30">
                <Cpu className="h-4 w-4" />
                <span>FixMate Exclusive Innovation</span>
              </div>
              <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
                Smart Appliance Tracker & Maintenance Reminders
              </h2>
              <p className="mt-4 text-sm text-slate-300 leading-relaxed">
                Never lose track of your AC gas refills, RO filter replacements, or refrigerator maintenance. Register your appliances on FixMate to keep an automated service log.
              </p>

              <div className="mt-8 space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-white">Digital Maintenance Passport</h4>
                    <p className="text-xs text-slate-400">Complete record of service dates, parts replaced, technician names, and invoices.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-white">Automated Next-Service Alarms</h4>
                    <p className="text-xs text-slate-400">Background reminder engine alerts you before summer starts or when filters expire.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-white">Higher Resale Value</h4>
                    <p className="text-xs text-slate-400">Export verified maintenance history whenever you sell or upgrade your home appliances.</p>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/30 hover:bg-blue-600 transition-all"
                >
                  <span>Register Your Appliances</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* Interactive Preview Card */}
            <div className="rounded-2xl border border-slate-700 bg-slate-800/90 p-6 shadow-xl backdrop-blur-sm">
              <div className="flex items-center justify-between border-b border-slate-700 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                    <Wind className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">Living Room AC (1.5 Ton)</div>
                    <div className="text-xs text-slate-400">Daikin Inverter Split &bull; Serial: DK-9821</div>
                  </div>
                </div>
                <span className="rounded-full bg-emerald-500/20 px-2.5 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/30">
                  Healthy
                </span>
              </div>

              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between rounded-xl bg-slate-900/60 p-3 text-xs">
                  <span className="text-slate-400">Last Service Date:</span>
                  <span className="font-semibold text-white">15 Mar 2026 (Deep Foam Clean)</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-slate-900/60 p-3 text-xs">
                  <span className="text-slate-400">Verified Technician:</span>
                  <span className="font-semibold text-blue-400">Rajesh Verma (4.95 ★)</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 text-xs">
                  <div className="flex items-center gap-2 text-amber-400">
                    <BellRing className="h-4 w-4" />
                    <span>Next Due: 15 Oct 2026 (Winter Prep)</span>
                  </div>
                  <span className="font-bold text-amber-300">In 15 Days</span>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => navigate('/register')}
                  className="w-full rounded-xl bg-blue-600 py-2.5 text-center text-xs font-bold text-white hover:bg-blue-700 transition-colors"
                >
                  Book 1-Click Service
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. Customer Testimonials ──────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-xs font-bold tracking-widest text-blue-600 uppercase">Customer Reviews</h2>
          <p className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Loved by Over 25,000+ Happy Households
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((t, idx) => (
            <div key={idx} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between hover:shadow-lg transition-shadow">
              <div>
                <div className="flex gap-1 text-amber-400">
                  {[...Array(t.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400" />
                  ))}
                </div>
                <p className="mt-4 text-sm text-slate-700 italic leading-relaxed">
                  &ldquo;{t.comment}&rdquo;
                </p>
              </div>

              <div className="mt-6 border-t border-slate-100 pt-4 flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-slate-900">{t.name}</div>
                  <div className="text-xs text-slate-500">{t.city} &bull; {t.role}</div>
                </div>
                <span className="rounded-lg bg-blue-50 px-2 py-1 text-[11px] font-semibold text-blue-700">
                  {t.service}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 6. Provider Recruitment Banner ────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 p-8 sm:p-12 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-xl">
            <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white">
              For Technicians & Service Pros
            </span>
            <h3 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">
              Grow Your Business With FixMate
            </h3>
            <p className="mt-2 text-sm text-blue-100 leading-relaxed">
              Earn &#8377;40,000+ monthly with guaranteed daily bookings in your city. Direct weekly payouts, flexible hours, and full insurance coverage.
            </p>
          </div>
          <Link
            to="/register/provider"
            className="rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-blue-700 shadow-lg hover:bg-blue-50 transition-all shrink-0 hover:scale-105"
          >
            Join as Service Partner &rarr;
          </Link>
        </div>
      </section>

      {/* ── 7. FAQ Accordion ───────────────────────────────────────── */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-xs font-bold tracking-widest text-blue-600 uppercase">Frequently Asked Questions</h2>
          <p className="mt-2 text-2xl font-extrabold text-slate-900 sm:text-3xl">
            Got Questions? We&apos;ve Got Answers.
          </p>
        </div>

        <div className="mt-8 space-y-3">
          {FAQS.map((faq, i) => (
            <div key={i} className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="flex w-full items-center justify-between px-6 py-4 text-left text-sm font-bold text-slate-900 hover:bg-slate-50 transition-colors"
              >
                <span>{faq.q}</span>
                <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
              </button>
              {openFaq === i && (
                <div className="border-t border-slate-100 px-6 py-4 text-xs sm:text-sm text-slate-600 leading-relaxed bg-slate-50/50">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

