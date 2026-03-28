'use client';

import { Search } from 'lucide-react';

interface InputProps {
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  icon?: React.ReactNode;
  className?: string;
}

export default function Input({
  type = 'text',
  placeholder,
  value,
  onChange,
  icon,
  className = ''
}: InputProps) {
  return (
    <div className={`relative ${className}`}>
      {icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted">
          {icon}
        </div>
      )}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className={`
          w-full h-11 bg-card border border-border rounded-lg
          px-4 text-foreground placeholder:text-foreground-subtle
          focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary
          transition-all duration-200
          ${icon ? 'pl-10' : ''}
        `}
      />
    </div>
  );
}

interface SearchInputProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
}

export function SearchInput({ placeholder = '搜索...', value, onChange, className }: SearchInputProps) {
  return (
    <Input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      icon={<Search size={18} />}
      className={className}
    />
  );
}
