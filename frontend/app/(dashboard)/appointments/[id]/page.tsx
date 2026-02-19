'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import type { Appointment, Staff } from '@/lib/types';
import StatusBadge from '@/components/ui/StatusBadge';

const STATUS_OPTIONS = ['Scheduled', 'Completed', 'Cancelled', 'No-Show'];

function formatDT(dt: string) {
  return new Date(dt).toLocaleString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function toLocalInput(dt: string) {
  const d = new Date(dt);
  return d.toISOString().slice(0, 16);
}

export default function AppointmentDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [appt, setAppt] = useState<Appointment | null>(null);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Partial<Appointment & { start_time_local: string }>>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<Appointment>(`/appointments/${params.id}/`),
      api.get('/staff/'),
    ]).then(([apptRes, staffRes]) => {
      setAppt(apptRes.data);
      setForm({ ...apptRes.data, start_time_local: toLocalInput(apptRes.data.start_time) });
      setStaffList(Array.isArray(staffRes.data) ? staffRes.data : staffRes.data.results ?? []);
    }).finally(() => setLoading(false));
  }, [params.id]);

  async function handleSave() {
    setSaving(true);
    try {
      const payload = {
        staff: form.staff,
        client_name: form.client_name,
        client_email: form.client_email,
        client_phone: form.client_phone,
        start_time: form.start_time_local,
        duration_minutes: Number(form.duration_minutes),
        status: form.status,
        notes: form.notes,
      };
      const { data } = await api.patch<Appointment>(`/appointments/${params.id}/`, payload);
      setAppt(data);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Delete this appointment?')) return;
    await api.delete(`/appointments/${params.id}/`);
    router.push('/appointments');
  }

  if (loading) return <p style={{ color: 'var(--color-text-muted)' }}>Loading…</p>;
  if (!appt) return <p>Appointment not found.</p>;

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Appointment Details</h1>
          <p className="page-subtitle">#{appt.id}</p>
        </div>
        <div className="btn-group-custom">
          {!editing && (
            <>
              <button className="btn-secondary-custom" onClick={() => setEditing(true)}>Edit</button>
              <button className="btn-danger-custom" onClick={handleDelete}>Delete</button>
              <Link href="/appointments" className="btn-secondary-custom">Back</Link>
            </>
          )}
        </div>
      </div>

      {!editing ? (
        <div className="card-custom">
          <div className="card-body-custom">
            <dl className="detail-grid">
              <dt>Client</dt><dd>{appt.client_name}</dd>
              <dt>Email</dt><dd>{appt.client_email || '—'}</dd>
              <dt>Phone</dt><dd>{appt.client_phone || '—'}</dd>
              <dt>Staff</dt><dd>{appt.staff_name}</dd>
              <dt>Date & Time</dt><dd>{formatDT(appt.start_time)}</dd>
              <dt>Duration</dt><dd>{appt.duration_minutes} minutes</dd>
              <dt>Status</dt><dd><StatusBadge status={appt.status} /></dd>
              <dt>Notes</dt><dd>{appt.notes || '—'}</dd>
              <dt>Created</dt><dd>{formatDT(appt.created_at)}</dd>
            </dl>
          </div>
        </div>
      ) : (
        <div className="card-custom">
          <div className="card-body-custom">
            <form className="form-custom" onSubmit={e => { e.preventDefault(); handleSave(); }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0 1.5rem' }}>
                <div className="form-group">
                  <label>Staff Member</label>
                  <select className="form-input" value={String(form.staff)} onChange={e => setForm(f => ({ ...f, staff: Number(e.target.value) }))}>
                    {staffList.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Client Name</label>
                  <input className="form-input" type="text" value={form.client_name ?? ''} onChange={e => setForm(f => ({ ...f, client_name: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label>Client Email</label>
                  <input className="form-input" type="email" value={form.client_email ?? ''} onChange={e => setForm(f => ({ ...f, client_email: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label>Client Phone</label>
                  <input className="form-input" type="tel" value={form.client_phone ?? ''} onChange={e => setForm(f => ({ ...f, client_phone: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label>Start Time</label>
                  <input className="form-input" type="datetime-local" value={form.start_time_local ?? ''} onChange={e => setForm(f => ({ ...f, start_time_local: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label>Duration (minutes)</label>
                  <input className="form-input" type="number" min="15" value={form.duration_minutes ?? 60} onChange={e => setForm(f => ({ ...f, duration_minutes: Number(e.target.value) }))} />
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select className="form-input" value={form.status ?? 'Scheduled'} onChange={e => setForm(f => ({ ...f, status: e.target.value as Appointment['status'] }))}>
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Notes</label>
                <textarea className="form-input" value={form.notes ?? ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} />
              </div>
              <div className="btn-group-custom">
                <button type="submit" className="btn-primary-custom" disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</button>
                <button type="button" className="btn-secondary-custom" onClick={() => setEditing(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
