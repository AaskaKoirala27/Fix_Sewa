'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/layout/Sidebar';
import MobileHeader from '@/components/layout/MobileHeader';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <span style={{ color: 'var(--color-text-muted)' }}>Loading…</span>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="layout-app">
      <div
        className={`sidebar-overlay${sidebarOpen ? ' active' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />
      <Sidebar sidebarOpen={sidebarOpen} />
      <div className="main-content">
        <MobileHeader onMenuToggle={() => setSidebarOpen(o => !o)} />
        <div className="content-body">{children}</div>
      </div>
    </div>
  );
}
