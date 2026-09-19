import React, { useState, useEffect } from 'react';
import { Client, Project } from '../types';
import { projectService } from '../services/projectService';
import { clientService } from '../services/clientService';
import { X, Check } from 'lucide-react';

interface ProjectModalProps {
  onClose: () => void;
  onSuccess: (savedProject: Project) => void;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({ onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [clientId, setClientId] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const clientList = await clientService.getClients();
        setClients(clientList);
        if (clientList.length > 0) {
          setClientId(clientList[0].id);
        }
      } catch (err) {
        console.error('Failed to load clients:', err);
      }
    };
    fetchClients();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Project name is required');
      return;
    }
    if (!clientId) {
      setError('Client selection is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const created = await projectService.createProject({
        name: name.trim(),
        description: description.trim() || undefined,
        clientId,
      });
      onSuccess(created);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to create project');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" id="project-modal-overlay">
      <div className="modal-content" id="project-modal-content">
        <div className="modal-header">
          <h2 className="modal-title">Create New Project</h2>
          <button className="modal-close" onClick={onClose} id="project-modal-close-btn">
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
            <label className="form-label" htmlFor="project-name-input">
              Project Name *
            </label>
            <input
              id="project-name-input"
              type="text"
              className="form-input"
              placeholder="e.g. Autonomous Drone Telemetry Hub"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="project-client-select">
              Client *
            </label>
            <select
              id="project-client-select"
              className="form-select"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              required
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.company})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="project-description-input">
              Description
            </label>
            <textarea
              id="project-description-input"
              className="form-textarea"
              placeholder="Key project scope and deliverables..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
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
              id="project-modal-cancel-btn"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
              id="project-modal-submit-btn"
            >
              <Check size={16} />
              <span>{isSubmitting ? 'Creating...' : 'Create Project'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
