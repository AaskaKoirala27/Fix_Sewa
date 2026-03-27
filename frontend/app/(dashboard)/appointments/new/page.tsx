'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import type { Staff } from '@/lib/types';

const STATUS_OPTIONS = ['Scheduled', 'Completed', 'Cancelled', 'No-Show'];

interface FormData {
  staff: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  start_time: string;
  duration_minutes: string;
  status: string;
  notes: string;
}

export default function NewAppointmentPage() {
  const router = useRouter();
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [form, setForm] = useState<FormData>({
    staff: '', client_name: '', client_email: '', client_phone: '',
    start_time: '', duration_minutes: '60', status: 'Scheduled', notes: '',
  });
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    api.get('/staff/?is_active=true').then(r => setStaffList(Array.isArray(r.data) ? r.data : r.data.results ?? []));
  }, []);

  function set(field: keyof FormData, value: string) {
    setForm(f => ({ ...f, [field]: value }));
    setErrors(e => ({ ...e, [field]: undefined }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs: Partial<FormData> = {};
    if (!form.staff) errs.staff = 'Staff is required';
    if (!form.client_name.trim()) errs.client_name = 'Client name is required';
    if (!form.start_time) errs.start_time = 'Start time is required';
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSubmitting(true);
    setApiError('');
    try {
      await api.post('/appointments/', {
        ...form,
        staff: Number(form.staff),
        duration_minutes: Number(form.duration_minutes),
      });
      router.push('/appointments');
    } catch (err: unknown) {
      const data = (err as { response?: { data?: Record<string, string[]> } })?.response?.data;
      if (data) {
        const msgs = Object.entries(data).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join(' | ');
        setApiError(msgs);
      } else {
        setApiError('Failed to create appointment. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">New Appointment</h1>
          <p className="page-subtitle">Schedule a new client appointment</p>
        </div>
      </div>

      <div className="card-custom">
        <div className="card-body-custom">
          {apiError && <div className="login-error" style={{ marginBottom: '1rem' }}>{apiError}</div>}

          <form className="form-custom" onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0 1.5rem' }}>
              <div className="form-group">
                <label>Staff Member *</label>
                <select className="form-input" value={form.staff} onChange={e => set('staff', e.target.value)} required>
                  <option value="">Select staff…</option>
                  {staffList.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                </select>
                {errors.staff && <span className="text-danger">{errors.staff}</span>}
              </div>

              <div className="form-group">
                <label>Client Name *</label>
                <input className="form-input" type="text" value={form.client_name} onChange={e => set('client_name', e.target.value)} placeholder="Full name" required />
                {errors.client_name && <span className="text-danger">{errors.client_name}</span>}
              </div>

              <div className="form-group">
                <label>Client Email</label>
                <input className="form-input" type="email" value={form.client_email} onChange={e => set('client_email', e.target.value)} placeholder="client@email.com" />
              </div>

              <div className="form-group">
                <label>Client Phone</label>
                <input className="form-input" type="tel" value={form.client_phone} onChange={e => set('client_phone', e.target.value)} placeholder="+1 555 000 0000" />
              </div>

              <div className="form-group">
                <label>Start Time *</label>
                <input className="form-input" type="datetime-local" value={form.start_time} onChange={e => set('start_time', e.target.value)} required />
                {errors.start_time && <span className="text-danger">{errors.start_time}</span>}
              </div>

              <div className="form-group">
                <label>Duration (minutes)</label>
                <input className="form-input" type="number" min="15" max="480" value={form.duration_minutes} onChange={e => set('duration_minutes', e.target.value)} />
              </div>

              <div className="form-group">
                <label>Status</label>
                <select className="form-input" value={form.status} onChange={e => set('status', e.target.value)}>
                  {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Notes</label>
              <textarea className="form-input" value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Any additional notes…" rows={3} />
            </div>

            <div className="btn-group-custom">
              <button type="submit" className="btn-primary-custom" disabled={submitting}>
                {submitting ? 'Creating…' : 'Create Appointment'}
              </button>
              <button type="button" className="btn-secondary-custom" onClick={() => router.push('/appointments')}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
