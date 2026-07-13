import { Link } from 'react-router-dom';
import { NAV_ITEMS } from '../layout/navItems';
import './HomeMenu.css';

export function HomeMenu() {
  return (
    <div className="home-menu">
      <h1>Mystic Day Outlet</h1>
      <ul className="home-menu__list">
        {NAV_ITEMS.map((item) => (
          <li key={item.to}>
            <Link to={item.to} className="home-menu__card">
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
