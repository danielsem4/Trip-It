import { createContext } from 'react'
import type { AuthUser } from '../types/auth.types'

export interface AuthContextValue {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  setUser: (user: AuthUser) => void
  clearAuth: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
