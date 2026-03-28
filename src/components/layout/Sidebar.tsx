'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SidebarProps {
  children: ReactNode;
}

export default function Sidebar({ children }: SidebarProps) {
  return (
    <aside className="w-64 h-screen bg-background-secondary border-r border-border flex flex-col">
      <div className="p-6 border-b border-border">
        <Link href="/dashboard" className="text-xl font-bold text-primary flex items-center gap-2 hover:opacity-80 transition-opacity">
          <span className="text-2xl">🔥</span>
          热点监控
        </Link>
      </div>
      <nav className="flex-1 p-4">
        {children}
      </nav>
      <div className="p-4 border-t border-border">
        <p className="text-xs text-foreground-subtle">v0.1.0</p>
      </div>
    </aside>
  );
}

interface NavItemProps {
  icon: ReactNode;
  label: string;
  href: string;
}

export function NavItem({ icon, label, href }: NavItemProps) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(href + '/');

  return (
    <Link
      href={href}
      className={`
        w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
        ${active 
          ? 'bg-primary/10 text-primary border border-primary/20' 
          : 'text-foreground-muted hover:bg-card hover:text-foreground'
        }
      `}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </Link>
  );
}
