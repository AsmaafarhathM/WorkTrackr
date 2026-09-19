import React from 'react';
import { ActivityLog } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { Activity, ArrowRight, CheckCircle2, Clock, PlusCircle, AlertCircle } from 'lucide-react';

interface ActivityFeedProps {
  activities: ActivityLog[];
  title?: string;
  maxItems?: number;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({
  activities,
  title = 'Real-Time Activity Feed',
  maxItems = 15,
}) => {
  const displayList = activities.slice(0, maxItems);

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    return parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}` : parts[0][0];
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'STATUS_CHANGE':
        return <ArrowRight size={14} style={{ color: '#38bdf8' }} />;
      case 'TASK_CREATED':
        return <PlusCircle size={14} style={{ color: '#34d399' }} />;
      case 'TASK_OVERDUE':
        return <AlertCircle size={14} style={{ color: '#f87171' }} />;
      default:
        return <Activity size={14} style={{ color: '#a855f7' }} />;
    }
  };

  return (
    <div className="glass-card" id="activity-feed-container">
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.25rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Activity size={18} className="text-indigo-400" />
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{title}</h3>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: '#10b981' }}>
          <span className="pulsing-dot" style={{ width: '6px', height: '6px' }} />
          <span>Live WebSocket Feed</span>
        </div>
      </div>

      {displayList.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '2.5rem 1rem',
            color: 'var(--text-subtle)',
            fontSize: '0.875rem',
          }}
        >
          <Clock size={28} style={{ margin: '0 auto 0.5rem', opacity: 0.3 }} />
          No activity records found
        </div>
      ) : (
        <div className="activity-feed">
          {displayList.map((item) => (
            <div key={item.id} className="activity-item" id={`activity-item-${item.id}`}>
              <div className="activity-avatar" title={item.user?.name || 'User'}>
                {getInitials(item.user?.name)}
              </div>

              <div className="activity-content">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="activity-message">{item.message}</span>
                </div>

                <div className="activity-meta">
                  <span>
                    {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                  </span>
                  {item.project && (
                    <>
                      <span>•</span>
                      <span style={{ color: 'var(--text-muted)' }}>
                        Project: {item.project.name}
                      </span>
                    </>
                  )}
                  {item.task && (
                    <>
                      <span>•</span>
                      <span style={{ fontFamily: 'var(--font-mono)' }}>
                        Task #{item.task.taskNumber}
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div style={{ alignSelf: 'center', opacity: 0.7 }}>
                {getActionBadge(item.action)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
