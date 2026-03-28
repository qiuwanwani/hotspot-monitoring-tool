'use client';

import { ReactNode } from 'react';
import Sidebar from './Sidebar';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { BackgroundBeams } from '@/components/ui/Motion';

interface MainLayoutProps {
  children: ReactNode;
  title?: string;
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
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 grid-bg pointer-events-none" />
      <div className="fixed inset-0 radial-gradient pointer-events-none" />
      <BackgroundBeams className="opacity-30" />
      
      <Sidebar />
      
      <main className="ml-64 min-h-screen relative">
        <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border">
          <div className="px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                {title && (
                  <h1 className="text-2xl font-bold text-foreground">{title}</h1>
                )}
                {subtitle && (
                  <p className="text-foreground-muted mt-1">{subtitle}</p>
                )}
              </div>
              <div className="flex items-center gap-4">
                {actions}
                <ThemeToggle />
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
