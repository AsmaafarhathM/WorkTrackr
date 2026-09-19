import React from 'react';
import { Task, TaskStatus } from '../types';
import { useAuth } from '../context/AuthContext';
import { format, isPast } from 'date-fns';
import { Calendar, User as UserIcon, AlertTriangle, ArrowRightCircle } from 'lucide-react';

interface TaskTableProps {
  tasks: Task[];
  onStatusChange: (taskId: string, newStatus: TaskStatus) => Promise<void>;
  onEditTask?: (task: Task) => void;
}

export const TaskTable: React.FC<TaskTableProps> = ({ tasks, onStatusChange, onEditTask }) => {
  const { user } = useAuth();

  const getPriorityTag = (priority: string) => {
    return <span className={`priority-tag priority-${priority}`}>{priority}</span>;
  };

  const getStatusBadge = (status: TaskStatus) => {
    switch (status) {
      case 'TODO':
        return <span className="badge badge-todo">To Do</span>;
      case 'IN_PROGRESS':
        return <span className="badge badge-in_progress">In Progress</span>;
      case 'IN_REVIEW':
        return <span className="badge badge-in_review">In Review</span>;
      case 'DONE':
        return <span className="badge badge-done">Done</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };

  const isUserAllowedToUpdateStatus = (task: Task) => {
    if (!user) return false;
    if (user.role === 'ADMIN') return true;
    if (user.role === 'PROJECT_MANAGER' && task.project?.ownerId === user.id) return true;
    if (user.role === 'DEVELOPER' && task.assignedToId === user.id) return true;
    return false;
  };

  if (tasks.length === 0) {
    return (
      <div
        className="glass-card"
        style={{
          textAlign: 'center',
          padding: '3rem 1.5rem',
          color: 'var(--text-subtle)',
        }}
      >
        <p style={{ fontSize: '1rem', fontWeight: 600 }}>No tasks match the selected criteria</p>
        <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
          Try adjusting the filter options above or create a new task.
        </p>
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="data-table" id="task-table">
        <thead>
          <tr>
            <th>Task</th>
            <th>Project</th>
            <th>Priority</th>
            <th>Due Date</th>
            <th>Assignee</th>
            <th>Status</th>
            <th>Status Actions</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => {
            const isTaskOverdue =
              task.isOverdue ||
              (task.status !== 'DONE' && isPast(new Date(task.dueDate)));

            const canUpdate = isUserAllowedToUpdateStatus(task);

            return (
              <tr key={task.id} className="table-row" id={`task-row-${task.id}`}>
                {/* Task Title & Number */}
                <td style={{ minWidth: '240px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: 'var(--primary)',
                        background: 'rgba(99, 102, 241, 0.1)',
                        padding: '2px 6px',
                        borderRadius: 'var(--radius-sm)',
                      }}
                    >
                      #{task.taskNumber}
                    </span>
                    <span
                      style={{ fontWeight: 600, color: 'var(--text-main)', cursor: onEditTask ? 'pointer' : 'default' }}
                      onClick={() => onEditTask && onEditTask(task)}
                    >
                      {task.title}
                    </span>
                  </div>
                  {task.description && (
                    <div
                      style={{
                        fontSize: '0.78rem',
                        color: 'var(--text-muted)',
                        marginTop: '0.25rem',
                        maxWidth: '320px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {task.description}
                    </div>
                  )}
                </td>

                {/* Project */}
                <td>
                  <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>
                    {task.project?.name || '—'}
                  </span>
                  {task.project?.client?.name && (
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>
                      {task.project.client.name}
                    </div>
                  )}
                </td>

                {/* Priority */}
                <td>{getPriorityTag(task.priority)}</td>

                {/* Due Date & Overdue Badge */}
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Calendar size={13} style={{ color: 'var(--text-subtle)' }} />
                    <span
                      style={{
                        fontSize: '0.82rem',
                        color: isTaskOverdue ? '#ef4444' : 'var(--text-muted)',
                        fontWeight: isTaskOverdue ? 700 : 400,
                      }}
                    >
                      {format(new Date(task.dueDate), 'MMM d, yyyy')}
                    </span>
                  </div>
                  {isTaskOverdue && (
                    <div style={{ marginTop: '0.2rem' }}>
                      <span className="badge badge-overdue">
                        <AlertTriangle size={11} />
                        OVERDUE
                      </span>
                    </div>
                  )}
                </td>

                {/* Assigned Developer */}
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <div
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: task.assignedTo ? '#3b82f6' : '#64748b',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.68rem',
                        fontWeight: 700,
                      }}
                    >
                      {task.assignedTo ? task.assignedTo.name[0] : '?'}
                    </div>
                    <span style={{ fontSize: '0.82rem' }}>
                      {task.assignedTo?.name || 'Unassigned'}
                    </span>
                  </div>
                </td>

                {/* Status Badge */}
                <td>{getStatusBadge(task.status)}</td>

                {/* Status Transition Action Buttons */}
                <td>
                  {canUpdate ? (
                    <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                      {task.status !== 'TODO' && (
                        <button
                          id={`task-${task.id}-move-todo`}
                          onClick={() => onStatusChange(task.id, 'TODO')}
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem' }}
                          title="Move to Todo"
                        >
                          To Do
                        </button>
                      )}
                      {task.status !== 'IN_PROGRESS' && (
                        <button
                          id={`task-${task.id}-move-inprogress`}
                          onClick={() => onStatusChange(task.id, 'IN_PROGRESS')}
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem', color: '#38bdf8' }}
                          title="Move to In Progress"
                        >
                          In Progress
                        </button>
                      )}
                      {task.status !== 'IN_REVIEW' && (
                        <button
                          id={`task-${task.id}-move-inreview`}
                          onClick={() => onStatusChange(task.id, 'IN_REVIEW')}
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem', color: '#a855f7' }}
                          title="Move to In Review (Notifies PM)"
                        >
                          In Review
                        </button>
                      )}
                      {task.status !== 'DONE' && (
                        <button
                          id={`task-${task.id}-move-done`}
                          onClick={() => onStatusChange(task.id, 'DONE')}
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem', color: '#10b981' }}
                          title="Move to Done"
                        >
                          Done
                        </button>
                      )}
                    </div>
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
                      Read-only
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
