import React, { useState, useRef, useEffect } from 'react';
import { Task, TaskStatus, TaskPriority } from '../types';
import { useAuth } from '../context/AuthContext';
import { format, isPast } from 'date-fns';
import {
  Calendar,
  AlertTriangle,
  ChevronDown,
  FolderKanban,
  Check,
  Loader2,
  Clock,
  Sparkles,
} from 'lucide-react';

interface JiraTaskCardProps {
  task: Task;
  onStatusChange: (taskId: string, newStatus: TaskStatus) => Promise<void>;
  onEditTask?: (task: Task) => void;
}

const STATUS_CONFIG: Record<
  TaskStatus,
  { label: string; dotColor: string; bg: string; text: string; border: string }
> = {
  TODO: {
    label: 'To Do',
    dotColor: '#94a3b8',
    bg: 'rgba(148, 163, 184, 0.12)',
    text: '#cbd5e1',
    border: 'rgba(148, 163, 184, 0.25)',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    dotColor: '#38bdf8',
    bg: 'rgba(56, 189, 248, 0.12)',
    text: '#38bdf8',
    border: 'rgba(56, 189, 248, 0.3)',
  },
  IN_REVIEW: {
    label: 'In Review',
    dotColor: '#c084fc',
    bg: 'rgba(192, 132, 252, 0.12)',
    text: '#c084fc',
    border: 'rgba(192, 132, 252, 0.3)',
  },
  DONE: {
    label: 'Done',
    dotColor: '#34d399',
    bg: 'rgba(52, 211, 153, 0.12)',
    text: '#34d399',
    border: 'rgba(52, 211, 153, 0.3)',
  },
};

const PRIORITY_CONFIG: Record<
  TaskPriority,
  { label: string; bg: string; text: string; border: string }
> = {
  CRITICAL: {
    label: 'CRITICAL',
    bg: 'rgba(239, 68, 68, 0.16)',
    text: '#f87171',
    border: 'rgba(239, 68, 68, 0.4)',
  },
  HIGH: {
    label: 'HIGH',
    bg: 'rgba(245, 158, 11, 0.14)',
    text: '#fbbf24',
    border: 'rgba(245, 158, 11, 0.3)',
  },
  MEDIUM: {
    label: 'MEDIUM',
    bg: 'rgba(59, 130, 246, 0.12)',
    text: '#60a5fa',
    border: 'rgba(59, 130, 246, 0.25)',
  },
  LOW: {
    label: 'LOW',
    bg: 'rgba(100, 116, 139, 0.12)',
    text: '#94a3b8',
    border: 'rgba(100, 116, 139, 0.25)',
  },
};

