import axios from 'axios'
import type { Store } from '@reduxjs/toolkit'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

let isRefreshing = false
let failedQueue: Array<{ resolve: (v: string) => void; reject: (e: unknown) => void }> = []

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)))
  failedQueue = []
}

export const setupInterceptors = (store: Store) => {
  // ── Request interceptor: attach access token ──────────────────────────────────
  api.interceptors.request.use((config) => {
    const state = store.getState() as { auth?: { accessToken?: string | null } }
    const token = state.auth?.accessToken
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  })

  // ── Response interceptor: transparent token refresh ──────────────────────────
  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config

      if (
        error.response?.status === 401 &&
        !originalRequest._retry &&
        originalRequest.url !== '/auth/login' &&
        originalRequest.url !== '/auth/refresh'
      ) {
        if (isRefreshing) {
          // Queue subsequent 401s while refresh is in progress
          return new Promise<string>((resolve, reject) => {
            failedQueue.push({ resolve, reject })
          })
            .then((token) => {
              originalRequest.headers.Authorization = `Bearer ${token}`
              return api(originalRequest)
            })
            .catch((err) => Promise.reject(err))
        }

        originalRequest._retry = true
        isRefreshing = true

        try {
          // Use raw axios instance to prevent recursive interceptor loops
          const res = await axios.post(`${API_BASE_URL}/auth/refresh`, {}, { withCredentials: true })
          const { user, accessToken } = res.data.data

          store.dispatch({
            type: 'auth/setCredentials',
            payload: { user, accessToken },
          })

          processQueue(null, accessToken)
          originalRequest.headers.Authorization = `Bearer ${accessToken}`
          return api(originalRequest)
        } catch (refreshError) {
          processQueue(refreshError, null)
          store.dispatch({ type: 'auth/logout' })
          return Promise.reject(refreshError)
        } finally {
          isRefreshing = false
        }
      }

      return Promise.reject(error)
    },
  )
}

export default api

