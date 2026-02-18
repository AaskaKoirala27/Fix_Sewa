'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import type { Staff } from '@/lib/types';
import StatusBadge from '@/components/ui/StatusBadge';

export default function StaffDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [staff, setStaff] = useState<Staff | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Partial<Staff>>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    api.get<Staff>(`/staff/${params.id}/`).then(r => {
      setStaff(r.data);
      setForm(r.data);
    }).finally(() => setLoading(false));
  }, [params.id]);

  async function handleSave() {
    setSaving(true);
    setApiError('');
    try {
      const { data } = await api.patch<Staff>(`/staff/${params.id}/`, form);
      setStaff(data);
      setEditing(false);
    } catch (err: unknown) {
      const d = (err as { response?: { data?: Record<string, string[]> } })?.response?.data;
      setApiError(d ? Object.entries(d).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join(' | ') : 'Failed to save.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Delete this staff member?')) return;
    await api.delete(`/staff/${params.id}/`);
    router.push('/staff');
  }

  if (loading) return <p style={{ color: 'var(--color-text-muted)' }}>Loading…</p>;
  if (!staff) return <p>Staff member not found.</p>;

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">{staff.full_name}</h1>
          <p className="page-subtitle">{staff.specialty || 'Staff Member'}</p>
        </div>
        <div className="btn-group-custom">
          {!editing ? (
            <>
              <button className="btn-secondary-custom" onClick={() => setEditing(true)}>Edit</button>
              <button className="btn-danger-custom" onClick={handleDelete}>Delete</button>
              <Link href="/staff" className="btn-secondary-custom">Back</Link>
            </>
          ) : null}
        </div>
      </div>

      <div className="card-custom">
        <div className="card-body-custom">
          {apiError && <div className="login-error" style={{ marginBottom: '1rem' }}>{apiError}</div>}

          {!editing ? (
            <dl className="detail-grid">
              <dt>Full Name</dt><dd>{staff.full_name}</dd>
              <dt>Email</dt><dd>{staff.email || '—'}</dd>
              <dt>Phone</dt><dd>{staff.phone_number || '—'}</dd>
              <dt>Specialty</dt><dd>{staff.specialty || '—'}</dd>
              <dt>Status</dt><dd><StatusBadge status={staff.is_active ? 'active' : 'inactive'} label={staff.is_active ? 'Active' : 'Inactive'} /></dd>
            </dl>
          ) : (
            <form className="form-custom" onSubmit={e => { e.preventDefault(); handleSave(); }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0 1.5rem' }}>
                <div className="form-group">
                  <label>Full Name *</label>
                  <input className="form-input" type="text" value={form.full_name ?? ''} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input className="form-input" type="email" value={form.email ?? ''} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input className="form-input" type="tel" value={form.phone_number ?? ''} onChange={e => setForm(f => ({ ...f, phone_number: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label>Specialty</label>
                  <input className="form-input" type="text" value={form.specialty ?? ''} onChange={e => setForm(f => ({ ...f, specialty: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select className="form-input" value={form.is_active ? 'true' : 'false'} onChange={e => setForm(f => ({ ...f, is_active: e.target.value === 'true' }))}>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="btn-group-custom">
                <button type="submit" className="btn-primary-custom" disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</button>
                <button type="button" className="btn-secondary-custom" onClick={() => setEditing(false)}>Cancel</button>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
