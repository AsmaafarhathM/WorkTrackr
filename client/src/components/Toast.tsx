import React, { useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { Bell, X } from 'lucide-react';

export const Toast: React.FC = () => {
  const { toastMessage, clearToast } = useSocket();

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        clearToast();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage, clearToast]);

  if (!toastMessage) return null;

  return (
    <div
      id="live-toast-notification"
      style={{
        position: 'fixed',
        bottom: '2rem',
        right: '2rem',
        background: '#0f172a',
        border: '1px solid var(--border-glass-hover)',
        borderRadius: 'var(--radius-md)',
        padding: '0.875rem 1.25rem',
        boxShadow: 'var(--shadow-lg)',
        zIndex: 999,
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        maxWidth: '420px',
        animation: 'slide-in 0.25s ease-out',
      }}
    >
      <div
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          background: 'rgba(99, 102, 241, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--primary)',
          flexShrink: 0,
        }}
      >
        <Bell size={16} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', fontWeight: 600 }}>
          LIVE UPDATE
        </div>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 500 }}>
          {toastMessage}
        </div>
      </div>

      <button
        onClick={clearToast}
        style={{
          background: 'transparent',
          border: 'none',
          color: 'var(--text-muted)',
          cursor: 'pointer',
          padding: '4px',
        }}
      >
        <X size={16} />
      </button>
    </div>
  );
};
