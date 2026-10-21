// Additional service charge & spare parts replacement interface and sync storage

export interface AdditionalPartItem {
  id: string
  name: string
  price: number
  imageUrl: string
  reason?: string
}

export interface ExtraServiceItem {
  id: string
  title: string
  charge: number
  description: string
}

export interface AdditionalServiceQuote {
  jobId: string | number
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED'
  parts: AdditionalPartItem[]
  additionalLaborCharge: number
  totalAdditionalAmount: number
  proposedAt: string
  approvedAt?: string
  notes?: string
  // Scope and service details changes requested by provider
  serviceNameChange?: string
  serviceScopeNotes?: string
  revisedEstimatedMinutes?: number
  extraServices?: ExtraServiceItem[]
}

const STORAGE_KEY_PREFIX = 'fixmate_additional_quote_'

export function getAdditionalQuote(jobId: string | number): AdditionalServiceQuote | null {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${jobId}`)
    if (!raw) return null
    return JSON.parse(raw) as AdditionalServiceQuote
  } catch (err) {
    console.error('Error reading additional quote', err)
    return null
  }
}

export function saveAdditionalQuote(quote: AdditionalServiceQuote): void {
  try {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${quote.jobId}`, JSON.stringify(quote))
    window.dispatchEvent(new CustomEvent('fixmate_quote_updated', { detail: { jobId: quote.jobId } }))
  } catch (err) {
    console.error('Error saving additional quote', err)
  }
}

export function updateQuoteStatus(
  jobId: string | number,
  status: 'APPROVED' | 'REJECTED'
): AdditionalServiceQuote | null {
  const current = getAdditionalQuote(jobId)
  if (!current) return null
  const updated: AdditionalServiceQuote = {
    ...current,
    status,
    approvedAt: status === 'APPROVED' ? new Date().toISOString() : undefined
  }
  saveAdditionalQuote(updated)
  return updated
}
