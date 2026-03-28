'use client';

import { ReactNode } from 'react';
import Sidebar, { NavItem } from './Sidebar';
import Header from './Header';
import { Flame, TrendingUp, Settings, Bell, Search } from 'lucide-react';

interface MainLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export default function MainLayout({ 
  children, 
  title,
  subtitle,
  actions
}: MainLayoutProps) {
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar>
        <div className="space-y-2">
          <NavItem 
            icon={<Flame size={20} />} 
            label="仪表盘" 
            href="/dashboard"
          />
          <NavItem 
            icon={<Search size={20} />} 
            label="关键词管理" 
            href="/keywords"
          />
          <NavItem 
            icon={<TrendingUp size={20} />} 
            label="热点列表" 
            href="/hotspots"
          />
          <NavItem 
            icon={<Bell size={20} />} 
            label="通知记录" 
            href="/notifications"
          />
          <NavItem 
            icon={<Settings size={20} />} 
            label="设置" 
            href="/settings"
          />
        </div>
      </Sidebar>
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title={title} subtitle={subtitle} actions={actions} />
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
