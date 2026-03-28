'use client';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md';
  className?: string;
}

export default function Badge({ 
  children, 
  variant = 'default', 
  size = 'sm',
  className = '' 
}: BadgeProps) {
  const variants = {
    default: 'bg-background-tertiary text-foreground-muted border-border',
    primary: 'bg-primary/10 text-primary border-primary/20',
    secondary: 'bg-secondary/10 text-secondary border-secondary/20',
    success: 'bg-accent-green/10 text-accent-green border-accent-green/20',
    warning: 'bg-accent-orange/10 text-accent-orange border-accent-orange/20',
    danger: 'bg-accent-red/10 text-accent-red border-accent-red/20',
    info: 'bg-primary/10 text-primary border-primary/20',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
  };

  return (
    <span
      className={`
        inline-flex items-center gap-1 font-medium rounded-full border
        ${variants[variant]} 
        ${sizes[size]}
        ${className}
      `}
    >
      {children}
    </span>
  );
}

interface HeatBadgeProps {
  score: number;
  className?: string;
}

export function HeatBadge({ score, className = '' }: HeatBadgeProps) {
  const getHeatConfig = (score: number) => {
    if (score >= 80) return { 
      label: 'Hot', 
      color: 'bg-accent-red/20 text-accent-red border-accent-red/30',
      bars: 4 
    };
    if (score >= 60) return { 
      label: 'Trending', 
      color: 'bg-accent-orange/20 text-accent-orange border-accent-orange/30',
      bars: 3 
    };
    if (score >= 40) return { 
      label: 'Rising', 
      color: 'bg-accent-yellow/20 text-accent-yellow border-accent-yellow/30',
      bars: 2 
    };
    return { 
      label: 'New', 
      color: 'bg-accent-green/20 text-accent-green border-accent-green/30',
      bars: 1 
    };
  };

  const config = getHeatConfig(score);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex items-end gap-0.5 h-4">
        {[1, 2, 3, 4].map((bar) => (
          <div
            key={bar}
            className={`w-1 rounded-full transition-all duration-300 ${
              bar <= config.bars 
                ? config.color.split(' ')[0].replace('/20', '') 
                : 'bg-border'
            }`}
            style={{ height: `${bar * 25}%` }}
          />
        ))}
      </div>
      <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${config.color}`}>
        {score}
      </span>
    </div>
  );
}

interface StatusBadgeProps {
  status: 'active' | 'inactive' | 'pending' | 'error';
  className?: string;
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const configs = {
    active: { 
      label: 'Active', 
      color: 'bg-accent-green/10 text-accent-green border-accent-green/20',
      dot: 'bg-accent-green' 
    },
    inactive: { 
      label: 'Inactive', 
      color: 'bg-background-tertiary text-foreground-muted border-border',
      dot: 'bg-foreground-muted' 
    },
    pending: { 
      label: 'Pending', 
      color: 'bg-accent-yellow/10 text-accent-yellow border-accent-yellow/20',
      dot: 'bg-accent-yellow animate-pulse' 
    },
    error: { 
      label: 'Error', 
      color: 'bg-accent-red/10 text-accent-red border-accent-red/20',
      dot: 'bg-accent-red' 
    },
  };

  const config = configs[status];

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-full border
        ${config.color}
        ${className}
      `}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}
