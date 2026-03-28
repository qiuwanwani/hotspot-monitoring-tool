'use client';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md';
}

export default function Badge({ children, variant = 'default', size = 'sm' }: BadgeProps) {
  const variants = {
    default: 'bg-card text-foreground-muted border-border',
    primary: 'bg-primary/10 text-primary border-primary/20',
    success: 'bg-accent-green/10 text-accent-green border-accent-green/20',
    warning: 'bg-accent-orange/10 text-accent-orange border-accent-orange/20',
    danger: 'bg-accent-red/10 text-accent-red border-accent-red/20',
    info: 'bg-accent-purple/10 text-accent-purple border-accent-purple/20'
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm'
  };

  return (
    <span className={`inline-flex items-center rounded-full border font-medium ${variants[variant]} ${sizes[size]}`}>
      {children}
    </span>
  );
}

interface HeatBadgeProps {
  score: number;
}

export function HeatBadge({ score }: HeatBadgeProps) {
  if (score >= 80) {
    return <Badge variant="danger">极高热度</Badge>;
  }
  if (score >= 60) {
    return <Badge variant="warning">高热度</Badge>;
  }
  if (score >= 40) {
    return <Badge variant="info">中等热度</Badge>;
  }
  return <Badge variant="success">低热度</Badge>;
}
