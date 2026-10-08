import { createSlice } from '@reduxjs/toolkit'

// Placeholder slice — full implementation comes in Step 5
const requestSlice = createSlice({
  name: 'requests',
  initialState: { list: [], isLoading: false, error: null as string | null },
  reducers: {},
})

export default requestSlice.reducer
