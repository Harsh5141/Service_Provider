import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Zap,
  Droplet,
  Wind,
  Sparkles,
  Tv,
  Wifi,
  Car,
  Paintbrush,
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
  ChevronDown
} from 'lucide-react'

interface ServiceCategoryCard {
  id: string
  name: string
  tagline: string
  icon: any
  startingPrice: number
  color: string
  bgLight: string
  badge?: string
}

const CATEGORIES: ServiceCategoryCard[] = [
  {
    id: 'ac-repair',
    name: 'AC Repair & Service',
    tagline: 'Deep foam cleaning, gas top-up, wiring fix',
    icon: Wind,
    startingPrice: 499,
    color: 'text-cyan-600',
    bgLight: 'bg-cyan-50 border-cyan-200/60 hover:border-cyan-300',
    badge: 'Most Popular'
  },
  {
    id: 'electrical',
    name: 'Electrician & Wiring',
    tagline: 'Switchboards, MCB repair, fan install',
    icon: Zap,
    startingPrice: 199,
    color: 'text-amber-600',
    bgLight: 'bg-amber-50 border-amber-200/60 hover:border-amber-300'
  },
  {
    id: 'plumbing',
    name: 'Plumbing & Pipe Leakage',
    tagline: 'Tap repair, pipeline blockage, motor check',
    icon: Droplet,
    startingPrice: 249,
    color: 'text-blue-600',
    bgLight: 'bg-blue-50 border-blue-200/60 hover:border-blue-300'
  },
  {
    id: 'cleaning',
    name: 'Home Deep Cleaning',
    tagline: 'Kitchen, bathroom, sofa & carpet shampooing',
    icon: Sparkles,
    startingPrice: 799,
    color: 'text-emerald-600',
    bgLight: 'bg-emerald-50 border-emerald-200/60 hover:border-emerald-300',
    badge: '30% Off'
  },
  {
    id: 'appliances',
    name: 'Appliance Repair',
    tagline: 'Washing machine, refrigerator, microwave, RO',
    icon: Tv,
    startingPrice: 349,
    color: 'text-indigo-600',
    bgLight: 'bg-indigo-50 border-indigo-200/60 hover:border-indigo-300'
  },
  {
    id: 'internet',
    name: 'Internet & Networking',
    tagline: 'Wi-Fi mesh setup, router config, LAN wiring',
    icon: Wifi,
    startingPrice: 299,
    color: 'text-purple-600',
    bgLight: 'bg-purple-50 border-purple-200/60 hover:border-purple-300'
  },
  {
    id: 'painting',
    name: 'Painting & Waterproofing',
    tagline: 'Interior wall paint, damp proofing, touch-ups',
    icon: Paintbrush,
    startingPrice: 999,
    color: 'text-rose-600',
    bgLight: 'bg-rose-50 border-rose-200/60 hover:border-rose-300'
  },
  {
    id: 'vehicle',
    name: 'Doorstep Vehicle Care',
    tagline: 'Bike general service, car wash & battery jump',
    icon: Car,
    startingPrice: 449,
    color: 'text-orange-600',
    bgLight: 'bg-orange-50 border-orange-200/60 hover:border-orange-300'
  }
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
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  const navigate = useNavigate()

  const filteredCategories = CATEGORIES.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.tagline.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    navigate(`/register?search=${encodeURIComponent(searchQuery)}`)
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

          {/* Search Bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="mx-auto mt-8 flex max-w-2xl items-center rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-blue-900/5 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all"
          >
            <div className="flex items-center pl-3 text-slate-400">
              <Search className="h-5 w-5" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for 'AC service', 'Tap leakage', 'Deep cleaning'..."
              className="w-full border-0 bg-transparent px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0 sm:text-base"
            />
            <button
              type="submit"
              className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-blue-600/30 hover:bg-blue-700 transition-all flex items-center gap-1.5 shrink-0"
            >
              <span>Search</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          {/* Quick Category Chips */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500">
            <span className="font-semibold text-slate-700">Popular:</span>
            {['AC Service', 'Electrician', 'Plumber', 'Sofa Clean', 'Washing Machine'].map((chip) => (
              <button
                key={chip}
                onClick={() => setSearchQuery(chip)}
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

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {filteredCategories.map((cat) => {
            const Icon = cat.icon
            return (
              <div
                key={cat.id}
                className={`group relative flex flex-col justify-between rounded-2xl border p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-xl ${cat.bgLight}`}
              >
                {cat.badge && (
                  <span className="absolute -top-3 right-4 rounded-full bg-blue-600 px-3 py-0.5 text-[11px] font-bold text-white shadow-sm">
                    {cat.badge}
                  </span>
                )}

                <div>
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-md group-hover:scale-110 transition-transform ${cat.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>

                  <h3 className="mt-5 text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                    {cat.name}
                  </h3>
                  <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                    {cat.tagline}
                  </p>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-slate-200/60 pt-4">
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-slate-400">Starts at</span>
                    <div className="text-base font-extrabold text-slate-900">&#8377;{cat.startingPrice}</div>
                  </div>
                  <Link
                    to="/register"
                    className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 group-hover:text-blue-700 group-hover:translate-x-0.5 transition-all"
                  >
                    <span>Book Now</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      </section>

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

