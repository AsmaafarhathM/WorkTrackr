import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Layers, ShieldCheck, UserCheck, Code, LogIn, Sparkles } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide both email and password');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Invalid email or password');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickLogin = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Password123!');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(ellipse at top, #1e1b4b 0%, #090d16 70%)',
        padding: '2rem 1.5rem',
      }}
    >
      <div
        className="glass-card"
        style={{
          maxWidth: '460px',
          width: '100%',
          padding: '2.5rem',
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
              borderRadius: 'var(--radius-lg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
              boxShadow: '0 0 24px var(--primary-glow)',
            }}
          >
            <Layers size={26} color="#fff" />
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.025em' }}>
            WorkTrackr
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Real-Time Client Project Dashboard
          </p>
        </div>

        {error && (
          <div
            id="login-error-alert"
            style={{
              padding: '0.75rem 1rem',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              borderRadius: 'var(--radius-md)',
              marginBottom: '1.25rem',
              fontSize: '0.85rem',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder="user@worktrackr.io"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="form-input"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            id="login-submit-button"
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.75rem', padding: '0.75rem' }}
            disabled={isSubmitting}
          >
            <LogIn size={16} />
            <span>{isSubmitting ? 'Signing in...' : 'Sign In'}</span>
          </button>
        </form>

        {/* 1-Click Demo Accounts */}
        <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border-glass)', paddingTop: '1.5rem' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.75rem',
              color: 'var(--text-subtle)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              fontWeight: 700,
              marginBottom: '0.75rem',
            }}
          >
            <Sparkles size={14} style={{ color: '#a855f7' }} />
            <span>Quick Test Logins (Assessment Ready)</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button
              type="button"
              id="demo-login-admin"
              className="demo-pill"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
              onClick={() => handleQuickLogin('admin@worktrackr.io')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={14} style={{ color: '#f87171' }} />
                <span>Admin (Arthur)</span>
              </div>
              <span style={{ color: 'var(--text-subtle)', fontSize: '0.72rem' }}>All Projects</span>
            </button>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <button
                type="button"
                id="demo-login-pm1"
                className="demo-pill"
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                onClick={() => handleQuickLogin('pm.sarah@worktrackr.io')}
              >
                <UserCheck size={14} style={{ color: '#c084fc' }} />
                <span>PM Sarah (Alpha, Gamma)</span>
              </button>

              <button
                type="button"
                id="demo-login-pm2"
                className="demo-pill"
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                onClick={() => handleQuickLogin('pm.marcus@worktrackr.io')}
              >
                <UserCheck size={14} style={{ color: '#c084fc' }} />
                <span>PM Marcus (Beta)</span>
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <button
                type="button"
                id="demo-login-dev1"
                className="demo-pill"
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                onClick={() => handleQuickLogin('dev.alex@worktrackr.io')}
              >
                <Code size={14} style={{ color: '#38bdf8' }} />
                <span>Dev Alex</span>
              </button>

              <button
                type="button"
                id="demo-login-dev2"
                className="demo-pill"
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                onClick={() => handleQuickLogin('dev.ravi@worktrackr.io')}
              >
                <Code size={14} style={{ color: '#38bdf8' }} />
                <span>Dev Ravi</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
