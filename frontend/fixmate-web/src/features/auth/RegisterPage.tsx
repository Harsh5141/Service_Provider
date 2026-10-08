import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Lock, Mail, Phone, User, ShieldCheck, ArrowRight, UserPlus, MapPin, Building, Navigation, Loader2, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'

import { useAppDispatch } from '@/hooks/useAppDispatch'
import { useAppSelector } from '@/hooks/useAppSelector'
import { register as registerAction } from './authSlice'
import { INDIAN_STATES, lookupPinCode } from '@/lib/locationConstants'

const registerSchema = z
  .object({
    name: z.string().min(2, 'Full name must be at least 2 characters'),
    email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
    phone: z
      .string()
      .min(10, 'Phone number must be at least 10 digits')
      .regex(/^[+]?[0-9\s\-()]{10,15}$/, 'Please enter a valid phone number format (e.g. +91 98765 43210)'),
    password: z
      .string()
      .min(6, 'Password must be at least 6 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    // Service Location Section
    address: z.string().min(3, 'Address is required'),
    state: z.string().min(1, 'State is required'),
    postalCode: z
      .string()
      .min(6, 'PIN Code must be 6 digits')
      .regex(/^[1-9][0-9]{5}$/, 'Enter a valid 6-digit PIN Code'),
    city: z.string().min(1, 'City is required (Auto-detected from PIN)'),
    isDefaultAddress: z.boolean().default(true),
    terms: z.literal(true, {
      errorMap: () => ({ message: 'You must accept the terms and privacy policy' }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

type RegisterFormValues = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { isLoading, error } = useAppSelector((state) => state.auth)

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLookingUpPin, setIsLookingUpPin] = useState(false)
  const [pinErrorMessage, setPinErrorMessage] = useState<string | null>(null)
  const [isPinValid, setIsPinValid] = useState<boolean | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      address: '',
      state: 'Gujarat',
      postalCode: '',
      city: '',
      isDefaultAddress: true,
    },
  })

  const selectedState = watch('state')
  const enteredPin = watch('postalCode')
  const detectedCity = watch('city')

  const handlePinChange = async (rawVal: string, targetState?: string) => {
    const clean = rawVal.replace(/\D/g, '').slice(0, 6)
    setValue('postalCode', clean, { shouldValidate: true })

    const activeState = targetState !== undefined ? targetState : selectedState

    if (!clean) {
      setValue('city', '')
      setIsPinValid(null)
      setPinErrorMessage(null)
      return
    }

    if (clean.length < 6) {
      setValue('city', '')
      setIsPinValid(false)
      setPinErrorMessage('Enter a valid 6-digit PIN Code')
      return
    }

    if (!activeState) {
      setValue('city', '')
      setIsPinValid(false)
      setPinErrorMessage('Please select a State first')
      return
    }

    setIsLookingUpPin(true)
    setPinErrorMessage(null)

    try {
      const res = await lookupPinCode(clean, activeState)
      if (res.isValid && res.city) {
        setValue('city', res.city, { shouldValidate: true })
        setIsPinValid(true)
        setPinErrorMessage(null)
      } else {
        setValue('city', '')
        setIsPinValid(false)
        setPinErrorMessage(res.errorMessage || 'PIN Code does not belong to the selected State')
      }
    } catch {
      setValue('city', '')
      setIsPinValid(false)
      setPinErrorMessage('PIN Code does not belong to the selected State')
    } finally {
      setIsLookingUpPin(false)
    }
  }

  const handleStateChange = (newState: string) => {
    setValue('state', newState, { shouldValidate: true })
    if (enteredPin && enteredPin.length === 6) {
      handlePinChange(enteredPin, newState)
    } else if (enteredPin) {
      setValue('city', '')
    }
  }

  const onSubmit = async (data: RegisterFormValues) => {
    if (pinErrorMessage || !isPinValid || !data.city) {
      toast.error(pinErrorMessage || 'Please enter a valid PIN Code matching your selected State')
      return
    }

    try {
      const result = await dispatch(
        registerAction({
          name: data.name,
          email: data.email,
          phone: data.phone,
          password: data.password,
          address: data.address,
          city: data.city,
          state: data.state,
          postalCode: data.postalCode,
          isDefaultAddress: data.isDefaultAddress,
        }),
      ).unwrap()
      toast.success(`Account created successfully! Welcome, ${result.user.name}!`)
      navigate('/dashboard', { replace: true })
    } catch (err: any) {
      toast.error(err || 'Registration failed. Please try again.')
    }
  }

  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-slate-900/50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 shadow-lg shadow-sky-500/20 text-white mb-4">
          <UserPlus className="w-7 h-7" />
        </div>
        <h2 className="text-3xl font-extrabold text-slate-100 tracking-tight">
          Create your account
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Join FixMate to book verified home technicians in minutes
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-slate-800/90 backdrop-blur-xl border border-slate-700/80 shadow-2xl rounded-2xl p-6 sm:p-8 space-y-6">
          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-start space-x-3">
              <ShieldCheck className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Full Name *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  placeholder="e.g. Priya Sharma"
                  {...register('name')}
                  className={`w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border ${
                    errors.name ? 'border-red-500/80 focus:ring-red-500' : 'border-slate-700 focus:border-sky-500 focus:ring-sky-500'
                  } rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 transition`}
                />
              </div>
              {errors.name && (
                <p className="mt-1.5 text-xs text-red-400">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Email Address *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  placeholder="priya@example.com"
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
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Phone Number *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-5 h-5" />
                </div>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  {...register('phone')}
                  className={`w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border ${
                    errors.phone ? 'border-red-500/80 focus:ring-red-500' : 'border-slate-700 focus:border-sky-500 focus:ring-sky-500'
                  } rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 transition`}
                />
              </div>
              {errors.phone && (
                <p className="mt-1.5 text-xs text-red-400">{errors.phone.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Password *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min 6 characters, uppercase & number"
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

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Confirm Password *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm password"
                  {...register('confirmPassword')}
                  className={`w-full pl-10 pr-11 py-2.5 bg-slate-900/80 border ${
                    errors.confirmPassword ? 'border-red-500/80 focus:ring-red-500' : 'border-slate-700 focus:border-sky-500 focus:ring-sky-500'
                  } rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 transition`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1.5 text-xs text-red-400">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* ── SERVICE LOCATION SECTION ────────────────────────────────── */}
            <div className="pt-3 pb-1 border-t border-slate-700/60">
              <div className="flex items-center space-x-2 mb-3">
                <MapPin className="w-4 h-4 text-sky-400" />
                <h3 className="text-xs font-bold text-sky-400 uppercase tracking-wider">
                  Service Location Details
                </h3>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Address *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Building className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      placeholder="e.g. Flat 302, Green Avenue, Station Road"
                      {...register('address')}
                      className={`w-full pl-10 pr-4 py-2 bg-slate-900/80 border ${
                        errors.address ? 'border-red-500/80 focus:ring-red-500' : 'border-slate-700 focus:border-sky-500'
                      } rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 transition`}
                    />
                  </div>
                  {errors.address && (
                    <p className="mt-1 text-xs text-red-400">{errors.address.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    State *
                  </label>
                  <select
                    value={selectedState}
                    onChange={(e) => handleStateChange(e.target.value)}
                    className={`w-full px-3.5 py-2 bg-slate-900/80 border ${
                      errors.state ? 'border-red-500/80 focus:ring-red-500' : 'border-slate-700 focus:border-sky-500'
                    } rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 transition cursor-pointer`}
                  >
                    <option value="">Select State</option>
                    {INDIAN_STATES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                  {errors.state && (
                    <p className="mt-1 text-xs text-red-400">{errors.state.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      PIN Code *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Navigation className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="e.g. 396001"
                        value={enteredPin}
                        onChange={(e) => handlePinChange(e.target.value)}
                        className={`w-full pl-10 pr-10 py-2 bg-slate-900/80 border ${
                          pinErrorMessage || errors.postalCode
                            ? 'border-red-500/80 focus:ring-red-500'
                            : isPinValid
                            ? 'border-emerald-500/80 focus:ring-emerald-500'
                            : 'border-slate-700 focus:border-sky-500'
                        } rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 transition`}
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        {isLookingUpPin ? (
                          <Loader2 className="w-4 h-4 text-sky-400 animate-spin" />
                        ) : isPinValid ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : null}
                      </div>
                    </div>
                    {pinErrorMessage ? (
                      <p className="mt-1 text-xs text-red-400">{pinErrorMessage}</p>
                    ) : errors.postalCode ? (
                      <p className="mt-1 text-xs text-red-400">{errors.postalCode.message}</p>
                    ) : (
                      <p className="mt-1 text-[11px] text-slate-500">6 digits, validated against selected state</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                      <span>City *</span>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1 normal-case">
                        <Lock className="w-3 h-3 text-slate-400" /> Read-Only
                      </span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-4 h-4 text-slate-500" />
                      </div>
                      <input
                        type="text"
                        readOnly
                        disabled
                        value={detectedCity || ''}
                        placeholder="Auto-filled from PIN Code"
                        className="w-full pl-10 pr-4 py-2 bg-slate-900/40 border border-slate-700/60 rounded-xl text-slate-200 placeholder-slate-500 text-sm cursor-not-allowed select-none font-medium"
                      />
                    </div>
                    {errors.city && !detectedCity && (
                      <p className="mt-1 text-xs text-red-400">{errors.city.message}</p>
                    )}
                  </div>
                </div>

                <div className="pt-1">
                  <label className="flex items-center space-x-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      {...register('isDefaultAddress')}
                      className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-sky-500 focus:ring-sky-500/20"
                    />
                    <span className="text-xs text-slate-300">
                      Use this address as my default service location
                    </span>
                  </label>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('terms')}
                  className="mt-1 w-4 h-4 rounded border-slate-700 bg-slate-900 text-sky-500 focus:ring-sky-500/20"
                />
                <span className="text-xs text-slate-400">
                  I agree to FixMate's{' '}
                  <span className="text-sky-400 hover:underline">Terms of Service</span> and{' '}
                  <span className="text-sky-400 hover:underline">Privacy Policy</span>
                </span>
              </label>
              {errors.terms && (
                <p className="mt-1.5 text-xs text-red-400">{errors.terms.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading || isLookingUpPin}
              className="w-full mt-4 py-3 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-medium shadow-lg shadow-sky-500/25 transition duration-150 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="pt-4 border-t border-slate-700/60 text-center text-sm text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="text-sky-400 hover:text-sky-300 font-medium transition">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
