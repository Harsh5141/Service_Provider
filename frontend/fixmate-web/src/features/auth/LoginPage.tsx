import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Lock, Mail, Wrench, Shield, ArrowRight, UserCheck, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'

import { useAppDispatch } from '@/hooks/useAppDispatch'
import { useAppSelector } from '@/hooks/useAppSelector'
import { login, clearError } from './authSlice'

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginFormValues = z.infer<typeof loginSchema>

export default function LoginPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const { isLoading, error } = useAppSelector((state) => state.auth)

  const [showPassword, setShowPassword] = useState(false)

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname

  useEffect(() => {
    dispatch(clearError())
  }, [dispatch])

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = async (data: LoginFormValues) => {
    try {
      const result = await dispatch(login(data)).unwrap()
      toast.success(`Welcome back, ${result.user.name}!`)

      if (from) {
        navigate(from, { replace: true })
      } else if (result.user.role === 'Admin') {
        navigate('/admin', { replace: true })
      } else if (result.user.role === 'Provider') {
        navigate('/provider/dashboard', { replace: true })
      } else {
        navigate('/dashboard', { replace: true })
      }
    } catch (err: any) {
      toast.error(err || 'Failed to sign in. Please check your credentials.')
    }
  }

  const handleDemoLogin = (email: string) => {
    setValue('email', email)
    setValue('password', 'Password123!')
    onSubmit({ email, password: 'Password123!' })
  }

  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-slate-900/50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 shadow-lg shadow-sky-500/20 text-white mb-4">
          <Wrench className="w-7 h-7" />
        </div>
        <h2 className="text-3xl font-extrabold text-slate-100 tracking-tight">
          Welcome back to FixMate
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Sign in to your account or select a quick demo profile below
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-slate-800/90 backdrop-blur-xl border border-slate-700/80 shadow-2xl rounded-2xl p-6 sm:p-8 space-y-6">
          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-start space-x-3">
              <Shield className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  placeholder="name@example.com"
                  {...register('email')}
                  className={`w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border ${
                    errors.email ? 'border-red-500/80 focus:ring-red-500' : 'border-slate-700 focus:border-sky-500 focus:ring-sky-500'
                  } rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 transition`}
                />
              </div>
              {errors.email && (
                <p className="mt-1.5 text-xs text-red-400">{errors.email.message}</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Password
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  {...register('password')}
                  className={`w-full pl-10 pr-11 py-2.5 bg-slate-900/80 border ${
                    errors.password ? 'border-red-500/80 focus:ring-red-500' : 'border-slate-700 focus:border-sky-500 focus:ring-sky-500'
                  } rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 transition`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs text-red-400">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-medium shadow-lg shadow-sky-500/25 transition duration-150 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Logins Section */}
          <div className="pt-4 border-t border-slate-700/60">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>1-Click Demo Accounts</span>
              </div>
              <span className="text-[10px] text-slate-500 font-normal lowercase">pass: Password123!</span>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Customers & Admin</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleDemoLogin('john@fixmate.test')}
                  disabled={isLoading}
                  className="p-2 rounded-xl bg-slate-900/60 hover:bg-slate-700 border border-slate-700/80 text-left transition cursor-pointer"
                >
                  <div className="text-[11px] font-bold text-sky-400 flex items-center">
                    <UserCheck className="w-3 h-3 mr-1" />
                    Customer 1
                  </div>
                  <div className="text-[10px] text-slate-300 truncate mt-0.5">John Doe</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleDemoLogin('priya@fixmate.test')}
                  disabled={isLoading}
                  className="p-2 rounded-xl bg-slate-900/60 hover:bg-slate-700 border border-slate-700/80 text-left transition cursor-pointer"
                >
                  <div className="text-[11px] font-bold text-sky-400 flex items-center">
                    <UserCheck className="w-3 h-3 mr-1" />
                    Customer 2
                  </div>
                  <div className="text-[10px] text-slate-300 truncate mt-0.5">Priya Sharma</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleDemoLogin('admin@fixmate.test')}
                  disabled={isLoading}
                  className="p-2 rounded-xl bg-slate-900/60 hover:bg-slate-700 border border-slate-700/80 text-left transition cursor-pointer"
                >
                  <div className="text-[11px] font-bold text-purple-400 flex items-center">
                    <Shield className="w-3 h-3 mr-1" />
                    Admin
                  </div>
                  <div className="text-[10px] text-slate-300 truncate mt-0.5">FixMate Admin</div>
                </button>
              </div>

              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider pt-1">New Service Providers (10)</div>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleDemoLogin('aarav.provider@fixmate.test')}
                  disabled={isLoading}
                  className="p-2 rounded-xl bg-slate-900/60 hover:bg-slate-700 border border-slate-700/80 text-left transition cursor-pointer"
                >
                  <div className="text-[11px] font-bold text-amber-400 flex items-center">
                    <Wrench className="w-3 h-3 mr-1" />
                    Aarav (Electrical)
                  </div>
                  <div className="text-[10px] text-slate-400 truncate mt-0.5">aarav.provider@fixmate.test</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleDemoLogin('bhavin.provider@fixmate.test')}
                  disabled={isLoading}
                  className="p-2 rounded-xl bg-slate-900/60 hover:bg-slate-700 border border-slate-700/80 text-left transition cursor-pointer"
                >
                  <div className="text-[11px] font-bold text-cyan-400 flex items-center">
                    <Wrench className="w-3 h-3 mr-1" />
                    Bhavin (Plumbing)
                  </div>
                  <div className="text-[10px] text-slate-400 truncate mt-0.5">bhavin.provider@fixmate.test</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleDemoLogin('chetan.provider@fixmate.test')}
                  disabled={isLoading}
                  className="p-2 rounded-xl bg-slate-900/60 hover:bg-slate-700 border border-slate-700/80 text-left transition cursor-pointer"
                >
                  <div className="text-[11px] font-bold text-blue-400 flex items-center">
                    <Wrench className="w-3 h-3 mr-1" />
                    Chetan (AC Cooling)
                  </div>
                  <div className="text-[10px] text-slate-400 truncate mt-0.5">chetan.provider@fixmate.test</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleDemoLogin('deepak.provider@fixmate.test')}
                  disabled={isLoading}
                  className="p-2 rounded-xl bg-slate-900/60 hover:bg-slate-700 border border-slate-700/80 text-left transition cursor-pointer"
                >
                  <div className="text-[11px] font-bold text-indigo-400 flex items-center">
                    <Wrench className="w-3 h-3 mr-1" />
                    Deepak (Appliances)
                  </div>
                  <div className="text-[10px] text-slate-400 truncate mt-0.5">deepak.provider@fixmate.test</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleDemoLogin('eshwar.provider@fixmate.test')}
                  disabled={isLoading}
                  className="p-2 rounded-xl bg-slate-900/60 hover:bg-slate-700 border border-slate-700/80 text-left transition cursor-pointer"
                >
                  <div className="text-[11px] font-bold text-purple-400 flex items-center">
                    <Wrench className="w-3 h-3 mr-1" />
                    Eshwar (Deep Cleaning)
                  </div>
                  <div className="text-[10px] text-slate-400 truncate mt-0.5">eshwar.provider@fixmate.test</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleDemoLogin('farhan.provider@fixmate.test')}
                  disabled={isLoading}
                  className="p-2 rounded-xl bg-slate-900/60 hover:bg-slate-700 border border-slate-700/80 text-left transition cursor-pointer"
                >
                  <div className="text-[11px] font-bold text-orange-400 flex items-center">
                    <Wrench className="w-3 h-3 mr-1" />
                    Farhan (Carpentry)
                  </div>
                  <div className="text-[10px] text-slate-400 truncate mt-0.5">farhan.provider@fixmate.test</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleDemoLogin('girish.provider@fixmate.test')}
                  disabled={isLoading}
                  className="p-2 rounded-xl bg-slate-900/60 hover:bg-slate-700 border border-slate-700/80 text-left transition cursor-pointer"
                >
                  <div className="text-[11px] font-bold text-pink-400 flex items-center">
                    <Wrench className="w-3 h-3 mr-1" />
                    Girish (Painting)
                  </div>
                  <div className="text-[10px] text-slate-400 truncate mt-0.5">girish.provider@fixmate.test</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleDemoLogin('harish.provider@fixmate.test')}
                  disabled={isLoading}
                  className="p-2 rounded-xl bg-slate-900/60 hover:bg-slate-700 border border-slate-700/80 text-left transition cursor-pointer"
                >
                  <div className="text-[11px] font-bold text-red-400 flex items-center">
                    <Wrench className="w-3 h-3 mr-1" />
                    Harish (Pest Control)
                  </div>
                  <div className="text-[10px] text-slate-400 truncate mt-0.5">harish.provider@fixmate.test</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleDemoLogin('ishaan.provider@fixmate.test')}
                  disabled={isLoading}
                  className="p-2 rounded-xl bg-slate-900/60 hover:bg-slate-700 border border-slate-700/80 text-left transition cursor-pointer"
                >
                  <div className="text-[11px] font-bold text-teal-400 flex items-center">
                    <Wrench className="w-3 h-3 mr-1" />
                    Ishaan (RO & Geyser)
                  </div>
                  <div className="text-[10px] text-slate-400 truncate mt-0.5">ishaan.provider@fixmate.test</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleDemoLogin('jatin.provider@fixmate.test')}
                  disabled={isLoading}
                  className="p-2 rounded-xl bg-slate-900/60 hover:bg-slate-700 border border-slate-700/80 text-left transition cursor-pointer"
                >
                  <div className="text-[11px] font-bold text-emerald-400 flex items-center">
                    <Wrench className="w-3 h-3 mr-1" />
                    Jatin (Smart Home/CCTV)
                  </div>
                  <div className="text-[10px] text-slate-400 truncate mt-0.5">jatin.provider@fixmate.test</div>
                </button>
              </div>
            </div>
          </div>

          <div className="pt-2 text-center text-sm text-slate-400">
            Don't have an account?{' '}
            <Link to="/register" className="text-sky-400 hover:text-sky-300 font-medium transition">
              Sign up as Customer
            </Link>
            <div className="mt-2 text-xs">
              Are you a technician?{' '}
              <Link to="/register/provider" className="text-indigo-400 hover:text-indigo-300 font-medium transition">
                Join as Service Provider &rarr;
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
