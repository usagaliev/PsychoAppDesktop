const API_BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:4000/api'

export const env = {
  apiBaseUrl: API_BASE_URL.replace(/\/$/, ''),
}
