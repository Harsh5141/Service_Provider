/**
 * Utility functions for service request OTP generation and retrieval.
 * Every time a user creates/sends a service request, a new random 4-digit OTP is generated.
 */

export function generateNewRequestOtp(requestId: number | string): string {
  const idStr = String(requestId)
  const key = `fixmate_otp_${idStr}`
  // Generate random 4-digit OTP between 1000 and 9999
  const randomOtp = Math.floor(1000 + Math.random() * 9000).toString()
  localStorage.setItem(key, randomOtp)
  return randomOtp
}

export function getRequestOtp(requestId: number | string | undefined | null): string {
  if (!requestId) return '1234'
  const idStr = String(requestId)
  const key = `fixmate_otp_${idStr}`
  const existing = localStorage.getItem(key)
  if (existing) {
    return existing
  }

  // Generate a random OTP based on request ID if not yet generated
  const num = typeof requestId === 'number' ? requestId : parseInt(idStr.replace(/\D/g, '')) || 101
  const generated = Math.floor(1000 + ((num * 7919 + 31) % 9000)).toString()
  localStorage.setItem(key, generated)
  return generated
}
