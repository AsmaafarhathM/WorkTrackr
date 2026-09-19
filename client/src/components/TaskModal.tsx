import React, { useState, useEffect } from 'react';
import { Project, User, Task, TaskStatus, TaskPriority } from '../types';
import { taskService } from '../services/taskService';
import { projectService } from '../services/projectService';
import { userService } from '../services/userService';
import { X, Check } from 'lucide-react';

interface TaskModalProps {
  taskToEdit?: Task | null;
  onClose: () => void;
  onSuccess: (savedTask: Task) => void;
}

export const TaskModal: React.FC<TaskModalProps> = ({ taskToEdit, onClose, onSuccess }) => {
  const [title, setTitle] = useState(taskToEdit?.title || '');
  const [description, setDescription] = useState(taskToEdit?.description || '');
  const [status, setStatus] = useState<TaskStatus>(taskToEdit?.status || 'TODO');
  const [priority, setPriority] = useState<TaskPriority>(taskToEdit?.priority || 'MEDIUM');
  const [dueDate, setDueDate] = useState(
    taskToEdit?.dueDate ? taskToEdit.dueDate.split('T')[0] : ''
  );
  const [projectId, setProjectId] = useState(taskToEdit?.projectId || '');
  const [assignedToId, setAssignedToId] = useState(taskToEdit?.assignedToId || '');

  const [projects, setProjects] = useState<Project[]>([]);
  const [developers, setDevelopers] = useState<User[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projectsData, devsData] = await Promise.all([
          projectService.getProjects(),
          userService.getUsers('DEVELOPER'),
        ]);
        setProjects(projectsData);
        setDevelopers(devsData);
        if (!projectId && projectsData.length > 0) {
          setProjectId(projectsData[0].id);
        }
      } catch (err: any) {
        console.error('Failed to load modal metadata:', err);
      }
    };
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Task title is required');
      return;
    }
    if (!dueDate) {
      setError('Due date is required');
      return;
    }
    if (!projectId) {
      setError('Project selection is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || undefined,
        status,
        priority,
        dueDate: new Date(dueDate).toISOString(),
        projectId,
        assignedToId: assignedToId || null,
      };

      let result: Task;
      if (taskToEdit) {
        result = await taskService.updateTask(taskToEdit.id, payload);
      } else {
        result = await taskService.createTask(payload);
      }

      onSuccess(result);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to save task');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" id="task-modal-overlay">
      <div className="modal-content" id="task-modal-content">
        <div className="modal-header">
          <h2 className="modal-title">{taskToEdit ? 'Edit Task' : 'Create New Task'}</h2>
          <button className="modal-close" onClick={onClose} id="task-modal-close-btn">
            <X size={20} />
          </button>
        </div>

        {error && (
          <div
            style={{
              padding: '0.75rem 1rem',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              borderRadius: 'var(--radius-md)',
              marginBottom: '1rem',
              fontSize: '0.85rem',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="task-title-input">
              Task Title *
            </label>
            <input
              id="task-title-input"
              type="text"
              className="form-input"
              placeholder="e.g. Implement OAuth2 Refresh Token Rotation"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="task-description-input">
              Description
            </label>
            <textarea
              id="task-description-input"
              className="form-textarea"
              placeholder="Provide technical requirements, criteria, and dependencies..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="task-project-select">
                Project *
              </label>
              <select
                id="task-project-select"
                className="form-select"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                required
                disabled={Boolean(taskToEdit)}
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="task-assignee-select">
                Assigned Developer
              </label>
              <select
                id="task-assignee-select"
                className="form-select"
                value={assignedToId}
                onChange={(e) => setAssignedToId(e.target.value)}
              >
                <option value="">Unassigned</option>
                {developers.map((dev) => (
                  <option key={dev.id} value={dev.id}>
                    {dev.name} ({dev.email})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="task-priority-select">
                Priority
              </label>
              <select
                id="task-priority-select"
                className="form-select"
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="task-status-select">
                Status
              </label>
              <select
                id="task-status-select"
                className="form-select"
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
              >
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="IN_REVIEW">In Review</option>
                <option value="DONE">Done</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="task-due-date-input">
                Due Date *
              </label>
              <input
                id="task-due-date-input"
                type="date"
                className="form-input"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '0.75rem',
              marginTop: '1.5rem',
              borderTop: '1px solid var(--border-glass)',
              paddingTop: '1.25rem',
            }}
          >
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              id="task-modal-cancel-btn"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
              id="task-modal-submit-btn"
            >
              <Check size={16} />
              <span>{isSubmitting ? 'Saving...' : taskToEdit ? 'Update Task' : 'Create Task'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
