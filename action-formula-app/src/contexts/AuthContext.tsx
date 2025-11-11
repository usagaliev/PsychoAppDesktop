import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

import {
  fetchCurrentUser,
  loginWithGoogle,
  logout as logoutRequest,
  type AuthenticatedUser,
} from '../services/auth'
import { ApiError } from '../services/http'

type AuthContextValue = {
  user: AuthenticatedUser | null
  loading: boolean
  authError: string | null
  loginWithCredential: (credential: string) => Promise<void>
  logout: () => Promise<void>
  refreshProfile: () => Promise<void>
  token: string | null
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

type Props = {
  children: React.ReactNode
}

const STORAGE_KEY = 'afc_session_token'

export const AuthProvider = ({ children }: Props) => {
  const [user, setUser] = useState<AuthenticatedUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null
    return window.localStorage.getItem(STORAGE_KEY)
  })

  const fetchProfile = useCallback(async () => {
    try {
      const response = await fetchCurrentUser()
      setUser(response.user)
      setAuthError(null)
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setUser(null)
        setAuthError(null)
        setToken(null)
        return
      }

      console.error('Failed to load current user', error)
      setAuthError('Не удалось загрузить профиль. Попробуйте позже.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchProfile()
  }, [fetchProfile])

  const loginWithCredential = useCallback(async (credential: string) => {
    if (!credential) return

    try {
      setLoading(true)
      const response = await loginWithGoogle({ idToken: credential })
      setUser(response.user)
      setToken(response.token)
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_KEY, response.token)
      }
      setAuthError(null)
      await fetchProfile()
    } catch (error) {
      console.error('Google auth failed', error)
      setAuthError('Не удалось выполнить вход через Google. Попробуйте снова.')
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await logoutRequest()
    } finally {
      setUser(null)
      setAuthError(null)
       setToken(null)
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(STORAGE_KEY)
      }
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      authError,
      loginWithCredential,
      logout,
      refreshProfile: fetchProfile,
      token,
    }),
    [authError, fetchProfile, loading, loginWithCredential, logout, token, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

