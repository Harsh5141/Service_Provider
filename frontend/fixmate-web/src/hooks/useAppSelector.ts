import { TypedUseSelectorHook, useSelector } from 'react-redux'
import type { RootState } from '@/store'

// Typed selector hook — avoids importing RootState in every component
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector
