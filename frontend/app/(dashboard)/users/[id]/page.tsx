'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import type { User, Role, Menu } from '@/lib/types';
import StatusBadge from '@/components/ui/StatusBadge';

export default function UserDetailPage({ params }: { params: { id: string } }) {
  const [user, setUser] = useState<User | null>(null);
  const [allRoles, setAllRoles] = useState<Role[]>([]);
  const [allMenus, setAllMenus] = useState<Menu[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<number[]>([]);
  const [selectedMenus, setSelectedMenus] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    Promise.all([
      api.get<User>(`/users/${params.id}/`),
      api.get<Role[]>('/roles/'),
      api.get<Menu[]>('/menus/'),
    ]).then(([userRes, rolesRes, menusRes]) => {
      const u = userRes.data;
      setUser(u);
      setSelectedRoles(u.roles.map(r => r.id));
      setSelectedMenus(u.menus.map(m => m.id));
      setAllRoles(Array.isArray(rolesRes.data) ? rolesRes.data : (rolesRes.data as { results: Role[] }).results ?? []);
      setAllMenus(Array.isArray(menusRes.data) ? menusRes.data : (menusRes.data as { results: Menu[] }).results ?? []);
    }).finally(() => setLoading(false));
  }, [params.id]);

  function toggleRole(id: number) {
    setSelectedRoles(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  function toggleMenu(id: number) {
    setSelectedMenus(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  async function handleApprove() {
    await api.post(`/users/${params.id}/approve/`);
    setUser(u => u ? { ...u, is_approved: true } : u);
    setMessage('User approved.');
  }

  async function handleSaveRoles() {
    setSaving(true);
    try {
      const { data } = await api.post<{ user: User }>(`/users/${params.id}/assign_roles/`, { role_ids: selectedRoles });
      setUser(data.user);
      setMessage('Roles updated.');
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveMenus() {
    setSaving(true);
    try {
      const { data } = await api.post<{ user: User }>(`/users/${params.id}/assign_menus/`, { menu_ids: selectedMenus });
      setUser(data.user);
      setMessage('Menus updated.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p style={{ color: 'var(--color-text-muted)' }}>Loading…</p>;
  if (!user) return <p>User not found.</p>;

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">{user.full_name}</h1>
          <p className="page-subtitle">@{user.username}</p>
        </div>
        <div className="btn-group-custom">
          {!user.is_approved && (
            <button className="btn-primary-custom" onClick={handleApprove}>Approve Account</button>
          )}
          <Link href="/users" className="btn-secondary-custom">Back</Link>
        </div>
      </div>

      {message && <div className="login-success" style={{ marginBottom: '1rem' }}>{message}</div>}

      {/* User info */}
      <div className="card-custom">
        <div className="card-header-custom"><h2>Account Info</h2></div>
        <div className="card-body-custom">
          <dl className="detail-grid">
            <dt>Full Name</dt><dd>{user.full_name}</dd>
            <dt>Username</dt><dd>@{user.username}</dd>
            <dt>Email</dt><dd>{user.email || '—'}</dd>
            <dt>Active</dt><dd><StatusBadge status={user.is_active ? 'active' : 'inactive'} label={user.is_active ? 'Yes' : 'No'} /></dd>
            <dt>Approved</dt><dd>
              {user.is_approved
                ? <StatusBadge status="active" label="Approved" />
                : <StatusBadge status="pending" label="Pending Approval" />}
            </dd>
            <dt>Joined</dt><dd>{new Date(user.created_at).toLocaleDateString()}</dd>
          </dl>
        </div>
      </div>

      {/* Roles */}
      <div className="card-custom">
        <div className="card-header-custom"><h2>Roles</h2></div>
        <div className="card-body-custom">
          <div className="checkbox-group">
            {allRoles.map(role => (
              <label key={role.id} className="checkbox-item">
                <input
                  type="checkbox"
                  checked={selectedRoles.includes(role.id)}
                  onChange={() => toggleRole(role.id)}
                />
                {role.role_name}
              </label>
            ))}
          </div>
          <div style={{ marginTop: '1rem' }}>
            <button className="btn-primary-custom btn-sm-custom" onClick={handleSaveRoles} disabled={saving}>
              {saving ? 'Saving…' : 'Save Roles'}
            </button>
          </div>
        </div>
      </div>

      {/* Menus */}
      <div className="card-custom">
        <div className="card-header-custom"><h2>Menu Access</h2></div>
        <div className="card-body-custom">
          <div className="checkbox-group">
            {allMenus.map(menu => (
              <label key={menu.id} className="checkbox-item">
                <input
                  type="checkbox"
                  checked={selectedMenus.includes(menu.id)}
                  onChange={() => toggleMenu(menu.id)}
                />
                {menu.menu_name}
              </label>
            ))}
          </div>
          <div style={{ marginTop: '1rem' }}>
            <button className="btn-primary-custom btn-sm-custom" onClick={handleSaveMenus} disabled={saving}>
              {saving ? 'Saving…' : 'Save Menus'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
