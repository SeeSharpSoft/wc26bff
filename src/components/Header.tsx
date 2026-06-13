import { UserSwitcher } from './UserSwitcher';
import './Header.css';

export function Header() {
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <div className="brand">
          <span className="brand-mark">⚽</span>
          <span className="brand-name">WC 2026 Betting</span>
        </div>
        <UserSwitcher />
      </div>
    </header>
  );
}
