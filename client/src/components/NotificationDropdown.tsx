import React from 'react';
import { useSocket } from '../context/SocketContext';
import { Check, Bell, AlertCircle, CheckCircle2, Clock, UserPlus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface NotificationDropdownProps {
  onClose: () => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ onClose }) => {
  const { notifications, unreadNotificationCount, markNotificationRead, markAllNotificationsRead } =
    useSocket();

  const getIcon = (type: string) => {
    switch (type) {
      case 'TASK_ASSIGNED':
        return <UserPlus size={16} className="text-cyan-400" />;
      case 'TASK_IN_REVIEW':
        return <Clock size={16} className="text-purple-400" />;
      case 'TASK_OVERDUE':
        return <AlertCircle size={16} className="text-red-400" />;
      default:
        return <Bell size={16} className="text-indigo-400" />;
    }
  };

  return (
    <div className="dropdown-menu" id="notification-dropdown">
      <div
        style={{
          padding: '1rem',
          borderBottom: '1px solid var(--border-glass)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Notifications</span>
          {unreadNotificationCount > 0 && (
            <span
              style={{
                background: 'var(--primary)',
                color: '#fff',
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '0.1rem 0.5rem',
                borderRadius: 'var(--radius-full)',
              }}
            >
              {unreadNotificationCount} new
            </span>
          )}
        </div>
        {unreadNotificationCount > 0 && (
          <button
            id="mark-all-read-btn"
            onClick={markAllNotificationsRead}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--primary)',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Mark all as read
          </button>
        )}
      </div>

      <div style={{ maxHeight: '340px', overflowY: 'auto' }}>
        {notifications.length === 0 ? (
          <div
            style={{
              padding: '2.5rem 1.5rem',
              textAlign: 'center',
              color: 'var(--text-subtle)',
              fontSize: '0.875rem',
            }}
          >
            <CheckCircle2 size={32} style={{ margin: '0 auto 0.5rem', opacity: 0.4 }} />
            No notifications yet
          </div>
        ) : (
          notifications.map((item) => (
            <div
              key={item.id}
              id={`notification-${item.id}`}
              style={{
                padding: '0.875rem 1rem',
                borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                background: item.isRead ? 'transparent' : 'rgba(99, 102, 241, 0.08)',
                display: 'flex',
                gap: '0.75rem',
                alignItems: 'flex-start',
                transition: 'background 0.2s',
              }}
            >
              <div
                style={{
                  marginTop: '2px',
                  padding: '6px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255, 255, 255, 0.05)',
                }}
              >
                {getIcon(item.type)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: '0.85rem',
                    fontWeight: item.isRead ? 500 : 700,
                    color: item.isRead ? 'var(--text-muted)' : 'var(--text-main)',
                  }}
                >
                  {item.title}
                </div>
                <div
                  style={{
                    fontSize: '0.8rem',
                    color: 'var(--text-muted)',
                    marginTop: '2px',
                    lineHeight: 1.4,
                  }}
                >
                  {item.message}
                </div>
                <div
                  style={{
                    fontSize: '0.72rem',
                    color: 'var(--text-subtle)',
                    marginTop: '4px',
                  }}
                >
                  {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                </div>
              </div>

              {!item.isRead && (
                <button
                  title="Mark as read"
                  onClick={() => markNotificationRead(item.id)}
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--border-glass)',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '4px',
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Check size={14} />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
