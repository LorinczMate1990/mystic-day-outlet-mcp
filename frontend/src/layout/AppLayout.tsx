import { NavLink, Outlet } from 'react-router-dom';
import { NAV_ITEMS } from './navItems';
import './AppLayout.css';

export function AppLayout() {
  return (
    <div className="app-layout">
      <nav className="app-layout__nav">
        <NavLink to="/" className="app-layout__brand">
          Mystic Day Outlet
        </NavLink>
        <ul className="app-layout__menu">
          {NAV_ITEMS.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) => (isActive ? 'app-layout__link app-layout__link--active' : 'app-layout__link')}
              >
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <main className="app-layout__content">
        <Outlet />
      </main>
    </div>
  );
}
