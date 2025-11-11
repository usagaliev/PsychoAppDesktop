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
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

type Props = {
  children: React.ReactNode
}

export const AuthProvider = ({ children }: Props) => {
  const [user, setUser] = useState<AuthenticatedUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)

  const fetchProfile = useCallback(async () => {
    try {
      const response = await fetchCurrentUser()
      setUser(response.user)
      setAuthError(null)
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setUser(null)
        setAuthError(null)
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
    }),
    [authError, fetchProfile, loading, loginWithCredential, logout, user],
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

