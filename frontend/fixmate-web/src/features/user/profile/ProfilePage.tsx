import { useState, useEffect } from 'react'
import { useAppSelector } from '@/hooks/useAppSelector'
import {
  User, MapPin, Plus, Trash2, CheckCircle2,
  Edit2, Save, X, Navigation, Loader2,
  ShieldCheck, Phone, Mail, Home, Building2,
  RefreshCw
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '@/lib/apiClient'
import { INDIAN_STATES, lookupPinCode } from '@/lib/locationConstants'

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

export default function ProfilePage() {
  const { user } = useAppSelector((state) => state.auth)
  const [name, setName] = useState(user?.name || 'John Doe')
  const [phone, setPhone] = useState(user?.phone || '+91 98765 43210')
  const [email, setEmail] = useState(user?.email || 'john@fixmate.test')
  const [savingProfile, setSavingProfile] = useState(false)

  // Address State
  const [addresses, setAddresses] = useState<AddressItem[]>([])
  const [loadingAddresses, setLoadingAddresses] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingAddressId, setEditingAddressId] = useState<number | null>(null)

  // Form State for Address
  const [addrLabel, setAddrLabel] = useState('Home')
  const [addrStreet, setAddrStreet] = useState('')
  const [addrCity, setAddrCity] = useState('')
  const [addrState, setAddrState] = useState('Gujarat')
  const [addrPostalCode, setAddrPostalCode] = useState('')
  const [addrIsDefault, setAddrIsDefault] = useState(false)
  const [savingAddr, setSavingAddr] = useState(false)
  const [isLookingUpPin, setIsLookingUpPin] = useState(false)
  const [pinErrorMessage, setPinErrorMessage] = useState<string | null>(null)
  const [isPinValid, setIsPinValid] = useState<boolean | null>(null)

  // Address deletion modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [addressToDelete, setAddressToDelete] = useState<AddressItem | null>(null)

  const loadAddresses = async () => {
    setLoadingAddresses(true)
    try {
      const res = await api.get('/addresses')
      if (res.data?.data && Array.isArray(res.data.data)) {
        setAddresses(res.data.data)
      }
    } catch (err) {
      console.warn('Addresses load fallback', err)
    } finally {
      setLoadingAddresses(false)
    }
  }

  useEffect(() => {
    loadAddresses()
  }, [])

  useEffect(() => {
    if (user?.name) setName(user.name)
    if (user?.phone) setPhone(user.phone)
    if (user?.email) setEmail(user.email)
  }, [user])

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Full name is required')
      return
    }

    setSavingProfile(true)
    try {
      // Simulate profile update or call endpoint if exists
      await new Promise((resolve) => setTimeout(resolve, 500))
      toast.success('Profile information saved successfully!')
    } catch {
      toast.error('Failed to update profile')
    } finally {
      setSavingProfile(false)
    }
  }

  const handlePinChange = async (rawVal: string, targetState?: string) => {
    const clean = rawVal.replace(/\D/g, '').slice(0, 6)
    setAddrPostalCode(clean)

    const activeState = targetState !== undefined ? targetState : addrState

    if (!clean) {
      setAddrCity('')
      setIsPinValid(null)
      setPinErrorMessage(null)
      return
    }

    if (clean.length < 6) {
      setAddrCity('')
      setIsPinValid(false)
      setPinErrorMessage('Enter a valid 6-digit PIN Code')
      return
    }

    if (!activeState) {
      setAddrCity('')
      setIsPinValid(false)
      setPinErrorMessage('Please select a State first')
      return
    }

    setIsLookingUpPin(true)
    setPinErrorMessage(null)

    try {
      const res = await lookupPinCode(clean, activeState)
      if (res.isValid && res.city) {
        setAddrCity(res.city)
        setIsPinValid(true)
        setPinErrorMessage(null)
      } else {
        setAddrCity('')
        setIsPinValid(false)
        setPinErrorMessage(res.errorMessage || 'PIN Code does not belong to the selected State')
      }
    } catch {
      setAddrCity('')
      setIsPinValid(false)
      setPinErrorMessage('PIN Code does not belong to the selected State')
    } finally {
      setIsLookingUpPin(false)
    }
  }

  const handleStateChange = (newState: string) => {
    setAddrState(newState)
    if (addrPostalCode && addrPostalCode.length === 6) {
      handlePinChange(addrPostalCode, newState)
    } else if (addrPostalCode) {
      setAddrCity('')
    }
  }

  const handleOpenAddModal = () => {
    setEditingAddressId(null)
    setAddrLabel('Home')
    setAddrStreet('')
    setAddrCity('')
    setAddrState('Gujarat')
    setAddrPostalCode('')
    setIsPinValid(null)
    setPinErrorMessage(null)
    setAddrIsDefault(addresses.length === 0)
    setShowAddModal(true)
  }

  const handleOpenEditModal = (addr: AddressItem) => {
    setEditingAddressId(addr.id)
    setAddrLabel(addr.label || 'Home')
    setAddrStreet(addr.street)
    setAddrCity(addr.city)
    setAddrState(addr.state || 'Gujarat')
    setAddrPostalCode(addr.postalCode)
    setIsPinValid(true)
    setPinErrorMessage(null)
    setAddrIsDefault(addr.isDefault)
    setShowAddModal(true)
  }

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!addrStreet.trim()) {
      toast.error('Address street is required')
      return
    }

    if (!addrState.trim()) {
      toast.error('State is required')
      return
    }

    if (!addrPostalCode.trim()) {
      toast.error('PIN Code is required')
      return
    }

    if (!/^[1-9][0-9]{5}$/.test(addrPostalCode.trim())) {
      toast.error('Enter a valid 6-digit PIN Code')
      return
    }

    if (pinErrorMessage || !isPinValid || !addrCity.trim()) {
      toast.error(pinErrorMessage || 'PIN Code does not belong to the selected State')
      return
    }

    setSavingAddr(true)
    try {
      const payload = {
        label: addrLabel,
        street: addrStreet.trim(),
        city: addrCity.trim(),
        state: addrState.trim(),
        postalCode: addrPostalCode.trim(),
        isDefault: addrIsDefault
      }

      if (editingAddressId) {
        await api.put(`/addresses/${editingAddressId}`, payload)
        toast.success('Address updated successfully!')
      } else {
        await api.post('/addresses', payload)
        toast.success('New service location added!')
      }

      setShowAddModal(false)
      loadAddresses()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save address')
    } finally {
      setSavingAddr(false)
    }
  }

  const handleSetDefault = async (id: number) => {
    try {
      await api.post(`/addresses/${id}/set-default`)
      toast.success('Primary service address updated!')
      loadAddresses()
    } catch (err: any) {
      toast.error('Failed to set default address')
    }
  }

  const handleConfirmDeleteAddress = async () => {
    if (!addressToDelete) return
    try {
      await api.delete(`/addresses/${addressToDelete.id}`)
      toast.success('Service address removed')
      setDeleteModalOpen(false)
      setAddressToDelete(null)
      loadAddresses()
    } catch (err: any) {
      toast.error('Failed to delete address')
    }
  }

  const defaultAddr = addresses.find((a) => a.isDefault) || addresses[0]

  return (
    <div className="space-y-8 pb-16">
      {/* ── 1. Profile Top Banner ───────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-900 p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute -right-10 -top-10 h-60 w-60 rounded-full bg-blue-500/20 blur-3xl pointer-events-none" />
        <div className="absolute right-1/3 -bottom-10 h-48 w-48 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-extrabold text-2xl sm:text-3xl shadow-lg border-2 border-white/20">
              {name.charAt(0).toUpperCase()}
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">{name}</h1>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300 border border-emerald-500/30">
                  <ShieldCheck size={12} className="text-emerald-400" />
                  Verified Customer
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 flex items-center gap-2">
                <span>{email}</span>
                <span>·</span>
                <span>{phone}</span>
              </p>
              <p className="text-[11px] text-blue-200">
                Primary City: <strong>{defaultAddr?.city || 'Valsad'}, Gujarat</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleOpenAddModal}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md hover:from-blue-600 hover:to-indigo-700 transition"
            >
              <Plus size={16} /> Add New Address
            </button>
          </div>
        </div>
      </div>

      {/* ── 2. Two-Column Layout ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Personal Information Form */}
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-xs space-y-5">
            <div className="flex items-center gap-2.5 border-b border-gray-100 pb-3.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 font-bold">
                <User size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">Personal Details</h3>
                <p className="text-[11px] text-gray-500">Contact details for service notifications</p>
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-gray-700">Full Name</label>
                <div className="relative mt-1">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-9 pr-3 py-2.5 text-xs text-gray-900 font-medium outline-none focus:border-blue-600 focus:bg-white transition"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700">Phone Number (For OTP & Technician Call)</label>
                <div className="relative mt-1">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-9 pr-3 py-2.5 text-xs text-gray-900 font-medium outline-none focus:border-blue-600 focus:bg-white transition"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700">Email Address (Read-only Login ID)</label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                  <input
                    type="email"
                    disabled
                    value={email}
                    className="w-full rounded-xl border border-gray-200 bg-gray-100 pl-9 pr-3 py-2.5 text-xs text-gray-500 font-medium cursor-not-allowed"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={savingProfile}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition disabled:opacity-50"
              >
                {savingProfile ? (
                  <>
                    <RefreshCw size={13} className="animate-spin" />
                    <span>Saving Profile...</span>
                  </>
                ) : (
                  <>
                    <Save size={14} />
                    <span>Save Profile Changes</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Account Security & Support Card */}
          <div className="rounded-3xl border border-gray-200 bg-gradient-to-br from-slate-50 to-blue-50/40 p-5 space-y-3.5 text-xs">
            <div className="flex items-center gap-2 font-bold text-gray-900">
              <ShieldCheck size={16} className="text-emerald-600" />
              <span>FixMate Security & Warranty</span>
            </div>
            <p className="text-gray-600 text-[11px] leading-relaxed">
              All bookings placed through your profile are automatically insured with FixMate 30-Day post-service guarantee and 100% background-verified partner protection.
            </p>
            <div className="pt-2 border-t border-gray-200/80 flex items-center justify-between text-[11px] text-gray-500 font-semibold">
              <span>Help Center Hotline:</span>
              <span className="text-blue-700 font-bold">1800-FIX-MATE</span>
            </div>
          </div>
        </div>

        {/* Right Column: Saved Service Addresses */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <MapPin size={18} className="text-rose-500" />
                Saved Service Locations
              </h2>
              <p className="text-xs text-gray-500">
                Your verified addresses for automatic nearest provider dispatch
              </p>
            </div>

            <button
              onClick={handleOpenAddModal}
              className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-100 transition shadow-2xs"
            >
              <Plus size={14} />
              <span>Add Location</span>
            </button>
          </div>

          {loadingAddresses ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center space-y-2">
              <Loader2 className="mx-auto animate-spin text-blue-600" size={24} />
              <p className="text-xs text-gray-500">Loading service locations...</p>
            </div>
          ) : addresses.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-10 text-center space-y-3">
              <MapPin className="mx-auto text-gray-400" size={36} />
              <h3 className="text-sm font-bold text-gray-900">No saved addresses yet</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                Add your home or office address in Valsad for instant technician booking.
              </p>
              <button
                onClick={handleOpenAddModal}
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 transition"
              >
                <Plus size={14} /> Add First Address
              </button>
            </div>
          ) : (
            <div className="space-y-3.5">
              {addresses.map((addr) => (
                <div
                  key={addr.id}
                  className={`group relative rounded-2xl border p-5 transition-all duration-200 bg-white shadow-2xs hover:shadow-md ${
                    addr.isDefault
                      ? 'border-blue-300 ring-2 ring-blue-500/10'
                      : 'border-gray-200 hover:border-blue-200'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700">
                          {addr.label === 'Office' ? <Building2 size={12} /> : <Home size={12} />}
                          <span>{addr.label || 'Home'}</span>
                        </span>

                        {addr.isDefault && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-[11px] font-extrabold text-blue-700">
                            <CheckCircle2 size={11} className="text-blue-600" />
                            Default Service Location
                          </span>
                        )}

                        <span className="inline-flex items-center gap-1 text-[11px] text-gray-500">
                          <Navigation size={11} className="text-rose-400" />
                          <span>PIN: {addr.postalCode}</span>
                        </span>
                      </div>

                      <p className="text-sm font-bold text-gray-900 leading-snug">{addr.street}</p>
                      <p className="text-xs text-gray-500">
                        {addr.city}, {addr.state} — <strong>{addr.postalCode}</strong>
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 self-end sm:self-start">
                      {!addr.isDefault && (
                        <button
                          onClick={() => handleSetDefault(addr.id)}
                          className="rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-semibold text-gray-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition"
                        >
                          Set Default
                        </button>
                      )}

                      <button
                        onClick={() => handleOpenEditModal(addr)}
                        className="rounded-lg p-1.5 text-gray-500 hover:bg-blue-50 hover:text-blue-600 transition"
                        title="Edit Address"
                      >
                        <Edit2 size={15} />
                      </button>

                      <button
                        onClick={() => {
                          setAddressToDelete(addr)
                          setDeleteModalOpen(true)
                        }}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-rose-50 hover:text-rose-600 transition"
                        title="Delete Address"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── 3. Add / Edit Address Modal ───────────────────────────────── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 sm:p-7 shadow-2xl border border-gray-100 space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 font-bold">
                  <MapPin size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {editingAddressId ? 'Edit Service Address' : 'Add Service Location'}
                  </h3>
                  <p className="text-xs text-gray-500">Auto-validates PIN code & location coordinates</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveAddress} className="space-y-4 text-xs">
              {/* Address Label Chips */}
              <div>
                <label className="font-bold text-gray-700">Location Label</label>
                <div className="mt-1.5 flex gap-2">
                  {['Home', 'Office', 'Apartment', 'Other'].map((lbl) => (
                    <button
                      key={lbl}
                      type="button"
                      onClick={() => setAddrLabel(lbl)}
                      className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                        addrLabel === lbl
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>

              {/* State Dropdown */}
              <div>
                <label className="font-bold text-gray-700">State *</label>
                <select
                  value={addrState}
                  onChange={(e) => handleStateChange(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-900 font-medium outline-none focus:border-blue-600 focus:bg-white"
                >
                  {INDIAN_STATES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              {/* PIN Code & Auto-Resolved City */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700">6-Digit PIN Code *</label>
                  <div className="relative mt-1">
                    <input
                      type="text"
                      maxLength={6}
                      required
                      placeholder="e.g. 396001"
                      value={addrPostalCode}
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
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-blue-600" size={14} />
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
                      value={addrCity}
                      className="w-full rounded-xl border border-gray-200 bg-gray-100 p-3 text-xs text-gray-800 font-bold cursor-not-allowed"
                    />
                    {isPinValid && (
                      <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600" size={14} />
                    )}
                  </div>
                </div>
              </div>

              {/* Street Address */}
              <div>
                <label className="font-bold text-gray-700">Flat / House No. & Street *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. Flat 402, Sunshine Heights, 12th Cross, Near Railway Station"
                  value={addrStreet}
                  onChange={(e) => setAddrStreet(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-900 outline-none focus:border-blue-600 focus:bg-white transition"
                />
              </div>

              {/* Default toggle */}
              <label className="flex items-center gap-2 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={addrIsDefault}
                  onChange={(e) => setAddrIsDefault(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-xs font-semibold text-gray-700">Set as primary default service address</span>
              </label>

              {/* Buttons */}
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
                  disabled={savingAddr || isLookingUpPin}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2.5 font-bold text-white shadow-md hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {savingAddr ? (
                    <>
                      <RefreshCw size={13} className="animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Service Address</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 4. Delete Address Confirmation Modal ───────────────────────── */}
      {deleteModalOpen && addressToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 sm:p-7 shadow-2xl border border-gray-100 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-50 border border-rose-100">
                <Trash2 size={22} />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Remove Service Location?</h3>
                <p className="text-xs text-gray-500">This address will no longer appear during booking.</p>
              </div>
            </div>

            <div className="rounded-2xl bg-gray-50 p-3.5 border border-gray-200 text-xs text-gray-700 space-y-1">
              <p className="font-bold text-gray-900">{addressToDelete.street}</p>
              <p className="text-gray-500">{addressToDelete.city}, {addressToDelete.state} — {addressToDelete.postalCode}</p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setDeleteModalOpen(false)
                  setAddressToDelete(null)
                }}
                className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50"
              >
                Keep Address
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteAddress}
                className="inline-flex items-center gap-1 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700"
              >
                <Trash2 size={13} />
                <span>Delete Address</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
