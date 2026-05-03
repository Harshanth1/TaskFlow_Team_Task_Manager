import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Zap } from 'lucide-react';
import './Auth.css';

export default function RegisterPage() {
  const { user, register, loading, error, clearError } = useAuth();
  const toast = useToast();
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', confirmPassword: '', role: 'member',
  });
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  const handleChange = (e) => {
    clearError();
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setSubmitting(true);
    const result = await register(formData.name, formData.email, formData.password, formData.role);
    if (result.success) {
      toast.success('Account created successfully!');
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
            <h1>Create Account</h1>
            <p>Join TaskFlow and manage your projects</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="input-group">
              <label htmlFor="register-name">Full Name</label>
              <input id="register-name" type="text" name="name" className="input-field"
                placeholder="John Doe" value={formData.name} onChange={handleChange} required />
            </div>
            <div className="input-group">
              <label htmlFor="register-email">Email Address</label>
              <input id="register-email" type="email" name="email" className="input-field"
                placeholder="you@example.com" value={formData.email} onChange={handleChange} required />
            </div>
            <div className="input-group">
              <label htmlFor="register-role">Role</label>
              <select id="register-role" name="role" className="select-field"
                value={formData.role} onChange={handleChange}>
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="input-group">
              <label htmlFor="register-password">Password</label>
              <input id="register-password" type="password" name="password" className="input-field"
                placeholder="Min 6 characters" value={formData.password} onChange={handleChange}
                required minLength={6} />
            </div>
            <div className="input-group">
              <label htmlFor="register-confirm">Confirm Password</label>
              <input id="register-confirm" type="password" name="confirmPassword" className="input-field"
                placeholder="Repeat password" value={formData.confirmPassword} onChange={handleChange}
                required minLength={6} />
            </div>
            {error && <div className="auth-error">{error}</div>}
            <button type="submit" className="btn btn-primary btn-lg auth-submit" disabled={submitting}>
              {submitting ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : 'Create Account'}
            </button>
          </form>

          <div className="auth-footer">
            <p>Already have an account? <Link to="/login" className="auth-link">Sign in</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
}
