'use client';

import { useTheme } from '@/lib/ThemeContext';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative w-10 h-10 rounded-xl bg-background-tertiary border border-border hover:border-primary/30 transition-all duration-300 flex items-center justify-center group overflow-hidden"
      aria-label={theme === 'dark' ? '切换到亮色模式' : '切换到暗色模式'}
    >
      <div className="relative w-5 h-5">
        <Sun 
          size={20} 
          className={`absolute inset-0 transition-all duration-300 ${
            theme === 'dark' 
              ? 'opacity-0 rotate-90 scale-0' 
              : 'opacity-100 rotate-0 scale-100 text-accent-orange'
          }`}
        />
        <Moon 
          size={20} 
          className={`absolute inset-0 transition-all duration-300 ${
            theme === 'dark' 
              ? 'opacity-100 rotate-0 scale-100 text-primary' 
              : 'opacity-0 -rotate-90 scale-0'
          }`}
        />
      </div>
      
      <div className={`absolute inset-0 rounded-xl transition-opacity duration-300 ${
        theme === 'dark' 
          ? 'opacity-0' 
          : 'opacity-100 bg-gradient-to-br from-accent-orange/10 to-accent-yellow/10'
      }`} />
      
      <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-primary/5" />
    </button>
  );
}
