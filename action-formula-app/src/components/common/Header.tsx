import { GoogleLogin } from '@react-oauth/google'
import { NavLink } from 'react-router-dom'

import { useAuth } from '../../contexts/AuthContext'

const navLinks = [
  { to: '/', label: 'Материалы' },
  { to: '/diagnostics', label: 'Диагностика' },
  { to: '/exercises', label: 'Упражнения' },
  { to: '/support', label: 'Поддержка' },
  { to: '/journal', label: 'Журнал' },
]

export const Header = () => {
  const { user, loginWithCredential, loginWithDevMock, logout, loading } = useAuth()

  return (
    <header className="app-header">
      <div className="app-header__inner">
        <NavLink to="/" className="app-brand">
          <span>Action Formula Coach</span>
        </NavLink>

        <nav className="app-nav" aria-label="Основное меню">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                ['app-nav__link', isActive ? 'app-nav__link--active' : '']
                  .filter(Boolean)
                  .join(' ')
              }
            >
              {link.label}
            </NavLink>
          ))}
          <NavLink to="/diagnostics" className="app-nav__cta">
            <span className="cta-button">Пройти диагностику</span>
          </NavLink>
        </nav>

        <div className="app-header__auth">
          {user ? (
            <div className="auth-user">
              {user.avatarUrl ? (
                <img className="auth-user__avatar" src={user.avatarUrl} alt={user.name ?? user.email} />
              ) : (
                <span className="auth-user__placeholder">{user.name?.[0] ?? user.email[0]}</span>
              )}
              <div className="auth-user__meta">
                <span className="auth-user__name">{user.name ?? user.email}</span>
                <button type="button" className="ghost-button" onClick={() => void logout()}>
                  Выйти
                </button>
              </div>
            </div>
          ) : loading ? (
            <span className="auth-loading">Подключаем профиль...</span>
          ) : (
            <div className="auth-actions">
              <GoogleLogin
                shape="pill"
                theme="outline"
                size="medium"
                onSuccess={(credentialResponse) => {
                  if (credentialResponse.credential) {
                    void loginWithCredential(credentialResponse.credential)
                  }
                }}
              />
              {loginWithDevMock && (
                <button
                  type="button"
                  className="ghost-button ghost-button--muted"
                  onClick={() => void loginWithDevMock()}
                >
                  Dev Login
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
