import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { NotificationDropdown } from './NotificationDropdown';
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Building2,
  Bell,
  LogOut,
  Layers,
  Radio,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { isConnected, onlineCount, unreadNotificationCount } = useSocket();
  const [showNotifications, setShowNotifications] = useState(false);
  const location = useLocation();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getRoleBadgeClass = (role?: string) => {
    switch (role) {
      case 'ADMIN':
        return 'role-badge role-admin';
      case 'PROJECT_MANAGER':
        return 'role-badge role-pm';
      case 'DEVELOPER':
        return 'role-badge role-dev';
      default:
        return 'role-badge';
    }
  };

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'ADMIN':
        return 'Admin';
      case 'PROJECT_MANAGER':
        return 'Project Manager';
      case 'DEVELOPER':
        return 'Developer';
      default:
        return role;
    }
  };

  return (
    <header className="navbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '2.5rem' }}>
        <Link to="/" className="nav-brand" id="brand-logo">
          <div className="brand-icon">
            <Layers size={18} color="#fff" />
          </div>
          <span>WorkTrackr</span>
        </Link>

        {user && (
          <nav className="nav-links">
            <Link
              to="/"
              id="nav-dashboard"
              className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
            >
              <LayoutDashboard size={17} />
              <span>Dashboard</span>
            </Link>

            <Link
              to="/projects"
              id="nav-projects"
              className={`nav-link ${location.pathname.startsWith('/projects') ? 'active' : ''}`}
            >
              <FolderKanban size={17} />
              <span>Projects</span>
            </Link>

            <Link
              to="/tasks"
              id="nav-tasks"
              className={`nav-link ${location.pathname.startsWith('/tasks') ? 'active' : ''}`}
            >
              <CheckSquare size={17} />
              <span>Tasks</span>
            </Link>

            {user.role === 'ADMIN' && (
              <Link
                to="/clients"
                id="nav-clients"
                className={`nav-link ${location.pathname.startsWith('/clients') ? 'active' : ''}`}
              >
                <Building2 size={17} />
                <span>Clients</span>
              </Link>
            )}
          </nav>
        )}
      </div>

      {user && (
        <div className="nav-actions">
          {/* Live Presence Indicator */}
          <div
            className="presence-badge"
            id="live-presence-indicator"
            title={isConnected ? 'Live WebSocket Connected' : 'Connecting to WebSocket...'}
          >
            <span className="pulsing-dot" />
            <span>
              {onlineCount} {onlineCount === 1 ? 'user' : 'users'} online
            </span>
          </div>

          {/* User Role Badge */}
          <span className={getRoleBadgeClass(user.role)} id="current-user-role">
            {getRoleLabel(user.role)}
          </span>

          {/* Notifications Trigger */}
          <div style={{ position: 'relative' }} ref={dropdownRef}>
            <button
              id="notifications-bell-btn"
              onClick={() => setShowNotifications(!showNotifications)}
              style={{
                position: 'relative',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-glass)',
                color: 'var(--text-main)',
                padding: '0.5rem',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
              }}
              title="Notifications"
            >
              <Bell size={18} />
              {unreadNotificationCount > 0 && (
                <span
                  id="unread-notifications-badge"
                  style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    background: '#ef4444',
                    color: '#fff',
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 8px rgba(239, 68, 68, 0.6)',
                  }}
                >
                  {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <NotificationDropdown onClose={() => setShowNotifications(false)} />
            )}
          </div>

          {/* User Info & Logout */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{user.name}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>{user.email}</div>
            </div>

            <button
              id="logout-button"
              onClick={logout}
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                color: '#f87171',
                padding: '0.5rem',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
              }}
              title="Log out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