export const JiraTaskCard: React.FC<JiraTaskCardProps> = ({
  task,
  onStatusChange,
  onEditTask,
}) => {
  const { user } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!dropdownOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [dropdownOpen]);

  const isUserAllowedToUpdate = () => {
    if (!user) return false;
    if (user.role === 'ADMIN') return true;
    if (user.role === 'PROJECT_MANAGER' && task.project?.ownerId === user.id) return true;
    if (user.role === 'DEVELOPER' && task.assignedToId === user.id) return true;
    return false;
  };

  const handleSelectStatus = async (newStatus: TaskStatus) => {
    if (newStatus === task.status || isUpdating) {
      setDropdownOpen(false);
      return;
    }

    setIsUpdating(true);
    setDropdownOpen(false);

    try {
      await onStatusChange(task.id, newStatus);
    } catch (err) {
      // Error handled by parent or alert; rollback remains natural because status state isn't locally detached
    } finally {
      setIsUpdating(false);
    }
  };

  const isTaskOverdue =
    task.isOverdue || (task.status !== 'DONE' && isPast(new Date(task.dueDate)));

  const currentStatusConfig = STATUS_CONFIG[task.status] || STATUS_CONFIG.TODO;
  const currentPriorityConfig = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.MEDIUM;
  const canUpdate = isUserAllowedToUpdate();

  return (
    <div
      className="jira-task-card"
      id={`jira-task-card-${task.id}`}
      style={{
        background: 'rgba(15, 23, 42, 0.65)',
        border: '1px solid var(--border-glass)',
        borderRadius: 'var(--radius-md)',
        padding: '1.15rem 1.35rem',
        marginBottom: '0.85rem',
        position: 'relative',
        zIndex: dropdownOpen ? 80 : 1,
      }}
    >
      {/* Top Row: Task ID + Title */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', flex: 1 }}>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.78rem',
              fontWeight: 700,
              color: 'var(--primary)',
              background: 'rgba(99, 102, 241, 0.12)',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              padding: '2px 8px',
              borderRadius: 'var(--radius-sm)',
              flexShrink: 0,
              marginTop: '1px',
            }}
          >
            #{task.taskNumber}
          </span>

          <div style={{ flex: 1 }}>
            <h4
              onClick={() => onEditTask && onEditTask(task)}
              style={{
                fontSize: '0.98rem',
                fontWeight: 600,
                color: 'var(--text-main)',
                cursor: onEditTask ? 'pointer' : 'default',
                lineHeight: 1.4,
                transition: 'color 0.15s ease',
              }}
              className="jira-task-title"
              title={onEditTask ? 'Click to view / edit task details' : undefined}
            >
              {task.title}
            </h4>

            {task.description && (
              <p
                style={{
                  fontSize: '0.82rem',
                  color: 'var(--text-muted)',
                  marginTop: '0.35rem',
                  lineHeight: 1.45,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {task.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Middle Row: Project Pill, Priority, Due Date, Overdue Badge */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem',
          marginTop: '0.9rem',
          paddingTop: '0.75rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.04)',
        }}
      >
        {/* Project Tag */}
        {task.project && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.75rem',
              fontWeight: 500,
              color: 'var(--text-muted)',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-glass)',
              padding: '2px 8px',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <FolderKanban size={13} style={{ color: 'var(--primary)' }} />
            <span>{task.project.name}</span>
          </div>
        )}

        {/* Priority Badge */}
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            fontSize: '0.72rem',
            fontWeight: 700,
            letterSpacing: '0.04em',
            padding: '2px 8px',
            borderRadius: 'var(--radius-sm)',
            background: currentPriorityConfig.bg,
            color: currentPriorityConfig.text,
            border: `1px solid ${currentPriorityConfig.border}`,
          }}
        >
          {currentPriorityConfig.label}
        </span>

        {/* Due Date */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            fontSize: '0.78rem',
            color: isTaskOverdue ? '#f87171' : 'var(--text-subtle)',
            fontWeight: isTaskOverdue ? 600 : 400,
          }}
        >
          <Calendar size={13} />
          <span>{format(new Date(task.dueDate), 'MMM d, yyyy')}</span>
        </div>

        {/* Overdue Badge */}
        {isTaskOverdue && (
          <span
            className="badge badge-overdue"
            style={{ fontSize: '0.7rem', padding: '2px 7px' }}
          >
            <AlertTriangle size={11} />
            OVERDUE
          </span>
        )}

        {/* Status Dropdown Controller (Aligned Right or Inline) */}
        <div
          style={{
            marginLeft: 'auto',
            position: 'relative',
            zIndex: dropdownOpen ? 100 : 'auto',
          }}
          ref={dropdownRef}
        >
          {canUpdate ? (
            <div>
              <button
                type="button"
                id={`status-dropdown-btn-${task.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setDropdownOpen((prev) => !prev);
                }}
                disabled={isUpdating}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  padding: '0.35rem 0.75rem',
                  borderRadius: 'var(--radius-md)',
                  background: currentStatusConfig.bg,
                  color: currentStatusConfig.text,
                  border: `1px solid ${currentStatusConfig.border}`,
                  cursor: isUpdating ? 'wait' : 'pointer',
                  transition: 'all 0.15s ease',
                  outline: 'none',
                }}
              >
                {isUpdating ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <span
                    style={{
                      width: '7px',
                      height: '7px',
                      borderRadius: '50%',
                      background: currentStatusConfig.dotColor,
                    }}
                  />
                )}
                <span>{currentStatusConfig.label}</span>
                <ChevronDown
                  size={14}
                  style={{
                    transform: dropdownOpen ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.15s',
                  }}
                />
              </button>

              {/* Status Dropdown Menu */}
              {dropdownOpen && (
                <div
                  className="jira-status-menu"
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: 'calc(100% + 4px)',
                    zIndex: 999,
                    minWidth: '160px',
                    background: '#0f172a',
                    border: '1px solid var(--border-glass-hover)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.35rem',
                    boxShadow: 'var(--shadow-lg)',
                  }}
                >
                  {(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'] as TaskStatus[]).map(
                    (statusKey) => {
                      const cfg = STATUS_CONFIG[statusKey];
                      const isCurrent = task.status === statusKey;

                      return (
                        <button
                          key={statusKey}
                          type="button"
                          id={`status-opt-${task.id}-${statusKey.toLowerCase()}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectStatus(statusKey);
                          }}
                          className={`jira-status-option ${isCurrent ? 'active' : ''}`}
                          style={{
                            color: cfg.text,
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span
                              style={{
                                width: '7px',
                                height: '7px',
                                borderRadius: '50%',
                                background: cfg.dotColor,
                              }}
                            />
                            <span>{cfg.label}</span>
                          </div>
                          {isCurrent && <Check size={13} />}
                        </button>
                      );
                    }
                  )}
                </div>
              )}
            </div>
          ) : (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                fontSize: '0.8rem',
                fontWeight: 600,
                padding: '0.35rem 0.75rem',
                borderRadius: 'var(--radius-md)',
                background: currentStatusConfig.bg,
                color: currentStatusConfig.text,
                border: `1px solid ${currentStatusConfig.border}`,
                opacity: 0.85,
              }}
            >
              <span
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  background: currentStatusConfig.dotColor,
                }}
              />
              <span>{currentStatusConfig.label}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
