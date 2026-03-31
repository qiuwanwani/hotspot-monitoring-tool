'use client';

import { useEffect } from 'react';
import { Keyboard, X } from 'lucide-react';

interface Shortcut {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  description: string;
}

const shortcuts: Shortcut[] = [
  { key: 'D', ctrl: true, description: '前往仪表盘' },
  { key: 'H', ctrl: true, description: '前往热点列表' },
  { key: 'K', ctrl: true, description: '前往关键词' },
  { key: 'N', ctrl: true, description: '前往通知' },
  { key: ',', ctrl: true, description: '前往设置' },
  { key: 'F', ctrl: true, description: '搜索' },
  { key: 'R', ctrl: true, description: '刷新页面' },
  { key: 'N', ctrl: true, shift: true, description: '新建项目' },
  { key: 'Escape', description: '关闭弹窗/取消' },
  { key: '?', description: '显示快捷键帮助' },
];

interface KeyboardShortcutsHelpProps {
  onClose?: () => void;
}

export default function KeyboardShortcutsHelp({ onClose }: KeyboardShortcutsHelpProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-6 bg-card border border-border rounded-xl sm:rounded-2xl shadow-2xl animate-fade-in">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10">
              <Keyboard size={18} className="sm:w-5 sm:h-5 text-primary" />
            </div>
            <h2 className="text-base sm:text-lg font-semibold text-foreground">键盘快捷键</h2>
          </div>
          <button
            onClick={() => onClose?.()}
            className="p-1.5 sm:p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <X size={16} className="sm:w-[18px] sm:h-[18px] text-muted-foreground" />
          </button>
        </div>

        <div className="space-y-1 sm:space-y-2">
          {shortcuts.map((shortcut, index) => (
            <div
              key={index}
              className="flex items-center justify-between py-1.5 sm:py-2 px-2 sm:px-3 rounded-lg hover:bg-muted transition-colors"
            >
              <span className="text-sm sm:text-base text-foreground">{shortcut.description}</span>
              <div className="flex items-center gap-0.5 sm:gap-1">
                {shortcut.ctrl && (
                  <kbd className="px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium bg-muted rounded border border-border text-foreground">
                    Ctrl
                  </kbd>
                )}
                {shortcut.shift && (
                  <kbd className="px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium bg-muted rounded border border-border text-foreground">
                    Shift
                  </kbd>
                )}
                {shortcut.alt && (
                  <kbd className="px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium bg-muted rounded border border-border text-foreground">
                    Alt
                  </kbd>
                )}
                <kbd className="px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium bg-muted rounded border border-border min-w-[20px] sm:min-w-[24px] text-center text-foreground">
                  {shortcut.key}
                </kbd>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-4 sm:mt-6 text-[10px] sm:text-xs text-muted-foreground text-center">
          按 <kbd className="px-1 py-0.5 bg-muted rounded text-foreground">?</kbd> 键可随时打开此帮助
        </p>
      </div>
    </div>
  );
}
