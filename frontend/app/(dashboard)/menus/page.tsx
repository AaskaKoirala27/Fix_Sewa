'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import type { Menu } from '@/lib/types';
import StatusBadge from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';

export default function MenusPage() {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ menu_name: '', url: '', display_order: '0', is_active: true, icon: '' });
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    api.get('/menus/').then(r => setMenus(Array.isArray(r.data) ? r.data : r.data.results ?? [])).finally(() => setLoading(false));
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.menu_name.trim() || !form.url.trim()) { setApiError('Menu name and URL are required'); return; }
    setSubmitting(true);
    setApiError('');
    try {
      const { data } = await api.post<Menu>('/menus/', { ...form, display_order: Number(form.display_order) });
      setMenus(prev => [...prev, data].sort((a, b) => a.display_order - b.display_order));
      setShowForm(false);
      setForm({ menu_name: '', url: '', display_order: '0', is_active: true, icon: '' });
    } catch {
      setApiError('Failed to create menu item.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this menu item?')) return;
    await api.delete(`/menus/${id}/`);
    setMenus(prev => prev.filter(m => m.id !== id));
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Navigation Menus</h1>
          <p className="page-subtitle">Manage sidebar navigation items</p>
        </div>
        <button className="btn-primary-custom" onClick={() => setShowForm(s => !s)}>
          {showForm ? 'Cancel' : '+ New Menu Item'}
        </button>
      </div>

      {showForm && (
        <div className="card-custom">
          <div className="card-header-custom"><h2>Create Menu Item</h2></div>
          <div className="card-body-custom">
            {apiError && <div className="login-error" style={{ marginBottom: '1rem' }}>{apiError}</div>}
            <form className="form-custom" onSubmit={handleCreate}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0 1.5rem' }}>
                <div className="form-group">
                  <label>Menu Name *</label>
                  <input className="form-input" type="text" value={form.menu_name} onChange={e => setForm(f => ({ ...f, menu_name: e.target.value }))} placeholder="e.g. Appointments" required />
                </div>
                <div className="form-group">
                  <label>URL *</label>
                  <input className="form-input" type="text" value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} placeholder="/appointments" required />
                </div>
                <div className="form-group">
                  <label>Icon (emoji/text)</label>
                  <input className="form-input" type="text" value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))} placeholder="📅" />
                </div>
                <div className="form-group">
                  <label>Display Order</label>
                  <input className="form-input" type="number" min="0" value={form.display_order} onChange={e => setForm(f => ({ ...f, display_order: e.target.value }))} />
                </div>
              </div>
              <button type="submit" className="btn-primary-custom btn-sm-custom" disabled={submitting}>
                {submitting ? 'Creating…' : 'Create Menu Item'}
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="card-custom">
        <div className="card-body-custom" style={{ padding: 0 }}>
          {loading ? (
            <p style={{ padding: '1.5rem', color: 'var(--color-text-muted)' }}>Loading…</p>
          ) : menus.length === 0 ? (
            <EmptyState icon="📋" title="No menu items" description="Create your first navigation item." />
          ) : (
            <div className="table-scroll-wrapper">
              <table className="table-custom">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Name</th>
                    <th>URL</th>
                    <th>Icon</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {menus.map(m => (
                    <tr key={m.id}>
                      <td>{m.display_order}</td>
                      <td><strong>{m.menu_name}</strong></td>
                      <td><code style={{ fontSize: 'var(--font-xs)' }}>{m.url}</code></td>
                      <td>{m.icon || '—'}</td>
                      <td><StatusBadge status={m.is_active ? 'active' : 'inactive'} label={m.is_active ? 'Active' : 'Inactive'} /></td>
                      <td>
                        <div className="action-links">
                          <a className="action-danger" href="#" onClick={e => { e.preventDefault(); handleDelete(m.id); }}>Delete</a>
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
