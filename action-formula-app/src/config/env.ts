const API_BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:4000/api'
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined

if (!GOOGLE_CLIENT_ID) {
  console.warn('VITE_GOOGLE_CLIENT_ID is not defined. Google authentication will be disabled.')
}

export const env = {
  apiBaseUrl: API_BASE_URL.replace(/\/$/, ''),
  googleClientId: GOOGLE_CLIENT_ID,
}
