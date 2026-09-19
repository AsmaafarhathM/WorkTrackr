import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { clientService } from '../services/clientService';
import { Client } from '../types';
import { ClientModal } from '../components/ClientModal';
import { Building2, Plus, Mail, Briefcase, Trash2 } from 'lucide-react';
import { Navigate } from 'react-router-dom';

export const ClientsPage: React.FC = () => {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Authorization guard
  if (user && user.role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }

  const fetchClients = async () => {
    try {
      const data = await clientService.getClients();
      setClients(data);
    } catch (err) {
      console.error('Failed to load clients:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleDeleteClient = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete client "${name}"? This will delete associated projects.`)) {
      return;
    }
    try {
      await clientService.deleteClient(id);
      await fetchClients();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to delete client');
    }
  };

  return (
    <div id="clients-page-container">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            Clients Management
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.2rem' }}>
            Add, view, and organize customer organizations and projects.
          </p>
        </div>

        <button
          id="add-client-btn"
          onClick={() => setIsModalOpen(true)}
          className="btn btn-primary"
        >
          <Plus size={16} />
          <span>Add Client</span>
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>
          <p>Loading clients...</p>
        </div>
      ) : clients.length === 0 ? (
        <div
          className="glass-card"
          style={{ textAlign: 'center', padding: '4rem 1.5rem', color: 'var(--text-subtle)' }}
        >
          <Building2 size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
          <p style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>
            No clients added yet
          </p>
          <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
            Add your first client to start creating projects and assigning tasks.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '1.5rem',
          }}
        >
          {clients.map((client) => (
            <div
              key={client.id}
              className="glass-card"
              id={`client-card-${client.id}`}
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '0.75rem',
                  }}
                >
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(6, 182, 212, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--secondary)',
                    }}
                  >
                    <Building2 size={18} />
                  </div>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      background: 'rgba(255, 255, 255, 0.05)',
                      padding: '0.2rem 0.6rem',
                      borderRadius: 'var(--radius-full)',
                      color: 'var(--text-muted)',
                    }}
                  >
                    {client._count?.projects || 0} projects
                  </span>
                </div>

                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  {client.name}
                </h3>

                <div
                  style={{
                    marginTop: '1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.4rem',
                    fontSize: '0.82rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
                    <Briefcase size={14} style={{ color: 'var(--text-subtle)' }} />
                    <span>Company: <strong style={{ color: 'var(--text-main)' }}>{client.company}</strong></span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
                    <Mail size={14} style={{ color: 'var(--text-subtle)' }} />
                    <span>Email: <strong style={{ color: 'var(--text-main)' }}>{client.email}</strong></span>
                  </div>
                </div>
              </div>

              <div
                style={{
                  marginTop: '1.25rem',
                  paddingTop: '1rem',
                  borderTop: '1px solid var(--border-glass)',
                  display: 'flex',
                  justifyContent: 'flex-end',
                }}
              >
                <button
                  id={`delete-client-${client.id}`}
                  onClick={() => handleDeleteClient(client.id, client.name)}
                  className="btn btn-danger btn-sm"
                >
                  <Trash2 size={14} />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <ClientModal
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false);
            fetchClients();
          }}
        />
      )}
    </div>
  );
};
