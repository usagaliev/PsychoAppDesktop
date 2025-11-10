import { GoogleLogin } from '@react-oauth/google'

import { env } from '../../config/env'
import { useAuth } from '../../contexts/AuthContext'

type Props = {
  title?: string
  description?: string
}

export const SignInPrompt = ({
  title = 'Чтобы продолжить, войдите через Google',
  description = 'Ваши данные будут храниться персонально и станут доступны на любом устройстве.',
}: Props) => {
  const { loginWithCredential, authError } = useAuth()

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
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '320px' }}>
        <GoogleLogin
          shape="pill"
          theme="filled_blue"
          width="320"
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

