import api from './apiClient'

export const INDIAN_STATES: string[] = [
  // 28 States
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',

  // 8 Union Territories
  'Andaman and Nicobar Islands',
  'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Jammu and Kashmir',
  'Ladakh',
  'Lakshadweep',
  'Puducherry'
]

export interface PinLookupResult {
  isValid: boolean
  postalCode: string
  city: string
  district: string
  state: string
  latitude?: number
  longitude?: number
  errorMessage?: string
}

// Built-in fallback prefix dictionary for instant local validation and city resolution
const FALLBACK_PREFIX_MAP: Record<string, { city: string; state: string }> = {
  // Gujarat
  '396': { city: 'Valsad', state: 'Gujarat' },
  '395': { city: 'Surat', state: 'Gujarat' },
  '394': { city: 'Surat', state: 'Gujarat' },
  '390': { city: 'Vadodara', state: 'Gujarat' },
  '380': { city: 'Ahmedabad', state: 'Gujarat' },
  '382': { city: 'Gandhinagar', state: 'Gujarat' },
  '360': { city: 'Rajkot', state: 'Gujarat' },
  '361': { city: 'Jamnagar', state: 'Gujarat' },
  '364': { city: 'Bhavnagar', state: 'Gujarat' },
  '388': { city: 'Anand', state: 'Gujarat' },
  '392': { city: 'Bharuch', state: 'Gujarat' },

  // Maharashtra
  '400': { city: 'Mumbai', state: 'Maharashtra' },
  '401': { city: 'Thane', state: 'Maharashtra' },
  '411': { city: 'Pune', state: 'Maharashtra' },
  '412': { city: 'Pune', state: 'Maharashtra' },
  '422': { city: 'Nashik', state: 'Maharashtra' },
  '440': { city: 'Nagpur', state: 'Maharashtra' },
  '431': { city: 'Aurangabad', state: 'Maharashtra' },

  // Delhi & NCR
  '110': { city: 'New Delhi', state: 'Delhi' },
  '122': { city: 'Gurugram', state: 'Haryana' },
  '201': { city: 'Noida', state: 'Uttar Pradesh' },

  // Karnataka
  '560': { city: 'Bengaluru', state: 'Karnataka' },
  '570': { city: 'Mysuru', state: 'Karnataka' },

  // Tamil Nadu
  '600': { city: 'Chennai', state: 'Tamil Nadu' },
  '641': { city: 'Coimbatore', state: 'Tamil Nadu' },

  // Telangana
  '500': { city: 'Hyderabad', state: 'Telangana' },

  // West Bengal
  '700': { city: 'Kolkata', state: 'West Bengal' },

  // Rajasthan
  '302': { city: 'Jaipur', state: 'Rajasthan' },

  // Uttar Pradesh
  '226': { city: 'Lucknow', state: 'Uttar Pradesh' },
  '208': { city: 'Kanpur', state: 'Uttar Pradesh' },

  // Kerala
  '682': { city: 'Kochi', state: 'Kerala' },
  '695': { city: 'Thiruvananthapuram', state: 'Kerala' },

  // Chandigarh & Goa
  '160': { city: 'Chandigarh', state: 'Chandigarh' },
  '403': { city: 'Panaji', state: 'Goa' },
  '800': { city: 'Patna', state: 'Bihar' }
}

const PIN_PREFIX_STATE_RANGES: Array<{ start: number; end: number; state: string; defaultCity: string }> = [
  { start: 11, end: 11, state: 'Delhi', defaultCity: 'New Delhi' },
  { start: 12, end: 13, state: 'Haryana', defaultCity: 'Gurugram' },
  { start: 14, end: 15, state: 'Punjab', defaultCity: 'Ludhiana' },
  { start: 16, end: 16, state: 'Chandigarh', defaultCity: 'Chandigarh' },
  { start: 17, end: 17, state: 'Himachal Pradesh', defaultCity: 'Shimla' },
  { start: 18, end: 19, state: 'Jammu and Kashmir', defaultCity: 'Srinagar' },
  { start: 19, end: 19, state: 'Ladakh', defaultCity: 'Leh' },
  { start: 20, end: 28, state: 'Uttar Pradesh', defaultCity: 'Lucknow' },
  { start: 24, end: 26, state: 'Uttarakhand', defaultCity: 'Dehradun' },
  { start: 30, end: 34, state: 'Rajasthan', defaultCity: 'Jaipur' },
  { start: 36, end: 39, state: 'Gujarat', defaultCity: 'Ahmedabad' },
  { start: 40, end: 44, state: 'Maharashtra', defaultCity: 'Mumbai' },
  { start: 40, end: 40, state: 'Goa', defaultCity: 'Panaji' },
  { start: 45, end: 48, state: 'Madhya Pradesh', defaultCity: 'Indore' },
  { start: 49, end: 49, state: 'Chhattisgarh', defaultCity: 'Raipur' },
  { start: 50, end: 50, state: 'Telangana', defaultCity: 'Hyderabad' },
  { start: 51, end: 53, state: 'Andhra Pradesh', defaultCity: 'Visakhapatnam' },
  { start: 56, end: 59, state: 'Karnataka', defaultCity: 'Bengaluru' },
  { start: 60, end: 64, state: 'Tamil Nadu', defaultCity: 'Chennai' },
  { start: 60, end: 60, state: 'Puducherry', defaultCity: 'Puducherry' },
  { start: 67, end: 69, state: 'Kerala', defaultCity: 'Kochi' },
  { start: 70, end: 74, state: 'West Bengal', defaultCity: 'Kolkata' },
  { start: 75, end: 77, state: 'Odisha', defaultCity: 'Bhubaneswar' },
  { start: 78, end: 78, state: 'Assam', defaultCity: 'Guwahati' },
  { start: 80, end: 85, state: 'Bihar', defaultCity: 'Patna' },
  { start: 81, end: 83, state: 'Jharkhand', defaultCity: 'Ranchi' }
]

