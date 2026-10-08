import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import api from '@/lib/apiClient'

// ── Types ─────────────────────────────────────────────────────────────────────
export interface AuthUser {
  id:        number
  name:      string
  email:     string
  phone?:    string
  role:      'User' | 'Provider' | 'Admin'
  avatarUrl: string | null
}

interface AuthState {
  user:        AuthUser | null
  accessToken: string | null
  isAuthenticated: boolean
  isLoading:   boolean
  error:       string | null
}

// ── Thunks ────────────────────────────────────────────────────────────────────
export const login = createAsyncThunk(
  'auth/login',
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const res = await api.post('/auth/login', credentials)
      return res.data.data as { user: AuthUser; accessToken: string }
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message ?? 'Login failed')
    }
  },
)

export interface RegisterPayload {
  name: string
  email: string
  password: string
  phone: string
  address?: string
  city?: string
  state?: string
  postalCode?: string
  isDefaultAddress?: boolean
}

export const register = createAsyncThunk(
  'auth/register',
  async (payload: RegisterPayload, { rejectWithValue }) => {
    try {
      const res = await api.post('/auth/register', payload)
      return res.data.data as { user: AuthUser; accessToken: string }
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message ?? 'Registration failed')
    }
  },
)

export interface ProviderRegisterPayload {
  name: string
  email: string
  password: string
  phone: string
  bio: string
  experienceYears: number
  serviceAddress?: string
  city?: string
  state?: string
  postalCode?: string
  serviceRadiusKm?: number
  skillIds?: number[]
  skills?: string[]
  documentUrls?: string[]
}

export const registerProvider = createAsyncThunk(
  'auth/registerProvider',
  async (payload: ProviderRegisterPayload, { rejectWithValue }) => {
    try {
      const res = await api.post('/auth/register/provider', payload)
      return res.data.data as { user: AuthUser; accessToken: string }
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message ?? 'Provider registration failed')
    }
  },
)

export const refreshTokens = createAsyncThunk(
  'auth/refresh',
  async (_, { rejectWithValue }) => {
    try {
      // Refresh token is stored in an httpOnly cookie — sent automatically
      const res = await api.post('/auth/refresh')
      return res.data.data as { user: AuthUser; accessToken: string }
    } catch (err: any) {
      return rejectWithValue('Session expired')
    }
  },
)

export const fetchCurrentUser = createAsyncThunk(
  'auth/me',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/auth/me')
      return res.data.data as AuthUser
    } catch {
      return rejectWithValue('Failed to fetch user')
    }
  },
)

// ── Storage Helpers ───────────────────────────────────────────────────────────
const getInitialState = (): AuthState => {
  try {
    const storedUser = localStorage.getItem('fixmate_user')
    const storedToken = localStorage.getItem('fixmate_token')
    if (storedUser && storedToken) {
      return {
        user: JSON.parse(storedUser),
        accessToken: storedToken,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      }
    }
  } catch {
    // fallback
  }
  return {
    user:            null,
    accessToken:     null,
    isAuthenticated: false,
    isLoading:       false,
    error:           null,
  }
}

const persistAuth = (user: AuthUser, accessToken: string) => {
  try {
    localStorage.setItem('fixmate_user', JSON.stringify(user))
    localStorage.setItem('fixmate_token', accessToken)
  } catch {}
}

const clearAuthStorage = () => {
  try {
    localStorage.removeItem('fixmate_user')
    localStorage.removeItem('fixmate_token')
  } catch {}
}

// ── Initial state ─────────────────────────────────────────────────────────────
const initialState: AuthState = getInitialState()

// ── Slice ─────────────────────────────────────────────────────────────────────
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.user            = null
      state.accessToken     = null
      state.isAuthenticated = false
      state.isLoading       = false
      state.error           = null
      clearAuthStorage()
      // Tell the backend to clear the httpOnly refresh cookie
      api.post('/auth/logout').catch(() => {})
    },
    clearError(state) {
      state.error = null
    },
    updateCurrentUser(state, action: PayloadAction<Partial<AuthUser>>) {
      if (state.user) {
        state.user = { ...state.user, ...action.payload }
        if (state.accessToken) {
          persistAuth(state.user, state.accessToken)
        }
      }
    },
    setCredentials(state, action: PayloadAction<{ user: AuthUser; accessToken: string }>) {
      state.user            = action.payload.user
      state.accessToken     = action.payload.accessToken
      state.isAuthenticated = true
      state.isLoading       = false
      state.error           = null
      persistAuth(action.payload.user, action.payload.accessToken)
    },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(login.pending, (state) => { state.isLoading = true; state.error = null })
      .addCase(login.fulfilled, (state, { payload }) => {
        state.user            = payload.user
        state.accessToken     = payload.accessToken
        state.isAuthenticated = true
        state.isLoading       = false
        persistAuth(payload.user, payload.accessToken)
      })
      .addCase(login.rejected, (state, { payload }) => {
        state.isLoading = false
        state.error     = payload as string
      })

    // Register
    builder
      .addCase(register.pending, (state) => { state.isLoading = true; state.error = null })
      .addCase(register.fulfilled, (state, { payload }) => {
        state.user            = payload.user
        state.accessToken     = payload.accessToken
        state.isAuthenticated = true
        state.isLoading       = false
        persistAuth(payload.user, payload.accessToken)
      })
      .addCase(register.rejected, (state, { payload }) => {
        state.isLoading = false
        state.error     = payload as string
      })

    // Register Provider
    builder
      .addCase(registerProvider.pending, (state) => { state.isLoading = true; state.error = null })
      .addCase(registerProvider.fulfilled, (state, { payload }) => {
        state.user            = payload.user
        state.accessToken     = payload.accessToken
        state.isAuthenticated = true
        state.isLoading       = false
        persistAuth(payload.user, payload.accessToken)
      })
      .addCase(registerProvider.rejected, (state, { payload }) => {
        state.isLoading = false
        state.error     = payload as string
      })

    // Refresh
    builder
      .addCase(refreshTokens.fulfilled, (state, { payload }) => {
        state.user        = payload.user
        state.accessToken = payload.accessToken
        state.isAuthenticated = true
        persistAuth(payload.user, payload.accessToken)
      })
      .addCase(refreshTokens.rejected, (state) => {
        state.user            = null
        state.accessToken     = null
        state.isAuthenticated = false
        state.isLoading       = false
        clearAuthStorage()
      })

    // Me (app initialisation)
    builder
      .addCase(fetchCurrentUser.pending, (state) => { state.isLoading = true })
      .addCase(fetchCurrentUser.fulfilled, (state, { payload }) => {
        state.user            = payload
        state.isAuthenticated = true
        state.isLoading       = false
        if (state.accessToken) {
          persistAuth(payload, state.accessToken)
        }
      })
      .addCase(fetchCurrentUser.rejected, (state) => {
        state.isLoading = false
      })
  },
})

export const { logout, setCredentials, clearError, updateCurrentUser } = authSlice.actions
export default authSlice.reducer
