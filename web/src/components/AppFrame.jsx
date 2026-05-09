import {
  useEffect,
  useRef,
  useState,
} from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import Icon from './Icon';

export default function AppFrame({
  title,
  description,
  children,
  detailLabel = null,
  navDetailLabel = detailLabel,
  topNavActions = null,
}) {
  const { user, logout } = useAuth();
  const canManageUsers = user?.role === 'ADMIN';
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return undefined;

    function handlePointerDown(event) {
      if (!menuRef.current?.contains(event.target)) {
        setMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, [menuOpen]);

  return (
    <div className="app-shell">
      <div className="app-layout">
        <aside className="side-nav">
          <nav className="side-nav-links" aria-label="Primary navigation">
            <NavLink
              end
              className={({ isActive }) => `nav-link side-nav-link ${isActive ? 'active' : ''}`}
              to="/dashboard"
              aria-label="Risk Dashboard"
              data-label="Risk Dashboard"
            >
              <Icon name="dashboard" />
              <span className="side-nav-link-label">Risk Dashboard</span>
            </NavLink>
            <NavLink
              end
              className={({ isActive }) => `nav-link side-nav-link ${isActive ? 'active' : ''}`}
              to="/risks"
              aria-label="Risk Register"
              data-label="Risk Register"
            >
              <Icon name="register" />
              <span className="side-nav-link-label">Risk Register</span>
            </NavLink>
            {canManageUsers ? (
              <NavLink
                end
                className={({ isActive }) => `nav-link side-nav-link ${isActive ? 'active' : ''}`}
                to="/users"
                aria-label="User Management"
                data-label="User Management"
              >
                <Icon name="users" />
                <span className="side-nav-link-label">User Management</span>
              </NavLink>
            ) : null}
            {navDetailLabel ? (
              <span
                className="nav-link side-nav-link active"
                aria-label={navDetailLabel}
                data-label={navDetailLabel}
              >
                <Icon name="detail" />
                <span className="side-nav-link-label">{navDetailLabel}</span>
              </span>
            ) : null}
          </nav>

          <div className="side-nav-footer">
            <div className="session-menu" ref={menuRef}>
              <button
                type="button"
                className="session-panel session-trigger"
                onClick={() => setMenuOpen((open) => !open)}
              >
                <div className="session-user-row">
                  <Icon name="user" className="session-user-icon" />
                  <div className="session-name">{user?.name || user?.email || 'Unknown user'}</div>
                </div>
              </button>

              {menuOpen ? (
                <div className="session-dropdown">
                  <button type="button" className="session-action session-inline-btn" onClick={logout}>
                    <Icon name="signout" />
                    Sign Out
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </aside>

        <main className="app-content">
          <header className="page-header page-header-split">
            <div>
              <h1>
                {detailLabel ? (
                  <>
                    <span className="page-header-detail-label">{detailLabel}</span>
                    <span className="page-header-divider">|</span>
                  </>
                ) : null}
                {title}
              </h1>
              <p>{description}</p>
            </div>

            <div className="page-header-actions">
              {topNavActions}
            </div>
          </header>

          <div className="content-frame-body">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
