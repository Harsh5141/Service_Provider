import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface Notification {
  id:        number
  type:      string
  title:     string
  message:   string
  isRead:    boolean
  createdAt: string
}

interface NotificationState {
  items:       Notification[]
  unreadCount: number
}

const initialState: NotificationState = {
  items:       [],
  unreadCount: 0,
}

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification(state, action: PayloadAction<Notification>) {
      state.items.unshift(action.payload)
      if (!action.payload.isRead) state.unreadCount += 1
    },
    markAllRead(state) {
      state.items.forEach((n) => (n.isRead = true))
      state.unreadCount = 0
    },
    setNotifications(state, action: PayloadAction<Notification[]>) {
      state.items       = action.payload
      state.unreadCount = action.payload.filter((n) => !n.isRead).length
    },
  },
})

export const { addNotification, markAllRead, setNotifications } = notificationSlice.actions
export default notificationSlice.reducer
