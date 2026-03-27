'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import type { Appointment } from '@/lib/types';
import StatusBadge from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';

function formatDateTime(dt: string) {
  return new Date(dt).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  async function loadData() {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const { data } = await api.get('/appointments/', { params });
      setAppointments(Array.isArray(data) ? data : data.results ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, [search, statusFilter]);

  async function handleDelete(id: number) {
    if (!confirm('Delete this appointment?')) return;
    await api.delete(`/appointments/${id}/`);
    setAppointments(prev => prev.filter(a => a.id !== id));
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Appointments</h1>
          <p className="page-subtitle">Manage all scheduled appointments</p>
        </div>
        <div className="btn-group-custom">
          <Link href="/appointments/new" className="btn-primary-custom">+ New Appointment</Link>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <input
          className="form-input"
          style={{ maxWidth: 280 }}
          placeholder="Search by client name, email, phone…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          className="form-input"
          style={{ maxWidth: 180 }}
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="">All statuses</option>
          <option value="Scheduled">Scheduled</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
          <option value="No-Show">No-Show</option>
        </select>
      </div>

      <div className="card-custom">
        <div className="card-body-custom" style={{ padding: 0 }}>
          {loading ? (
            <p style={{ padding: '1.5rem', color: 'var(--color-text-muted)' }}>Loading…</p>
          ) : appointments.length === 0 ? (
            <EmptyState
              icon="📅"
              title="No appointments found"
              description="Create your first appointment to get started."
              action={<Link href="/appointments/new" className="btn-primary-custom">New Appointment</Link>}
            />
          ) : (
            <div className="table-scroll-wrapper">
              <table className="table-custom">
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Staff</th>
                    <th>Date & Time</th>
                    <th>Duration</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map(a => (
                    <tr key={a.id}>
                      <td>
                        <strong>{a.client_name}</strong><br />
                        <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-xs)' }}>
                          {a.client_phone}
                        </span>
                      </td>
                      <td>{a.staff_name}</td>
                      <td>{formatDateTime(a.start_time)}</td>
                      <td>{a.duration_minutes} min</td>
                      <td><StatusBadge status={a.status} /></td>
                      <td>
                        <div className="action-links">
                          <Link href={`/appointments/${a.id}`}>View</Link>
                          <Link href={`/appointments/${a.id}/edit`}>Edit</Link>
                          <a
                            href="#"
                            className="action-danger"
                            onClick={e => { e.preventDefault(); handleDelete(a.id); }}
                          >Delete</a>
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
