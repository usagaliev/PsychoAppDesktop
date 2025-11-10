import { NavLink } from 'react-router-dom'

const navLinks = [
  { to: '/', label: 'Материалы' },
  { to: '/diagnostics', label: 'Диагностика' },
  { to: '/exercises', label: 'Упражнения' },
  { to: '/support', label: 'Поддержка' },
  { to: '/journal', label: 'Журнал' },
]

export const Header = () => {
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
      </div>
    </header>
  )
}
