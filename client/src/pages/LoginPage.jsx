import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Zap } from 'lucide-react';
import './Auth.css';

export default function LoginPage() {
  const { user, login, loading, error, clearError } = useAuth();
  const toast = useToast();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  const handleChange = (e) => {
    clearError();
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const result = await login(formData.email, formData.password);
    if (result.success) {
      toast.success('Welcome back!');
    } else {
      toast.error(result.message);
    }
    setSubmitting(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-container fade-in">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo"><Zap size={20} color="white" /></div>
            <h1>Welcome Back</h1>
            <p>Sign in to your TaskFlow account</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="input-group">
              <label htmlFor="login-email">Email Address</label>
              <input id="login-email" type="email" name="email" className="input-field"
                placeholder="you@example.com" value={formData.email}
                onChange={handleChange} required />
            </div>
            <div className="input-group">
              <label htmlFor="login-password">Password</label>
              <input id="login-password" type="password" name="password" className="input-field"
                placeholder="••••••••" value={formData.password}
                onChange={handleChange} required minLength={6} />
            </div>
            {error && <div className="auth-error">{error}</div>}
            <button type="submit" className="btn btn-primary btn-lg auth-submit" disabled={submitting}>
              {submitting ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : 'Sign In'}
            </button>
          </form>

          <div className="auth-footer">
            <p>Don't have an account? <Link to="/register" className="auth-link">Create one</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
}
