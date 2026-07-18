import { NavLink } from 'react-router-dom'

export function AppHeader() {
  return (
    <header className="app-header">
      <div className="app-header__content">
        <NavLink className="app-header__brand" to="/">
          U.S. Economy Dashboard
        </NavLink>
        <nav aria-label="Primary navigation">
          <NavLink className="app-header__nav-link" to="/" end>
            Dashboard
          </NavLink>
          <NavLink className="app-header__nav-link" to="/briefing">
            Labor briefing preview
          </NavLink>
        </nav>
      </div>
    </header>
  )
}
