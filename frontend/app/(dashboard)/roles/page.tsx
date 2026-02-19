'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import type { Role } from '@/lib/types';
import StatusBadge from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ role_name: '', description: '', is_active: true });
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    api.get('/roles/').then(r => setRoles(Array.isArray(r.data) ? r.data : r.data.results ?? [])).finally(() => setLoading(false));
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.role_name.trim()) { setApiError('Role name is required'); return; }
    setSubmitting(true);
    setApiError('');
    try {
      const { data } = await api.post<Role>('/roles/', form);
      setRoles(prev => [...prev, data]);
      setShowForm(false);
      setForm({ role_name: '', description: '', is_active: true });
    } catch {
      setApiError('Failed to create role.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this role?')) return;
    await api.delete(`/roles/${id}/`);
    setRoles(prev => prev.filter(r => r.id !== id));
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Roles</h1>
          <p className="page-subtitle">Manage user roles and permissions</p>
        </div>
        <button className="btn-primary-custom" onClick={() => setShowForm(s => !s)}>
          {showForm ? 'Cancel' : '+ New Role'}
        </button>
      </div>

      {showForm && (
        <div className="card-custom">
          <div className="card-header-custom"><h2>Create Role</h2></div>
          <div className="card-body-custom">
            {apiError && <div className="login-error" style={{ marginBottom: '1rem' }}>{apiError}</div>}
            <form className="form-custom" onSubmit={handleCreate}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0 1.5rem' }}>
                <div className="form-group">
                  <label>Role Name *</label>
                  <input className="form-input" type="text" value={form.role_name} onChange={e => setForm(f => ({ ...f, role_name: e.target.value }))} placeholder="e.g. Admin" required />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <input className="form-input" type="text" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional description" />
                </div>
              </div>
              <button type="submit" className="btn-primary-custom btn-sm-custom" disabled={submitting}>
                {submitting ? 'Creating…' : 'Create Role'}
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="card-custom">
        <div className="card-body-custom" style={{ padding: 0 }}>
          {loading ? (
            <p style={{ padding: '1.5rem', color: 'var(--color-text-muted)' }}>Loading…</p>
          ) : roles.length === 0 ? (
            <EmptyState icon="🔐" title="No roles" description="Create your first role." />
          ) : (
            <div className="table-scroll-wrapper">
              <table className="table-custom">
                <thead>
                  <tr>
                    <th>Role Name</th>
                    <th>Description</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {roles.map(r => (
                    <tr key={r.id}>
                      <td><strong>{r.role_name}</strong></td>
                      <td>{r.description || '—'}</td>
                      <td><StatusBadge status={r.is_active ? 'active' : 'inactive'} label={r.is_active ? 'Active' : 'Inactive'} /></td>
                      <td>
                        <div className="action-links">
                          <a className="action-danger" href="#" onClick={e => { e.preventDefault(); handleDelete(r.id); }}>Delete</a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
