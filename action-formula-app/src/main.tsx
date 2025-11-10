import { StrictMode } from 'react'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { BrowserRouter } from 'react-router-dom'
import { createRoot } from 'react-dom/client'

import './index.css'
import App from './App.tsx'
import { env } from './config/env'
import { AuthProvider } from './contexts/AuthContext'

export const Providers = ({ children }: { children: React.ReactNode }) => {
  if (!env.googleClientId) {
    console.warn('Google client id is not configured. Authentication is disabled.')
    return <AuthProvider>{children}</AuthProvider>
  }

  return (
    <GoogleOAuthProvider clientId={env.googleClientId}>
      <AuthProvider>{children}</AuthProvider>
    </GoogleOAuthProvider>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Providers>
        <App />
      </Providers>
    </BrowserRouter>
  </StrictMode>,
)
