import { configureStore } from '@reduxjs/toolkit'
import authReducer        from '@/features/auth/authSlice'
import requestReducer     from '@/features/user/requests/requestSlice'
import notificationReducer from '@/features/notifications/notificationSlice'

export const store = configureStore({
  reducer: {
    auth:          authReducer,
    requests:      requestReducer,
    notifications: notificationReducer,
  },
  devTools: import.meta.env.DEV,
})

// Inferred types — used instead of importing RootState/AppDispatch everywhere
export type RootState   = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
