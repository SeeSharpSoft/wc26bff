import { NavLink } from 'react-router-dom';
import { UserSwitcher } from './UserSwitcher';
import { SyncButton } from './SyncButton';
import './Header.css';

export function Header() {
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <div className="brand">
          <span className="brand-mark">⚽</span>
          <span className="brand-name">WC 2026 Betting</span>
        </div>
        <nav className="site-nav" data-testid="site-nav">
          <NavLink to="/" end>
            Groups
          </NavLink>
          <NavLink to="/schedule">Schedule</NavLink>
          <NavLink to="/knockout">Knockout</NavLink>
          <NavLink to="/viewer">Viewer</NavLink>
        </nav>
        <SyncButton />
        <UserSwitcher />
      </div>
    </header>
  );
}
