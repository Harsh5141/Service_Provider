import { useDispatch } from 'react-redux'
import type { AppDispatch } from '@/store'

// Typed dispatch hook — ensures async thunks are typed correctly
export const useAppDispatch = () => useDispatch<AppDispatch>()
