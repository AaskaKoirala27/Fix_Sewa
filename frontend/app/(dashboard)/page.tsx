'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import type { DashboardStats } from '@/lib/types';
import StatCard from '@/components/ui/StatCard';
import StatusBadge from '@/components/ui/StatusBadge';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatDate(dt: string) {
  return new Date(dt).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<DashboardStats>('/dashboard/').then(r => setStats(r.data)).finally(() => setLoading(false));
  }, []);

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <>
      <h1 className="dashboard-greeting">
        {greeting()},&nbsp;<span>{user?.full_name?.split(' ')[0]}</span>
      </h1>
      <p className="dashboard-date">
        <span>📅</span> {today}
      </p>

      {/* Quick actions */}
      <div className="quick-actions">
        <Link href="/appointments/new" className="quick-action">+ New Appointment</Link>
        <Link href="/pos" className="quick-action">⚡ Open POS</Link>
        <Link href="/staff" className="quick-action">👥 Manage Staff</Link>
        <Link href="/pos/reports" className="quick-action">📊 Sales Reports</Link>
      </div>

      {/* Stat cards */}
      {loading ? (
        <p style={{ color: 'var(--color-text-muted)' }}>Loading stats…</p>
      ) : stats ? (
        <div className="stats-grid">
          <StatCard label="Today's Appointments" value={stats.today_appointments} icon="📅" />
          <StatCard label="Scheduled" value={stats.scheduled_appointments} icon="🗓" iconBg="#e8f4fd" iconColor="#1a6fa3" />
          <StatCard label="Completed" value={stats.completed_appointments} icon="✅" iconBg="#e9f7ef" iconColor="#1e8449" />
          <StatCard label="Cancelled" value={stats.cancelled_appointments} icon="❌" iconBg="#fce4e1" iconColor="#96281b" />
          <StatCard label="Active Staff" value={stats.active_staff} sub={`of ${stats.total_staff} total`} icon="👤" />
          <StatCard label="Active Users" value={stats.active_users} sub={`of ${stats.total_users} total`} icon="🧑‍💼" />
          {stats.pending_approvals > 0 && (
            <StatCard
              label="Pending Approvals"
              value={stats.pending_approvals}
              icon="⏳"
              iconBg="#fef5e7"
              iconColor="#9a7d0a"
            />
          )}
        </div>
      ) : null}

      {/* Recent appointments */}
      {stats && stats.recent_appointments.length > 0 && (
        <div className="card-custom">
          <div className="card-header-custom">
            <h2>Recent Appointments</h2>
            <Link href="/appointments" className="btn-secondary-custom btn-sm-custom">View all</Link>
          </div>
          <div className="card-body-custom" style={{ padding: 0 }}>
            <div className="table-scroll-wrapper">
              <table className="table-custom">
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Staff</th>
                    <th>Date & Time</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recent_appointments.map(appt => (
                    <tr key={appt.id}>
                      <td>
                        <strong>{appt.client_name}</strong><br />
                        <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-xs)' }}>{appt.client_phone}</span>
                      </td>
                      <td>{appt.staff_name}</td>
                      <td>{formatDate(appt.start_time)}</td>
                      <td><StatusBadge status={appt.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
