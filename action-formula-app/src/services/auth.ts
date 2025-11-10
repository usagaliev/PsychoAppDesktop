import { ApiError, http } from './http'

export type AuthenticatedUser = {
  id: string
  email: string
  name: string | null
  avatarUrl: string | null
}

type LoginPayload = {
  idToken: string
}

export const loginWithGoogle = (payload: LoginPayload) =>
  http<{ user: AuthenticatedUser }>('/auth/google', {
    method: 'POST',
    body: payload,
  })

export const fetchCurrentUser = async () => {
  try {
    return await http<{ user: AuthenticatedUser }>('/auth/me')
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      throw error
    }

    throw error
  }
}

export const logout = () =>
  http<{ success: boolean }>('/auth/logout', {
    method: 'POST',
  })

