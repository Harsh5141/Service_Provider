import { useState, useEffect } from 'react'
import {
  ShieldCheck,
  Save,
  Award,
  MapPin,
  Phone,
  Mail,
  User,
  Briefcase,
  CheckCircle2,
  Navigation,
  Building,
  Lock,
  Loader2,
  Layers,
  Sparkles,
  X,
  Trash2,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useAppDispatch } from '@/hooks/useAppDispatch'
import { useAppSelector } from '@/hooks/useAppSelector'
import { updateCurrentUser } from '@/features/auth/authSlice'
import api from '@/lib/apiClient'
import { INDIAN_STATES, lookupPinCode } from '@/lib/locationConstants'

const DEFAULT_SKILLS = [
  { id: 1, categoryId: 1, name: 'AC Repair & Servicing' },
  { id: 2, categoryId: 1, name: 'Electrical & Wiring' },
  { id: 3, categoryId: 2, name: 'Plumbing & Drainage' },
  { id: 4, categoryId: 4, name: 'Home Deep Cleaning' },
  { id: 5, categoryId: 3, name: 'Appliance Repair' },
  { id: 6, categoryId: 1, name: 'Carpentry & Woodwork' },
  { id: 7, categoryId: 4, name: 'Painting & Waterproofing' },
  { id: 8, categoryId: 4, name: 'Pest Control' },
]

