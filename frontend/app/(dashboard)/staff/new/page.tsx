'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

interface FormData {
  full_name: string;
  email: string;
  phone_number: string;
  specialty: string;
  is_active: boolean;
}

export default function NewStaffPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormData>({
    full_name: '', email: '', phone_number: '', specialty: '', is_active: true,
  });
  const [apiError, setApiError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.full_name.trim()) { setApiError('Full name is required'); return; }
    setSubmitting(true);
    setApiError('');
    try {
      await api.post('/staff/', form);
      router.push('/staff');
    } catch (err: unknown) {
      const data = (err as { response?: { data?: Record<string, string[]> } })?.response?.data;
      if (data) {
        setApiError(Object.entries(data).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join(' | '));
      } else {
        setApiError('Failed to create staff member. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Add Staff Member</h1>
          <p className="page-subtitle">Add a new team member</p>
        </div>
      </div>

      <div className="card-custom">
        <div className="card-body-custom">
          {apiError && <div className="login-error" style={{ marginBottom: '1rem' }}>{apiError}</div>}

          <form className="form-custom" onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0 1.5rem' }}>
              <div className="form-group">
                <label>Full Name *</label>
                <input className="form-input" type="text" value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} placeholder="Full name" required />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input className="form-input" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="staff@email.com" />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input className="form-input" type="tel" value={form.phone_number} onChange={e => setForm(f => ({ ...f, phone_number: e.target.value }))} placeholder="+1 555 000 0000" />
              </div>
              <div className="form-group">
                <label>Specialty</label>
                <input className="form-input" type="text" value={form.specialty} onChange={e => setForm(f => ({ ...f, specialty: e.target.value }))} placeholder="e.g. Hair, Nails, Massage…" />
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
              <button type="submit" className="btn-primary-custom" disabled={submitting}>
                {submitting ? 'Creating…' : 'Add Staff Member'}
              </button>
              <button type="button" className="btn-secondary-custom" onClick={() => router.push('/staff')}>Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
