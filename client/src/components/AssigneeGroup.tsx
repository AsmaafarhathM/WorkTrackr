import React from 'react';
import { Task, TaskStatus, User } from '../types';
import { JiraTaskCard } from './JiraTaskCard';
import { getDeterministicAvatarColor, getInitials } from '../utils/avatar';
import { ChevronDown, UserX, User as UserIcon } from 'lucide-react';

interface AssigneeGroupProps {
  assigneeKey: string;
  assignee: { id: string; name: string; email?: string } | null;
  tasks: Task[];
  isExpanded: boolean;
  onToggle: () => void;
  onStatusChange: (taskId: string, newStatus: TaskStatus) => Promise<void>;
  onEditTask?: (task: Task) => void;
}

export const AssigneeGroup: React.FC<AssigneeGroupProps> = ({
  assigneeKey,
  assignee,
  tasks,
  isExpanded,
  onToggle,
  onStatusChange,
  onEditTask,
}) => {
  const isUnassigned = !assignee || assigneeKey === 'unassigned';
  const displayName = isUnassigned ? 'Unassigned' : assignee.name;
  const avatarStyle = getDeterministicAvatarColor(isUnassigned ? '' : assignee.id || assignee.name);

  // Dynamically calculate status statistics from actual tasks
  const stats = {
    todo: tasks.filter((t) => t.status === 'TODO').length,
    inProgress: tasks.filter((t) => t.status === 'IN_PROGRESS').length,
    inReview: tasks.filter((t) => t.status === 'IN_REVIEW').length,
    done: tasks.filter((t) => t.status === 'DONE').length,
  };

  return (
    <div
      className="assignee-group-container"
      id={`assignee-group-${assigneeKey}`}
      style={{
        marginBottom: '1.25rem',
        border: '1px solid var(--border-glass)',
        borderRadius: 'var(--radius-lg)',
        background: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'var(--backdrop-filter)',
        overflow: isExpanded ? 'visible' : 'hidden',
        position: 'relative',
        transition: 'border-color 0.2s ease',
      }}
    >
      {/* Collapsible Header */}
      <div
        className="assignee-group-header"
        id={`assignee-header-${assigneeKey}`}
        onClick={onToggle}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1rem 1.35rem',
          cursor: 'pointer',
          background: isExpanded ? 'rgba(30, 41, 59, 0.4)' : 'rgba(15, 23, 42, 0.6)',
          borderBottom: isExpanded ? '1px solid var(--border-glass)' : 'none',
          userSelect: 'none',
          transition: 'background 0.15s ease',
        }}
      >
        {/* Left: Avatar + Name + Summary Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          {/* Avatar */}
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: isUnassigned ? 'rgba(148, 163, 184, 0.12)' : avatarStyle.bg,
              color: isUnassigned ? '#94a3b8' : avatarStyle.text,
              border: `1px solid ${isUnassigned ? 'rgba(148, 163, 184, 0.25)' : avatarStyle.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.82rem',
              fontWeight: 700,
              letterSpacing: '0.02em',
              flexShrink: 0,
            }}
          >
            {isUnassigned ? <UserX size={17} /> : getInitials(assignee.name)}
          </div>

          {/* User Name & Details */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span
                style={{
                  fontSize: '1.02rem',
                  fontWeight: 700,
                  color: isUnassigned ? '#94a3b8' : 'var(--text-main)',
                }}
              >
                {displayName}
              </span>

              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  background: 'rgba(255, 255, 255, 0.06)',
                  padding: '1px 8px',
                  borderRadius: 'var(--radius-full)',
                }}
              >
                {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
              </span>
            </div>

            {/* Dynamic Status Statistics Chips */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginTop: '0.25rem',
                flexWrap: 'wrap',
              }}
            >
              {stats.todo > 0 && (
                <span
                  style={{
                    fontSize: '0.72rem',
                    color: '#94a3b8',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#94a3b8' }} />
                  {stats.todo} To Do
                </span>
              )}

              {stats.inProgress > 0 && (
                <span
                  style={{
                    fontSize: '0.72rem',
                    color: '#38bdf8',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#38bdf8' }} />
                  {stats.inProgress} In Progress
                </span>
              )}

              {stats.inReview > 0 && (
                <span
                  style={{
                    fontSize: '0.72rem',
                    color: '#c084fc',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#c084fc' }} />
                  {stats.inReview} In Review
                </span>
              )}

              {stats.done > 0 && (
                <span
                  style={{
                    fontSize: '0.72rem',
                    color: '#34d399',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#34d399' }} />
                  {stats.done} Done
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Expand/Collapse Arrow */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-subtle)' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>
            {isExpanded ? 'Collapse' : 'Expand'}
          </span>
          <ChevronDown
            size={18}
            style={{
              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease',
            }}
          />
        </div>
      </div>

      {/* Task Cards Container (Collapsible Body) */}
      {isExpanded && (
        <div
          className="assignee-group-body"
          style={{
            padding: '1.25rem 1.35rem 0.65rem',
            animation: 'fade-in 0.15s ease',
          }}
        >
          {tasks.map((task) => (
            <JiraTaskCard
              key={task.id}
              task={task}
              onStatusChange={onStatusChange}
              onEditTask={onEditTask}
            />
          ))}
        </div>
      )}
    </div>
  );
};
