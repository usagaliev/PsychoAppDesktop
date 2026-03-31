import { GoogleLogin } from '@react-oauth/google'
import { useEffect, useRef, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'

import { useGoogleLoginFitWidth } from '../../hooks/useGoogleLoginFitWidth'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { useAuth } from '../../contexts/AuthContext'

const navLinks = [
  { to: '/', label: 'Материалы' },
  { to: '/diagnostics', label: 'Диагностика' },
  { to: '/exercises', label: 'Упражнения' },
  { to: '/support', label: 'Поддержка' },
  { to: '/journal', label: 'Журнал' },
]

const MOBILE_NAV_MQ = '(max-width: 768px)'

export const Header = () => {
  const { user, loginWithCredential, loginWithDevMock, logout, loading } = useAuth()
  const location = useLocation()
  const isMobileLayout = useMediaQuery(MOBILE_NAV_MQ)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuToggleRef = useRef<HTMLButtonElement>(null)
  const firstNavLinkRef = useRef<HTMLAnchorElement>(null)
  const headerGoogleWrapRef = useRef<HTMLDivElement>(null)
  const headerGoogleWidth = useGoogleLoginFitWidth(headerGoogleWrapRef, {
    min: 180,
    max: isMobileLayout ? 272 : 360,
  })

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!isMobileLayout) {
      setMenuOpen(false)
    }
  }, [isMobileLayout])

  useEffect(() => {
    if (!menuOpen) {
      return
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false)
        menuToggleRef.current?.focus()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [menuOpen])

  useEffect(() => {
    if (!menuOpen || !isMobileLayout) {
      return
    }
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [menuOpen, isMobileLayout])

  useEffect(() => {
    if (menuOpen && isMobileLayout) {
      firstNavLinkRef.current?.focus()
    }
  }, [menuOpen, isMobileLayout])

  const navItemTabIndex = isMobileLayout && !menuOpen ? -1 : undefined

  return (
    <header className="app-header">
      <div className="app-header__inner">
        <div className="app-header__start">
          <NavLink to="/" className="app-brand">
            <span className="app-brand__full">Action Formula Coach</span>
            <span className="app-brand__short">AFC</span>
          </NavLink>
          <button
            ref={menuToggleRef}
            type="button"
            className={['app-nav-toggle', menuOpen && isMobileLayout ? 'app-nav-toggle--open' : '']
              .filter(Boolean)
              .join(' ')}
            aria-expanded={menuOpen}
            aria-controls="primary-navigation"
            aria-label={menuOpen ? 'Закрыть меню' : 'Открыть меню'}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span className="app-nav-toggle__bar" aria-hidden />
            <span className="app-nav-toggle__bar" aria-hidden />
            <span className="app-nav-toggle__bar" aria-hidden />
          </button>
        </div>

        <nav
          id="primary-navigation"
          className={['app-nav', menuOpen && isMobileLayout ? 'app-nav--open' : ''].filter(Boolean).join(' ')}
          aria-label="Основное меню"
        >
          {navLinks.map((link, index) => (
            <NavLink
              key={link.to}
              to={link.to}
              ref={index === 0 ? firstNavLinkRef : undefined}
              tabIndex={navItemTabIndex}
              className={({ isActive }) =>
                ['app-nav__link', isActive ? 'app-nav__link--active' : ''].filter(Boolean).join(' ')
              }
              onClick={() => isMobileLayout && setMenuOpen(false)}
            >
              {link.label}
            </NavLink>
          ))}
          <NavLink
            to="/diagnostics"
            className="app-nav__cta"
            tabIndex={navItemTabIndex}
            onClick={() => isMobileLayout && setMenuOpen(false)}
          >
            <span className="cta-button">Пройти диагностику</span>
          </NavLink>
        </nav>

        <div className="app-header__trailing">
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
                <div ref={headerGoogleWrapRef} className="header-google-login">
                  {isMobileLayout ? (
                    <GoogleLogin
                      type="icon"
                      theme="outline"
                      size="medium"
                      shape="circle"
                      locale="ru"
                      onSuccess={(credentialResponse) => {
                        if (credentialResponse.credential) {
                          void loginWithCredential(credentialResponse.credential)
                        }
                      }}
                      containerProps={{
                        'aria-label': 'Войти через Google',
                        title: 'Войти через Google',
                      }}
                    />
                  ) : (
                    <GoogleLogin
                      shape="pill"
                      theme="outline"
                      size="large"
                      text="continue_with"
                      locale="ru"
                      width={headerGoogleWidth}
                      onSuccess={(credentialResponse) => {
                        if (credentialResponse.credential) {
                          void loginWithCredential(credentialResponse.credential)
                        }
                      }}
                    />
                  )}
                </div>
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
      </div>

      {menuOpen && isMobileLayout ? (
        <button
          type="button"
          className="app-nav-backdrop"
          tabIndex={-1}
          aria-label="Закрыть меню"
          onClick={() => setMenuOpen(false)}
        />
      ) : null}
    </header>
  )
}
