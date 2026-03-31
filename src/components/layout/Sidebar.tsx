'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';
import { 
  Flame, 
  Search, 
  TrendingUp, 
  Bell, 
  Settings,
  Zap,
  X,
  Activity
} from 'lucide-react';

interface NavItemProps {
  icon: ReactNode;
  label: string;
  href: string;
  badge?: number;
  onClick?: () => void;
}

function NavItem({ icon, label, href, badge, onClick }: NavItemProps) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(href + '/');

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`
        group relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
        ${active 
          ? 'bg-primary/10 text-primary' 
          : 'text-foreground-muted hover:text-foreground hover:bg-card'
        }
      `}
    >
      {active && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-primary rounded-full" />
      )}
      
      <div className={`
        transition-all duration-200
        ${active ? 'text-primary' : 'group-hover:text-foreground'}
      `}>
        {icon}
      </div>
      
      <span className="font-medium">{label}</span>
      
      {badge !== undefined && badge > 0 && (
        <span className="ml-auto px-2 py-0.5 text-xs font-medium rounded-full bg-accent-red/20 text-accent-red">
          {badge}
        </span>
      )}
    </Link>
  );
}

interface SidebarProps {
  onClose?: () => void;
}

export default function Sidebar({ onClose }: SidebarProps) {
  const navItems = [
    { icon: <Flame size={20} />, label: '仪表盘', href: '/dashboard' },
    { icon: <Search size={20} />, label: '关键词', href: '/keywords' },
    { icon: <TrendingUp size={20} />, label: '热点', href: '/hotspots' },
    { icon: <Bell size={20} />, label: '通知', href: '/notifications' },
    { icon: <Activity size={20} />, label: '监控中心', href: '/monitor' },
    { icon: <Settings size={20} />, label: '设置', href: '/settings' },
  ];

  return (
    <div className="w-full h-full flex flex-col">
      <div className="p-6 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-3 group" onClick={onClose}>
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <Zap size={20} className="text-white" />
            </div>
            <div className="absolute inset-0 rounded-xl bg-primary/30 blur-xl group-hover:bg-primary/50 transition-colors" />
          </div>
          <div>
            <h1 className="font-bold text-foreground text-lg">热点监控</h1>
            <p className="text-xs text-foreground-muted">Hotspot Monitor</p>
          </div>
        </Link>
        
        {/* 移动端关闭按钮 */}
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-lg hover:bg-card transition-colors"
          >
            <X size={20} className="text-foreground-muted" />
          </button>
        )}
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => (
          <NavItem key={item.href} {...item} onClick={onClose} />
        ))}
      </nav>

      <div className="p-4 border-t border-border">
        <div className="p-4 rounded-xl bg-gradient-to-br from-primary/5 to-secondary/5 border border-primary/10">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-accent-green animate-pulse" />
            <span className="text-xs font-medium text-foreground-muted">系统状态</span>
          </div>
          <p className="text-sm text-foreground">所有系统运行正常</p>
        </div>
      </div>
    </div>
  );
}
