import React, { useState } from 'react';
import { Client } from '../types';
import { clientService } from '../services/clientService';
import { X, Check } from 'lucide-react';

interface ClientModalProps {
  onClose: () => void;
  onSuccess: (savedClient: Client) => void;
}

export const ClientModal: React.FC<ClientModalProps> = ({ onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !company.trim()) {
      setError('All fields are required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const created = await clientService.createClient({
        name: name.trim(),
        email: email.trim(),
        company: company.trim(),
      });
      onSuccess(created);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to create client');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" id="client-modal-overlay">
      <div className="modal-content" id="client-modal-content">
        <div className="modal-header">
          <h2 className="modal-title">Add New Client</h2>
          <button className="modal-close" onClick={onClose} id="client-modal-close-btn">
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
            <label className="form-label" htmlFor="client-name-input">
              Client Contact Name *
            </label>
            <input
              id="client-name-input"
              type="text"
              className="form-input"
              placeholder="e.g. Tony Stark"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="client-email-input">
              Email Address *
            </label>
            <input
              id="client-email-input"
              type="email"
              className="form-input"
              placeholder="e.g. contact@starkindustries.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="client-company-input">
              Company Name *
            </label>
            <input
              id="client-company-input"
              type="text"
              className="form-input"
              placeholder="e.g. Stark Industries Ltd."
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              required
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
              id="client-modal-cancel-btn"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
              id="client-modal-submit-btn"
            >
              <Check size={16} />
              <span>{isSubmitting ? 'Adding...' : 'Add Client'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
