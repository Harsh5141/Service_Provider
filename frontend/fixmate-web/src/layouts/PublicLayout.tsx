import { useState } from 'react'
import { Link, Outlet, useNavigate } from 'react-router-dom'
import { Wrench, Shield, Menu, X, ArrowRight, PhoneCall, Sparkles, User, LogIn } from 'lucide-react'
import { useAppSelector } from '@/hooks/useAppSelector'

export default function PublicLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { isAuthenticated, user } = useAppSelector((s) => s.auth)
  const navigate = useNavigate()

  const getDashboardPath = () => {
    if (!user) return '/dashboard'
    if (user.role === 'Admin') return '/admin'
    if (user.role === 'Provider') return '/provider/dashboard'
    return '/dashboard'
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 selection:bg-blue-600 selection:text-white">
      {/* ── Top Announcement Banner ────────────────────────────────── */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700 px-4 py-2 text-center text-xs font-medium text-white shadow-inner sm:text-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-center gap-2">
          <Sparkles className="h-4 w-4 animate-pulse text-amber-300" />
          <span>Need urgent repair? Verified experts available at your doorstep in 30 minutes.</span>
          <Link
            to="/register"
            className="ml-2 hidden underline decoration-amber-300 decoration-2 underline-offset-2 hover:text-amber-200 sm:inline"
          >
            Book your first service &rarr;
          </Link>
        </div>
      </div>

      {/* ── Navigation Header ──────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-md transition-all">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <Wrench className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tight text-slate-900">
                Fix<span className="text-blue-600">Mate</span>
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Smart Home Services
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#services" className="hover:text-blue-600 transition-colors">
              Services
            </a>
            <a href="#how-it-works" className="hover:text-blue-600 transition-colors">
              How It Works
            </a>
            <a href="#smart-history" className="hover:text-blue-600 transition-colors">
              Appliance Tracker
            </a>
            <a href="#guarantee" className="hover:text-blue-600 transition-colors">
              Guarantee
            </a>
            <Link to="/register/provider" className="text-indigo-600 hover:text-indigo-700 font-semibold transition-colors flex items-center gap-1">
              Become a Pro Partner
            </Link>
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <button
                onClick={() => navigate(getDashboardPath())}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700 transition-all hover:shadow-lg"
              >
                <User className="h-4 w-4" />
                Go to Dashboard
              </button>
            ) : (
              <>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <LogIn className="h-4 w-4 text-slate-500" />
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700 transition-all hover:shadow-lg hover:shadow-blue-600/30"
                >
                  Book Service
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 focus:outline-none"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="border-b border-slate-200 bg-white px-4 pt-2 pb-6 md:hidden animate-fade-in shadow-xl">
            <nav className="flex flex-col gap-3 font-medium text-slate-700">
              <a
                href="#services"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg px-3 py-2 hover:bg-slate-50"
              >
                Services
              </a>
              <a
                href="#how-it-works"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg px-3 py-2 hover:bg-slate-50"
              >
                How It Works
              </a>
              <a
                href="#smart-history"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg px-3 py-2 hover:bg-slate-50"
              >
                Appliance Tracker
              </a>
              <Link
                to="/register/provider"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg px-3 py-2 text-indigo-600 font-semibold hover:bg-indigo-50"
              >
                Become a Pro Partner
              </Link>
              <div className="my-2 border-t border-slate-100" />
              {isAuthenticated ? (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false)
                    navigate(getDashboardPath())
                  }}
                  className="w-full rounded-xl bg-blue-600 px-4 py-2.5 text-center text-sm font-semibold text-white"
                >
                  Go to Dashboard
                </button>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-xl border border-slate-200 px-4 py-2.5 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-xl bg-blue-600 px-4 py-2.5 text-center text-sm font-semibold text-white shadow-md shadow-blue-600/20"
                  >
                    Book Service Now
                  </Link>
                </div>
              )}
            </nav>
          </div>
        )}
      </header>

      {/* ── Page Content ───────────────────────────────────────────── */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-200 bg-slate-900 text-slate-300">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-5">
            {/* Brand column */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-500/30">
                  <Wrench className="h-5 w-5" />
                </div>
                <span className="text-2xl font-black tracking-tight text-white">
                  Fix<span className="text-blue-500">Mate</span>
                </span>
              </div>
              <p className="mt-4 max-w-sm text-sm text-slate-400 leading-relaxed">
                FixMate is India&apos;s premier on-demand smart home service platform. Connect with background-checked electricians, plumbers, AC mechanics, and cleaners with guaranteed satisfaction.
              </p>
              <div className="mt-6 flex items-center gap-3 text-xs text-slate-400">
                <Shield className="h-4 w-4 text-emerald-400" />
                <span>100% Verified Providers &bull; 30-Day Re-work Guarantee</span>
              </div>
            </div>

            {/* Popular Services */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-white">Top Services</h3>
              <ul className="mt-4 space-y-2.5 text-sm">
                <li><a href="#services" className="hover:text-white transition-colors">AC Repair & Gas Refill</a></li>
                <li><a href="#services" className="hover:text-white transition-colors">Electrician & Wiring</a></li>
                <li><a href="#services" className="hover:text-white transition-colors">Plumbing & Leakages</a></li>
                <li><a href="#services" className="hover:text-white transition-colors">Full Home Deep Clean</a></li>
                <li><a href="#services" className="hover:text-white transition-colors">Washing Machine Repair</a></li>
              </ul>
            </div>

            {/* Platform */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-white">Platform</h3>
              <ul className="mt-4 space-y-2.5 text-sm">
                <li><a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a></li>
                <li><a href="#smart-history" className="hover:text-white transition-colors">Appliance Tracker</a></li>
                <li><Link to="/register/provider" className="hover:text-white transition-colors">Join as Provider</Link></li>
                <li><Link to="/login" className="hover:text-white transition-colors">Customer Portal</Link></li>
                <li><Link to="/login" className="hover:text-white transition-colors">Admin Dashboard</Link></li>
              </ul>
            </div>

            {/* Help & Contact */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-white">Support</h3>
              <ul className="mt-4 space-y-2.5 text-sm">
                <li className="flex items-center gap-2">
                  <PhoneCall className="h-4 w-4 text-blue-400" />
                  <span>1800-FIX-MATE (Toll Free)</span>
                </li>
                <li><span>support@fixmate.in</span></li>
                <li><span>Available 24/7 for Emergencies</span></li>
                <li className="pt-2">
                  <span className="inline-block rounded-full bg-emerald-950 px-2.5 py-1 text-xs font-medium text-emerald-400 border border-emerald-800">
                    System Operational &bull; 99.9% Uptime
                  </span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 border-t border-slate-800 pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
            <p>&copy; {new Date().getFullYear()} FixMate Platform Inc. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-slate-400">Privacy Policy</a>
              <a href="#" className="hover:text-slate-400">Terms of Service</a>
              <a href="#" className="hover:text-slate-400">Trust & Safety</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

