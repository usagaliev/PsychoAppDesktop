import { GoogleLogin } from '@react-oauth/google'
import { useRef } from 'react'

import { env } from '../../config/env'
import { useAuth } from '../../contexts/AuthContext'
import { useGoogleLoginFitWidth } from '../../hooks/useGoogleLoginFitWidth'

type Props = {
  title?: string
  description?: string
}

export const SignInPrompt = ({
  title = 'Чтобы продолжить, войдите через Google',
  description = 'Ваши данные будут храниться персонально и станут доступны на любом устройстве.',
}: Props) => {
  const { loginWithCredential, authError } = useAuth()
  const wrapRef = useRef<HTMLDivElement>(null)
  const googleWidth = useGoogleLoginFitWidth(wrapRef, { min: 200, max: 360 })

  if (!env.googleClientId) {
    return (
      <section className="surface-panel surface-panel--accent">
        <h2>{title}</h2>
        <p className="muted-text">{description}</p>
        <p className="error-text" style={{ marginTop: '1rem' }}>
          Авторизация через Google недоступна: не указан идентификатор клиента. Обратитесь к администратору.
        </p>
      </section>
    )
  }

  return (
    <section className="surface-panel surface-panel--accent">
      <h2>{title}</h2>
      <p className="muted-text" style={{ marginBottom: '1.5rem' }}>
        {description}
      </p>
      <div ref={wrapRef} className="sign-in-prompt__google">
        <GoogleLogin
          shape="pill"
          theme="filled_blue"
          size="large"
          width={googleWidth}
          text="continue_with"
          locale="ru"
          onSuccess={(credentialResponse) => {
            if (credentialResponse.credential) {
              void loginWithCredential(credentialResponse.credential)
            }
          }}
          onError={() => {
            // error state handled in context
          }}
        />
        {authError ? <span className="error-text">{authError}</span> : null}
      </div>
    </section>
  )
}

