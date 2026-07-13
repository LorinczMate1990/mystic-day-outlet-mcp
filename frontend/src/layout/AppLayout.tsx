import { NavLink, Outlet } from 'react-router-dom';
import './AppLayout.css';

export function AppLayout() {
  return (
    <div className="app-layout">
      <nav className="app-layout__nav">
        <span className="app-layout__brand">Mystic Day Outlet</span>
        <ul className="app-layout__menu">
          <li>
            <NavLink
              to="/test/email"
              className={({ isActive }) => (isActive ? 'app-layout__link app-layout__link--active' : 'app-layout__link')}
            >
              Test E-mail
            </NavLink>
          </li>
        </ul>
      </nav>
      <main className="app-layout__content">
        <Outlet />
      </main>
    </div>
  );
}
