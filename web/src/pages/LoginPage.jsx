import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import Icon from '../components/Icon';
import loginBackground from '../assets/login-background.svg';

function getErrorMessage(error) {
  if (error instanceof Error) return error.message;
  return 'Unknown error';
}

export default function LoginPage() {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('admin@riskapp.local');
  const [password, setPassword] = useState('Admin123!');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  async function onSubmit(event) {
    event.preventDefault();
    setError('');

    try {
      setSubmitting(true);
      await login(email, password);
      const destination = location.state?.from?.pathname || '/dashboard';
      navigate(destination, { replace: true });
    } catch (submitError) {
      setError(`Login failed: ${getErrorMessage(submitError)}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main
      className="login-shell"
      style={{
        '--login-background-image': `url(${loginBackground})`,
      }}
    >
      <section className="login-hero">
        <div className="login-quote-overlay">
          <div className="login-quote-mark">&ldquo;</div>
          <blockquote>Risk comes from not knowing what you&apos;re doing.</blockquote>
          <div className="login-quote-author">Warren Buffett</div>
        </div>
      </section>

      <section className="login-card">
        <div className="login-card-header">
          <h2>Sign In to ERM</h2>
        </div>

        {error ? <p className="error">{error}</p> : null}

        <form className="login-form" onSubmit={onSubmit}>
          <label>
            <span className="field-label">Email <span className="required-marker" aria-hidden="true">*</span></span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="username"
              required
            />
          </label>

          <label>
            <span className="field-label">Password <span className="required-marker" aria-hidden="true">*</span></span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
          </label>

          <button type="submit" className="primary-btn login-submit" disabled={submitting}>
            <Icon name="login" />
            {submitting ? 'Signing In...' : 'Sign In to ERM'}
          </button>
        </form>
      </section>
    </main>
  );
}
