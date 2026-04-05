'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';

const navItems = [
  { label: 'Dashboard', href: '/', icon: 'LayoutDashboard' },
  { label: 'Users', href: '/users', icon: 'Users' },
  { label: 'Analytics', href: '/analytics', icon: 'BarChart3' },
  { label: 'Comments', href: '/comments', icon: 'MessageSquare' },
  { label: 'Settings', href: '/settings', icon: 'Settings' },
];

const iconMap: Record<string, string> = {
  LayoutDashboard: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
  Users: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2',
  BarChart3: 'M18 20V10M12 20V4M6 20v-6',
  MessageSquare: 'M21 15a2 2 0 0 1-2 2H7l-4 3V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',
  Settings: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',
};

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      className="h-screen bg-[#1e293b] text-[#94a3b8] flex flex-col"
      style={{ width: collapsed ? '64px' : '280px' }}
    >
      <div className="p-4 flex items-center justify-between">
        {!collapsed && (
          <span className="text-white font-bold text-lg">Acme</span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded hover:bg-white/10"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d={collapsed ? 'M9 18l6-6-6-6' : 'M15 18l-6-6 6-6'} />
          </svg>
        </button>
      </div>
      <div className="flex-1 py-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <a
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 p-1.5 mx-2 rounded-md transition-colors ${
                isActive
                  ? 'bg-[#334155] text-white'
                  : 'hover:bg-white/5 hover:text-white'
              }`}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d={iconMap[item.icon]} />
              </svg>
              {!collapsed && <span className="text-sm">{item.label}</span>}
            </a>
          );
        })}
      </div>
      <div className="p-4 border-t border-white/10">
        {!collapsed && (
          <div className="text-xs text-[#64748b]">Acme Dashboard v2.1.0</div>
        )}
      </div>
    </div>
  );
}
