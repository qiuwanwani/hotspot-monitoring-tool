'use client';

import { useEffect, useCallback } from 'react';

interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  handler: () => void;
  description: string;
}

export function useKeyboardShortcuts(shortcuts: ShortcutConfig[]) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      shortcuts.forEach((shortcut) => {
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatch = shortcut.ctrl ? event.ctrlKey || event.metaKey : true;
        const altMatch = shortcut.alt ? event.altKey : true;
        const shiftMatch = shortcut.shift ? event.shiftKey : true;

        if (keyMatch && ctrlMatch && altMatch && shiftMatch) {
          event.preventDefault();
          shortcut.handler();
        }
      });
    },
    [shortcuts]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

// 预定义的快捷键
export const defaultShortcuts = {
  // 导航
  goToDashboard: { key: 'd', ctrl: true, description: '前往仪表盘' },
  goToHotspots: { key: 'h', ctrl: true, description: '前往热点列表' },
  goToKeywords: { key: 'k', ctrl: true, description: '前往关键词' },
  goToNotifications: { key: 'n', ctrl: true, description: '前往通知' },
  goToSettings: { key: ',', ctrl: true, description: '前往设置' },
  
  // 操作
  search: { key: 'f', ctrl: true, description: '搜索' },
  refresh: { key: 'r', ctrl: true, description: '刷新' },
  newItem: { key: 'n', ctrl: true, shift: true, description: '新建' },
  escape: { key: 'Escape', description: '关闭/取消' },
  
  // 帮助
  help: { key: '?', description: '显示快捷键帮助' },
};
