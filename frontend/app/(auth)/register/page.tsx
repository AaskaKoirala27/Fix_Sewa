'use client';

import { useState } from 'react';
import { register } from '@/lib/auth';

export default function RegisterPage() {
  const [form, setForm] = useState({ full_name: '', username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const data = await register(form);
      setSuccess(data.detail);
      setForm({ full_name: '', username: '', email: '', password: '' });
    } catch (err: unknown) {
      const resp = (err as { response?: { data?: Record<string, string[]> & { detail?: string } } })?.response?.data;
      if (resp?.detail) {
        setError(resp.detail);
      } else if (resp) {
        const msgs = Object.entries(resp)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
          .join(' | ');
        setError(msgs);
      } else {
        setError('An error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-wrapper">
          <div className="login-logo">
            Fix Sewa
            <span>Management System</span>
          </div>

          <h1 className="login-title">Request access</h1>
          <p className="login-subtitle">Your account will be reviewed by an administrator</p>

          {error && <div className="login-error">{error}</div>}
          {success && <div className="login-success">{success}</div>}

          <form className="form-custom" style={{ width: '100%' }} onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="full_name">Full name</label>
              <input
                id="full_name"
                className="form-input"
                type="text"
                placeholder="Your full name"
                value={form.full_name}
                onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                id="username"
                className="form-input"
                type="text"
                placeholder="Choose a username"
                value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                required
                autoComplete="username"
              />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                className="form-input"
                type="email"
                placeholder="your@email.com"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required
                autoComplete="email"
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                className="form-input"
                type="password"
                placeholder="Minimum 6 characters"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>
            <button
              type="submit"
              className="btn-primary-custom"
              style={{ width: '100%', justifyContent: 'center' }}
              disabled={loading}
            >
              {loading ? 'Submitting…' : 'Request access'}
            </button>
          </form>

          <p style={{ marginTop: '1.5rem', fontSize: 'var(--font-sm)', color: 'var(--color-text-secondary)' }}>
            Already have an account? <a href="/login">Sign in</a>
          </p>
        </div>
      </div>
    </div>
  );
}
