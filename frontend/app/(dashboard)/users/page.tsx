'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import type { User } from '@/lib/types';
import StatusBadge from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  async function loadData() {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      const { data } = await api.get('/users/', { params });
      setUsers(Array.isArray(data) ? data : data.results ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, [search]);

  async function handleApprove(id: string) {
    await api.post(`/users/${id}/approve/`);
    setUsers(prev => prev.map(u => u.id === id ? { ...u, is_approved: true } : u));
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this user?')) return;
    await api.delete(`/users/${id}/`);
    setUsers(prev => prev.filter(u => u.id !== id));
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Users</h1>
          <p className="page-subtitle">Manage user accounts and access</p>
        </div>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <input
          className="form-input"
          style={{ maxWidth: 320 }}
          placeholder="Search by username, name, email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="card-custom">
        <div className="card-body-custom" style={{ padding: 0 }}>
          {loading ? (
            <p style={{ padding: '1.5rem', color: 'var(--color-text-muted)' }}>Loading…</p>
          ) : users.length === 0 ? (
            <EmptyState icon="🧑‍💼" title="No users found" description="No accounts match your search." />
          ) : (
            <div className="table-scroll-wrapper">
              <table className="table-custom">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Roles</th>
                    <th>Active</th>
                    <th>Approved</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td>
                        <strong>{u.full_name}</strong><br />
                        <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-xs)' }}>@{u.username}</span>
                      </td>
                      <td>{u.roles.map(r => r.role_name).join(', ') || '—'}</td>
                      <td><StatusBadge status={u.is_active ? 'active' : 'inactive'} label={u.is_active ? 'Yes' : 'No'} /></td>
                      <td>
                        {u.is_approved
                          ? <StatusBadge status="active" label="Approved" />
                          : <StatusBadge status="pending" label="Pending" />}
                      </td>
                      <td>
                        <div className="action-links">
                          <Link href={`/users/${u.id}`}>Manage</Link>
                          {!u.is_approved && (
                            <a href="#" onClick={e => { e.preventDefault(); handleApprove(u.id); }}>Approve</a>
                          )}
                          <a className="action-danger" href="#" onClick={e => { e.preventDefault(); handleDelete(u.id); }}>Delete</a>
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
