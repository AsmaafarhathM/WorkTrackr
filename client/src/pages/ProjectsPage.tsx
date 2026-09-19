import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { projectService } from '../services/projectService';
import { Project } from '../types';
import { ProjectModal } from '../components/ProjectModal';
import { FolderKanban, Plus, Building2, User, CheckSquare } from 'lucide-react';
import { Link } from 'react-router-dom';

export const ProjectsPage: React.FC = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchProjects = async () => {
    try {
      const data = await projectService.getProjects();
      setProjects(data);
    } catch (err) {
      console.error('Failed to load projects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const canCreateProject = user?.role === 'ADMIN' || user?.role === 'PROJECT_MANAGER';

  return (
    <div id="projects-page-container">
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
            Projects
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.2rem' }}>
            {user?.role === 'ADMIN' && 'System-wide client projects directory'}
            {user?.role === 'PROJECT_MANAGER' && 'Projects created and managed by you'}
            {user?.role === 'DEVELOPER' && 'Projects you have assigned tasks in'}
          </p>
        </div>

        {canCreateProject && (
          <button
            id="create-project-btn"
            onClick={() => setIsModalOpen(true)}
            className="btn btn-primary"
          >
            <Plus size={16} />
            <span>Create Project</span>
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>
          <p>Loading projects...</p>
        </div>
      ) : projects.length === 0 ? (
        <div
          className="glass-card"
          style={{ textAlign: 'center', padding: '4rem 1.5rem', color: 'var(--text-subtle)' }}
        >
          <FolderKanban size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
          <p style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>
            No projects available
          </p>
          <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
            {canCreateProject
              ? 'Click "Create Project" to set up your first client project.'
              : 'You do not have any assigned projects at this time.'}
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
          {projects.map((project) => (
            <div
              key={project.id}
              className="glass-card"
              id={`project-card-${project.id}`}
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
                      background: 'rgba(99, 102, 241, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--primary)',
                    }}
                  >
                    <FolderKanban size={18} />
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
                    {project._count?.tasks || 0} tasks
                  </span>
                </div>

                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  {project.name}
                </h3>

                <p
                  style={{
                    fontSize: '0.85rem',
                    color: 'var(--text-muted)',
                    marginTop: '0.5rem',
                    lineHeight: 1.5,
                  }}
                >
                  {project.description || 'No description provided.'}
                </p>

                <div
                  style={{
                    marginTop: '1.25rem',
                    paddingTop: '1rem',
                    borderTop: '1px solid var(--border-glass)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.4rem',
                    fontSize: '0.8rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
                    <Building2 size={14} style={{ color: 'var(--text-subtle)' }} />
                    <span>Client: <strong style={{ color: 'var(--text-main)' }}>{project.client?.name}</strong></span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
                    <User size={14} style={{ color: 'var(--text-subtle)' }} />
                    <span>Owner: <strong style={{ color: 'var(--text-main)' }}>{project.owner?.name}</strong></span>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-glass)' }}>
                <Link
                  to={`/tasks?projectId=${project.id}`}
                  className="btn btn-secondary btn-sm"
                  style={{ width: '100%' }}
                >
                  <CheckSquare size={14} />
                  <span>View Project Tasks</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <ProjectModal
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false);
            fetchProjects();
          }}
        />
      )}
    </div>
  );
};
