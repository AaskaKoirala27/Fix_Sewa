'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

interface Props { sidebarOpen?: boolean; }

export default function Sidebar({ sidebarOpen }: Props) {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  if (!user) return null;

  const initials = user.full_name
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const roles = user.roles.map(r => r.role_name).join(', ');

  return (
    <aside className={`sidebar${sidebarOpen ? ' open' : ''}`}>
      <div className="sidebar-brand">
        <a href="/">
          Fix Sewa
          <span className="brand-sub">Management System</span>
        </a>
      </div>

      <ul className="sidebar-nav">
        {user.menus.map(menu => (
          <li key={menu.id}>
            <Link
              href={menu.url}
              className={pathname === menu.url || pathname.startsWith(menu.url + '/') ? 'active' : ''}
            >
              {menu.icon && <span>{menu.icon}</span>}
              {menu.menu_name}
            </Link>
          </li>
        ))}
      </ul>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">{initials}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user.full_name}</div>
            <div className="sidebar-user-role">{roles}</div>
          </div>
        </div>
        <div className="sidebar-logout">
          <button onClick={logout}>Sign out</button>
        </div>
      </div>
    </aside>
  );
}