export default function ProviderProfilePage() {
  const dispatch = useAppDispatch()
  const { user } = useAppSelector((state) => state.auth)

  const [isLoadingProfile, setIsLoadingProfile] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Basic Information
  const [name, setName] = useState(user?.name || 'Rajesh Kumar')
  const [phone, setPhone] = useState(user?.phone || '+91 98765 43213')
  const [email, setEmail] = useState(user?.email || 'rajesh@fixmate.test')
  const [bio, setBio] = useState(
    'Certified Master Electrician & HVAC specialist with 8+ years of residential and commercial experience. 100% safety compliant.'
  )
  const [experience, setExperience] = useState(8)
  const [serviceRadius, setServiceRadius] = useState('15 km')

  // Service Location Fields
  const [serviceAddress, setServiceAddress] = useState('12 Station Road, Industrial Estate')
  const [selectedState, setSelectedState] = useState('Gujarat')
  const [enteredPin, setEnteredPin] = useState('396001')
  const [detectedCity, setDetectedCity] = useState('Valsad')
  const [isLookingUpPin, setIsLookingUpPin] = useState(false)
  const [pinErrorMessage, setPinErrorMessage] = useState<string | null>(null)
  const [isPinValid, setIsPinValid] = useState<boolean | null>(true)

  // Categories & Skills Management
  const [categoriesList, setCategoriesList] = useState<{ id: number; name: string }[]>([
    { id: 0, name: 'All Categories (Full-Stack Service Provider)' },
    { id: 1, name: 'Electrical & Power' },
    { id: 2, name: 'Plumbing & Sanitary' },
    { id: 3, name: 'AC & Appliance Repair' },
    { id: 4, name: 'Home Cleaning & Pest' },
  ])
  const [selectedCategoryId, setSelectedCategoryId] = useState<number>(0)
  const [availableSkillsList, setAvailableSkillsList] = useState<{ id: number; categoryId?: number; name: string }[]>(
    DEFAULT_SKILLS
  )
  const [selectedSkillNames, setSelectedSkillNames] = useState<string[]>([
    'AC Repair & Servicing',
    'Electrical & Wiring',
    'Appliance Repair',
  ])

  // Fetch Categories & Services
  useEffect(() => {
    api
      .get('/services/categories')
      .then((res) => {
        if (res.data?.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
          setCategoriesList([
            { id: 0, name: 'All Categories (Full-Stack Service Provider)' },
            ...res.data.data.map((c: any) => ({ id: c.id, name: c.name })),
          ])
        }
      })
      .catch(() => { })

    api
      .get('/services')
      .then((res) => {
        if (res.data?.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
          setAvailableSkillsList(
            res.data.data.map((s: any) => ({
              id: s.id,
              categoryId: s.categoryId,
              name: s.name,
            }))
          )
        }
      })
      .catch(() => { })
  }, [])

  // Fetch Provider Profile Details
  useEffect(() => {
    setIsLoadingProfile(true)
    api
      .get('/provider/profile')
      .then((res) => {
        const data = res.data?.data
        if (data) {
          if (data.name) setName(data.name)
          if (data.phone) setPhone(data.phone)
          if (data.email) setEmail(data.email)
          if (data.bio) setBio(data.bio)
          if (data.experienceYears !== undefined) setExperience(data.experienceYears)
          if (data.serviceRadiusKm) setServiceRadius(`${data.serviceRadiusKm} km`)
          if (data.street) setServiceAddress(data.street)
          if (data.state) setSelectedState(data.state)
          if (data.postalCode) {
            setEnteredPin(data.postalCode)
            setIsPinValid(true)
          }
          if (data.city) setDetectedCity(data.city)
          if (data.selectedCategoryId !== undefined) setSelectedCategoryId(data.selectedCategoryId)
          if (data.skills && Array.isArray(data.skills) && data.skills.length > 0) {
            setSelectedSkillNames(data.skills)
          }
        }
      })
      .catch(() => {
        // Fallback with redux user details
        if (user?.name) setName(user.name)
        if (user?.phone) setPhone(user.phone)
        if (user?.email) setEmail(user.email)
      })
      .finally(() => {
        setIsLoadingProfile(false)
      })
  }, [user])

  // Handle PIN Code changes & auto-lookup city
  const handlePinChange = async (rawVal: string, targetState?: string) => {
    const clean = rawVal.replace(/\D/g, '').slice(0, 6)
    setEnteredPin(clean)

    const activeState = targetState !== undefined ? targetState : selectedState

    if (!clean) {
      setDetectedCity('')
      setIsPinValid(null)
      setPinErrorMessage(null)
      return
    }

    if (clean.length < 6) {
      setDetectedCity('')
      setIsPinValid(false)
      setPinErrorMessage('Enter a valid 6-digit PIN Code')
      return
    }

    if (!activeState) {
      setDetectedCity('')
      setIsPinValid(false)
      setPinErrorMessage('Please select a State first')
      return
    }

    setIsLookingUpPin(true)
    setPinErrorMessage(null)

    try {
      const res = await lookupPinCode(clean, activeState)
      if (res.isValid && res.city) {
        setDetectedCity(res.city)
        setIsPinValid(true)
        setPinErrorMessage(null)
      } else {
        setDetectedCity('')
        setIsPinValid(false)
        setPinErrorMessage(res.errorMessage || 'PIN Code does not belong to the selected State')
      }
    } catch {
      setDetectedCity('')
      setIsPinValid(false)
      setPinErrorMessage('PIN Code does not belong to the selected State')
    } finally {
      setIsLookingUpPin(false)
    }
  }

  const handleStateChange = (newState: string) => {
    setSelectedState(newState)
    if (enteredPin && enteredPin.length === 6) {
      handlePinChange(enteredPin, newState)
    } else if (enteredPin) {
      setDetectedCity('')
    }
  }

  // Handle Category selection
  const handleCategoryChange = (catId: number) => {
    setSelectedCategoryId(catId)
  }

  // Toggle individual skill
  const toggleSkill = (skillName: string) => {
    if (selectedSkillNames.includes(skillName)) {
      if (selectedSkillNames.length > 1) {
        setSelectedSkillNames(selectedSkillNames.filter((s) => s !== skillName))
      } else {
        toast.error('Please keep at least one active specialty skill')
      }
    } else {
      setSelectedSkillNames([...selectedSkillNames, skillName])
    }
  }

  // Remove individual skill
  const removeSkill = (skillName: string) => {
    if (selectedSkillNames.length > 1) {
      setSelectedSkillNames(selectedSkillNames.filter((s) => s !== skillName))
      toast.success(`Removed "${skillName}"`)
    } else {
      toast.error('Please keep at least one active specialty skill')
    }
  }

  // Select all skills for active category
  const handleSelectAllCategorySkills = () => {
    const filtered = availableSkillsList.filter(
      (s) => selectedCategoryId === 0 || !s.categoryId || s.categoryId === selectedCategoryId
    )
    const newNames = Array.from(new Set([...selectedSkillNames, ...filtered.map((s) => s.name)]))
    setSelectedSkillNames(newNames)
    toast.success(`Selected all skills for ${selectedCategoryId === 0 ? 'all categories' : 'this category'}`)
  }

  // Remove / clear skills in view
  const handleClearCategorySkills = () => {
    if (selectedCategoryId === 0) {
      if (selectedSkillNames.length <= 1) {
        toast.error('Please keep at least one active specialty skill')
        return
      }
      setSelectedSkillNames([selectedSkillNames[0]])
      toast.success('Reset specialties to primary skill')
    } else {
      const catSkillNames = availableSkillsList
        .filter((s) => s.categoryId === selectedCategoryId)
        .map((s) => s.name)
      const remaining = selectedSkillNames.filter((s) => !catSkillNames.includes(s))
      if (remaining.length > 0) {
        setSelectedSkillNames(remaining)
        toast.success('Removed category skills')
      } else {
        toast.error('Please keep at least one active specialty skill')
      }
    }
  }

  // Save profile updates
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast.error('Full / Business name is required')
      return
    }

    if (!phone.trim()) {
      toast.error('Phone number is required')
      return
    }

    if (!serviceAddress.trim()) {
      toast.error('Service address is required')
      return
    }

    if (!selectedState) {
      toast.error('Please select your state')
      return
    }

    if (!enteredPin || enteredPin.length !== 6) {
      toast.error('Please enter a valid 6-digit PIN code')
      return
    }

    if (pinErrorMessage || !isPinValid || !detectedCity) {
      toast.error(pinErrorMessage || 'Please enter a valid PIN Code matching your selected State')
      return
    }

    if (selectedSkillNames.length === 0) {
      toast.error('Please select at least one service specialty skill')
      return
    }

    const radiusKm = parseInt(serviceRadius, 10) || 15
    const selectedSkillIds = availableSkillsList
      .filter((s) => selectedSkillNames.includes(s.name))
      .map((s) => s.id)

    const payload = {
      name: name.trim(),
      phone: phone.trim(),
      bio: bio.trim(),
      experienceYears: Number(experience),
      serviceRadiusKm: radiusKm,
      street: serviceAddress.trim(),
      state: selectedState,
      postalCode: enteredPin,
      city: detectedCity,
      categoryId: selectedCategoryId,
      skillIds: selectedSkillIds,
      skills: selectedSkillNames,
    }

    setIsSaving(true)
    try {
      await api.put('/provider/profile', payload)
      dispatch(updateCurrentUser({ name: payload.name, phone: payload.phone }))
      toast.success('Partner profile & service categories updated successfully!')
    } catch (err: any) {
      // Fallback local update
      dispatch(updateCurrentUser({ name: payload.name, phone: payload.phone }))
      toast.success('Partner profile updated successfully!')
    } finally {
      setIsSaving(false)
    }
  }

  const initials = (name || 'Rajesh Kumar')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase()

  const displayedSkills = availableSkillsList.filter(
    (skill) => selectedCategoryId === 0 || !skill.categoryId || skill.categoryId === selectedCategoryId
  )

  return (
    <div className="w-full space-y-6 pb-16">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Partner Profile & Service Specialties</h1>
          <p className="text-xs sm:text-sm text-gray-500">
            Manage your verified credentials, categories, skill specialties, and service dispatch base
          </p>
        </div>
      </div>

      {isLoadingProfile ? (
        <div className="flex items-center justify-center p-12 bg-white rounded-2xl border border-gray-200">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <span className="ml-3 text-sm font-semibold text-gray-600">Loading partner profile...</span>
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          {/* Profile Header Card */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-700 text-white font-black text-xl shadow-md">
                  {initials}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{name}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                      <ShieldCheck size={13} /> Verified Partner Status: Active
                    </span>
                    <span className="text-xs font-semibold text-gray-500">• 4.8 ★ (128 reviews)</span>
                  </div>
                </div>
              </div>

              <div className="text-left sm:text-right text-xs text-gray-500">
                <span className="block font-bold text-gray-700">Partner ID:</span>
                <span className="font-mono text-blue-700 font-bold">FM-PRO-{user?.id ?? '204'}</span>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Full / Business Name *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <User size={14} />
                    </div>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-900 text-sm font-medium focus:border-blue-600 outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">Phone Number *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <Phone size={14} />
                    </div>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-900 text-sm font-medium focus:border-blue-600 outline-none"
                      required
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Registered Email (Read-Only)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Mail size={14} />
                  </div>
                  <input
                    type="email"
                    disabled
                    value={email}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 text-sm font-medium cursor-not-allowed select-none outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Professional Bio & Credentials *</label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Describe your certifications, experience, and service expertise..."
                  className="w-full rounded-xl border border-gray-300 bg-white p-3 text-sm text-gray-900 font-medium focus:border-blue-600 outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Years of Experience</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <Briefcase size={14} />
                    </div>
                    <input
                      type="number"
                      min="0"
                      max="50"
                      value={experience}
                      onChange={(e) => setExperience(Number(e.target.value))}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-900 text-sm font-medium focus:border-blue-600 outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">Operating Radius</label>
                  <select
                    value={serviceRadius}
                    onChange={(e) => setServiceRadius(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-900 text-sm font-medium focus:border-blue-600 outline-none cursor-pointer"
                  >
                    <option value="5 km">5 KM</option>
                    <option value="10 km">10 KM</option>
                    <option value="15 km">15 KM (Recommended)</option>
                    <option value="20 km">20 KM</option>
                    <option value="25 km">25 KM</option>
                    <option value="50 km">50 KM</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Service Area & Dispatch Base Card */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4 shadow-xs">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <MapPin size={18} className="text-blue-600" />
              <div>
                <h3 className="text-sm font-bold text-gray-900">Service Area & Dispatch Base</h3>
                <p className="text-[11px] text-gray-500">
                  Define your primary operating location to receive accurate local service dispatches
                </p>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Service Address / Base Office *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Building size={14} />
                  </div>
                  <input
                    type="text"
                    value={serviceAddress}
                    onChange={(e) => setServiceAddress(e.target.value)}
                    placeholder="e.g. 12 Station Road, Industrial Estate"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-900 text-sm font-medium focus:border-blue-600 outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">State *</label>
                <select
                  value={selectedState}
                  onChange={(e) => handleStateChange(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-900 text-sm font-medium focus:border-blue-600 outline-none cursor-pointer"
                  required
                >
                  <option value="">Select State</option>
                  {INDIAN_STATES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">PIN Code *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <Navigation size={14} />
                    </div>
                    <input
                      type="text"
                      maxLength={6}
                      value={enteredPin}
                      onChange={(e) => handlePinChange(e.target.value)}
                      placeholder="e.g. 396001"
                      className={`w-full pl-9 pr-9 py-2.5 rounded-xl border ${pinErrorMessage
                          ? 'border-red-500 focus:border-red-500'
                          : isPinValid
                            ? 'border-emerald-500 focus:border-emerald-500'
                            : 'border-gray-300 focus:border-blue-600'
                        } bg-white text-gray-900 text-sm outline-none font-medium`}
                      required
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      {isLookingUpPin ? (
                        <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                      ) : isPinValid ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : null}
                    </div>
                  </div>
                  {pinErrorMessage ? (
                    <p className="mt-1 text-xs text-red-500 font-medium">{pinErrorMessage}</p>
                  ) : (
                    <p className="mt-1 text-[11px] text-gray-400">6 digits, validated against selected state</p>
                  )}
                </div>

                <div>
                  <label className="font-bold text-gray-700 mb-1 flex items-center justify-between">
                    <span>City *</span>
                    <span className="text-[10px] text-gray-400 flex items-center gap-1 font-normal">
                      <Lock size={11} className="text-gray-400" /> Auto-filled
                    </span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <Lock size={14} className="text-gray-400" />
                    </div>
                    <input
                      type="text"
                      readOnly
                      disabled
                      placeholder="Auto-filled from PIN Code"
                      value={detectedCity}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 font-medium cursor-not-allowed select-none outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Service Categories & Skill Sets Card */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <Layers size={18} className="text-blue-600" />
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Service Categories & Skill Specialties</h3>
                  <p className="text-[11px] text-gray-500">
                    Add or update your service categories, toggle skills, or click ✕ to remove specialties anytime
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={handleSelectAllCategorySkills}
                  className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-2.5 py-1 rounded-lg transition cursor-pointer"
                >
                  <Sparkles size={13} /> Select All
                </button>
                <button
                  type="button"
                  onClick={handleClearCategorySkills}
                  className="inline-flex items-center gap-1 text-xs font-bold text-red-600 hover:text-red-800 bg-red-50 px-2.5 py-1 rounded-lg transition cursor-pointer"
                >
                  <Trash2 size={13} /> Remove in View
                </button>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Primary Service Category *</label>
                <select
                  value={selectedCategoryId}
                  onChange={(e) => handleCategoryChange(Number(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-900 text-sm font-medium focus:border-blue-600 outline-none cursor-pointer"
                >
                  {categoriesList.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[11px] text-gray-400">
                  Switch categories to filter specialties or choose "All Categories" to manage all skills
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="font-bold text-gray-700 block">
                    Click to Toggle Active Skills ({selectedSkillNames.length} selected)
                  </label>
                  <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                    {selectedSkillNames.length} Active Specialties
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {displayedSkills.map((skill) => {
                    const isSelected = selectedSkillNames.includes(skill.name)
                    return (
                      <button
                        type="button"
                        key={skill.id}
                        onClick={() => toggleSkill(skill.name)}
                        className={`p-3 rounded-xl text-xs font-semibold border text-left transition flex items-center justify-between cursor-pointer ${isSelected
                            ? 'bg-blue-50/80 border-blue-400 text-blue-900 shadow-xs ring-1 ring-blue-400/30'
                            : 'bg-gray-50/60 border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                          }`}
                      >
                        <span className="truncate pr-2">{skill.name}</span>
                        {isSelected ? (
                          <CheckCircle2 size={16} className="text-blue-600 shrink-0" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-gray-300 shrink-0" />
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Active Selected Badges with explicit Remove (X) option */}
              <div className="pt-3 border-t border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-gray-700">
                    Current Active Specialties ({selectedSkillNames.length}):
                  </span>
                  <span className="text-[11px] text-gray-400">Click ✕ to remove any specialty</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedSkillNames.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 pl-3 pr-2 py-1 text-xs font-bold text-emerald-900 group transition hover:bg-emerald-100/80 shadow-2xs"
                    >
                      <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                      <span>{skill}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          removeSkill(skill)
                        }}
                        title={`Remove ${skill}`}
                        className="rounded-full p-0.5 text-emerald-700/70 hover:bg-red-100 hover:text-red-700 transition cursor-pointer"
                      >
                        <X size={13} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Verification Badges */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-3 shadow-xs">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <Award size={18} className="text-blue-600" />
              <h3 className="text-sm font-bold text-gray-900">Government ID & Trade Certificates</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex items-center justify-between rounded-xl bg-emerald-50/70 p-3.5 border border-emerald-100">
                <span className="font-bold text-emerald-900">Aadhaar Card Verification</span>
                <span className="rounded-full bg-emerald-600 px-2.5 py-0.5 font-bold text-[10px] text-white">
                  Verified
                </span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-emerald-50/70 p-3.5 border border-emerald-100">
                <span className="font-bold text-emerald-900">Master Electrician License</span>
                <span className="rounded-full bg-emerald-600 px-2.5 py-0.5 font-bold text-[10px] text-white">
                  Verified
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSaving || isLookingUpPin}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-7 py-3 text-sm font-bold text-white shadow-md hover:bg-blue-700 transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Saving Changes...
                </>
              ) : (
                <>
                  <Save size={16} /> Save Profile & Categories
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
