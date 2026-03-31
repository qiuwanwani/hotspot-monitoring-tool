'use client';

import { ReactNode, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from './Sidebar';
import ThemeToggle from '@/components/ui/ThemeToggle';
import KeyboardShortcutsHelp from '@/components/ui/KeyboardShortcutsHelp';
import { BackgroundBeams } from '@/components/ui/Motion';
import { Menu, X, Keyboard } from 'lucide-react';

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const router = useRouter();

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + D: 仪表盘
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        router.push('/dashboard');
      }
      // Ctrl/Cmd + H: 热点
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'h') {
        e.preventDefault();
        router.push('/hotspots');
      }
      // Ctrl/Cmd + K: 关键词
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        router.push('/keywords');
      }
      // Ctrl/Cmd + N: 通知
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n' && !e.shiftKey) {
        e.preventDefault();
        router.push('/notifications');
      }
      // Ctrl/Cmd + ,: 设置
      if ((e.ctrlKey || e.metaKey) && e.key === ',') {
        e.preventDefault();
        router.push('/settings');
      }
      // Ctrl/Cmd + R: 刷新
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'r') {
        e.preventDefault();
        window.location.reload();
      }
      // ?: 显示快捷键帮助
      if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setShowShortcutsHelp(true);
      }
      // Escape: 关闭帮助
      if (e.key === 'Escape') {
        setShowShortcutsHelp(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 grid-bg pointer-events-none" />
      <div className="fixed inset-0 radial-gradient pointer-events-none" />
      <BackgroundBeams className="opacity-30" />
      
      {/* 桌面端侧边栏 - 使用 fixed 定位 */}
      <aside className="hidden lg:block fixed left-0 top-0 bottom-0 w-64 bg-background-secondary border-r border-border z-40">
        <Sidebar />
      </aside>

      {/* 移动端侧边栏遮罩 */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* 移动端侧边栏 */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-background-secondary border-r border-border shadow-2xl transform transition-transform duration-300 lg:hidden ${
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <Sidebar onClose={() => setMobileMenuOpen(false)} />
      </div>
      
      <main className="lg:ml-64 min-h-screen relative">
        {/* 顶部导航栏 */}
        <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border">
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between gap-4">
              {/* 移动端菜单按钮 */}
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-card transition-colors"
              >
                <Menu size={20} className="text-foreground" />
              </button>

              <div className="flex-1 min-w-0">
                {title && (
                  <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate">{title}</h1>
                )}
                {subtitle && (
                  <p className="text-sm text-foreground-muted mt-1 hidden sm:block">{subtitle}</p>
                )}
              </div>
              <div className="flex items-center gap-2 sm:gap-4">
                {actions}
                <button
                  onClick={() => setShowShortcutsHelp(true)}
                  className="hidden sm:flex p-2 rounded-lg hover:bg-card transition-colors text-foreground-muted hover:text-foreground"
                  title="键盘快捷键 (?)"
                >
                  <Keyboard size={18} />
                </button>
                <ThemeToggle />
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>

      {/* 快捷键帮助弹窗 */}
      {showShortcutsHelp && <KeyboardShortcutsHelp onClose={() => setShowShortcutsHelp(false)} />}
    </div>
  );
}
