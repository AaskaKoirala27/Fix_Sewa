'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import type { Staff } from '@/lib/types';
import StatusBadge from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';

export default function StaffPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  async function loadData() {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      const { data } = await api.get('/staff/', { params });
      setStaff(Array.isArray(data) ? data : data.results ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, [search]);

  async function handleDelete(id: number) {
    if (!confirm('Delete this staff member?')) return;
    await api.delete(`/staff/${id}/`);
    setStaff(prev => prev.filter(s => s.id !== id));
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Staff</h1>
          <p className="page-subtitle">Manage your team members</p>
        </div>
        <Link href="/staff/new" className="btn-primary-custom">+ Add Staff</Link>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <input
          className="form-input"
          style={{ maxWidth: 320 }}
          placeholder="Search by name, email, specialty…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="card-custom">
        <div className="card-body-custom" style={{ padding: 0 }}>
          {loading ? (
            <p style={{ padding: '1.5rem', color: 'var(--color-text-muted)' }}>Loading…</p>
          ) : staff.length === 0 ? (
            <EmptyState
              icon="👤"
              title="No staff found"
              description="Add your first team member to get started."
              action={<Link href="/staff/new" className="btn-primary-custom">Add Staff</Link>}
            />
          ) : (
            <div className="table-scroll-wrapper">
              <table className="table-custom">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Specialty</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {staff.map(s => (
                    <tr key={s.id}>
                      <td><strong>{s.full_name}</strong></td>
                      <td>{s.specialty || '—'}</td>
                      <td>{s.email || '—'}</td>
                      <td>{s.phone_number || '—'}</td>
                      <td><StatusBadge status={s.is_active ? 'active' : 'inactive'} label={s.is_active ? 'Active' : 'Inactive'} /></td>
                      <td>
                        <div className="action-links">
                          <Link href={`/staff/${s.id}`}>View</Link>
                          <Link href={`/staff/${s.id}/edit`}>Edit</Link>
                          <a className="action-danger" href="#" onClick={e => { e.preventDefault(); handleDelete(s.id); }}>Delete</a>
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