export function normalizeState(stateName?: string): string {
  if (!stateName) return ''
  const s = stateName.trim().toLowerCase()
  if (s.includes('delhi')) return 'Delhi'
  if (s.includes('orissa') || s.includes('odisha')) return 'Odisha'
  if (s.includes('uttaranchal') || s.includes('uttarakhand')) return 'Uttarakhand'
  if (s.includes('pondicherry') || s.includes('puducherry')) return 'Puducherry'
  if (s.includes('daman') || s.includes('dadra')) return 'Dadra and Nagar Haveli and Daman and Diu'
  if (s.includes('jammu')) return 'Jammu and Kashmir'
  if (s.includes('andaman')) return 'Andaman and Nicobar Islands'
  return stateName.trim()
}

export function areStatesEqual(s1?: string, s2?: string): boolean {
  if (!s1 || !s2) return false
  const n1 = normalizeState(s1).toLowerCase()
  const n2 = normalizeState(s2).toLowerCase()
  return n1 === n2 || n1.includes(n2) || n2.includes(n1)
}

export async function lookupPinCode(postalCode: string, state?: string): Promise<PinLookupResult> {
  const cleanPin = postalCode.trim()

  if (!cleanPin) {
    return {
      isValid: false,
      postalCode: '',
      city: '',
      district: '',
      state: '',
      errorMessage: 'PIN Code is required'
    }
  }

  if (!/^[1-9][0-9]{5}$/.test(cleanPin)) {
    return {
      isValid: false,
      postalCode: cleanPin,
      city: '',
      district: '',
      state: '',
      errorMessage: 'Enter a valid 6-digit PIN Code'
    }
  }

  // 1. Try Backend API
  try {
    const params = new URLSearchParams({ postalCode: cleanPin })
    if (state) params.append('state', state)
    const res = await api.get(`/locations/lookup-pin?${params.toString()}`)
    if (res.data?.data) {
      const d = res.data.data
      return {
        isValid: d.isValid,
        postalCode: d.postalCode,
        city: d.city || d.district,
        district: d.district || d.city,
        state: d.state,
        latitude: d.latitude,
        longitude: d.longitude,
        errorMessage: d.errorMessage
      }
    }
  } catch (err: any) {
    const serverMsg = err?.response?.data?.message || err?.response?.data?.errors?.[0]
    if (serverMsg && (serverMsg.includes('belong') || serverMsg.includes('State') || serverMsg.includes('valid'))) {
      return {
        isValid: false,
        postalCode: cleanPin,
        city: '',
        district: '',
        state: '',
        errorMessage: serverMsg
      }
    }
  }

  // 2. Direct public Postal API fallback
  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${cleanPin}`)
    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data) && data[0]?.Status === 'Success' && data[0]?.PostOffice?.length > 0) {
        const po = data[0].PostOffice[0]
        const resolvedCity = po.District || po.Name
        const resolvedState = po.State

        if (state && !areStatesEqual(resolvedState, state)) {
          return {
            isValid: false,
            postalCode: cleanPin,
            city: '',
            district: '',
            state: resolvedState,
            errorMessage: 'PIN Code does not belong to the selected State'
          }
        }

        return {
          isValid: true,
          postalCode: cleanPin,
          city: resolvedCity,
          district: resolvedCity,
          state: resolvedState
        }
      }
    }
  } catch {
    // Continue to local directory fallback
  }

  // 3. Fallback to Local Comprehensive Prefix Mapping
  const p3 = cleanPin.substring(0, 3)
  if (FALLBACK_PREFIX_MAP[p3]) {
    const item = FALLBACK_PREFIX_MAP[p3]
    if (state && !areStatesEqual(item.state, state)) {
      return {
        isValid: false,
        postalCode: cleanPin,
        city: '',
        district: '',
        state: item.state,
        errorMessage: 'PIN Code does not belong to the selected State'
      }
    }
    return {
      isValid: true,
      postalCode: cleanPin,
      city: item.city,
      district: item.city,
      state: item.state
    }
  }

  const p2 = parseInt(cleanPin.substring(0, 2), 10)
  const rangeMatch = PIN_PREFIX_STATE_RANGES.find((r) => p2 >= r.start && p2 <= r.end)
  if (rangeMatch) {
    if (state && !areStatesEqual(rangeMatch.state, state)) {
      return {
        isValid: false,
        postalCode: cleanPin,
        city: '',
        district: '',
        state: rangeMatch.state,
        errorMessage: 'PIN Code does not belong to the selected State'
      }
    }
    return {
      isValid: true,
      postalCode: cleanPin,
      city: rangeMatch.defaultCity,
      district: rangeMatch.defaultCity,
      state: rangeMatch.state
    }
  }

  return {
    isValid: false,
    postalCode: cleanPin,
    city: '',
    district: '',
    state: '',
    errorMessage: 'PIN Code does not belong to the selected State'
  }
}
