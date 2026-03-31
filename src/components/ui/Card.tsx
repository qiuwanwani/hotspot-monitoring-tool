'use client';

import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export default function Card({ 
  children, 
  className = '', 
  hover = false, 
  glow = false,
  onClick,
  style
}: CardProps) {
  return (
    <div 
      onClick={onClick}
      style={style}
      className={`
        relative rounded-xl bg-card border border-border
        ${hover ? 'hover:bg-card-hover hover:border-border-light cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card-hover' : ''}
        ${glow ? 'glow-border' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  icon?: ReactNode;
}

export function CardHeader({ title, subtitle, action, icon }: CardHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-center gap-3">
        {icon && (
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            {icon}
          </div>
        )}
        <div>
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          {subtitle && (
            <p className="text-sm text-foreground-muted mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon?: ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  color?: 'primary' | 'secondary' | 'green' | 'orange';
}

export function StatCard({ 
  title, 
  value, 
  change, 
  icon, 
  trend = 'neutral',
  color = 'primary'
}: StatCardProps) {
  const colorClasses = {
    primary: 'text-primary bg-primary/10',
    secondary: 'text-secondary bg-secondary/10',
    green: 'text-accent-green bg-accent-green/10',
    orange: 'text-accent-orange bg-accent-orange/10',
  };

  const trendColors = {
    up: 'text-accent-green',
    down: 'text-accent-red',
    neutral: 'text-foreground-muted'
  };

  return (
    <Card hover className="stat-card-glow p-5">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-foreground-muted font-medium">{title}</p>
          <p className="text-3xl font-bold text-foreground mt-2 tabular-nums">
            {value.toLocaleString()}
          </p>
          {change !== undefined && (
            <p className={`text-sm mt-2 flex items-center gap-1 ${trendColors[trend]}`}>
              {trend === 'up' && '↑'}
              {trend === 'down' && '↓'}
              <span>{Math.abs(change)}%</span>
              <span className="text-foreground-subtle text-xs">vs last week</span>
            </p>
          )}
        </div>
        {icon && (
          <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}

interface HotspotCardProps {
  title: string;
  source: string;
  heatScore: number;
  time: string;
  category?: string;
  isVerified?: boolean;
  onClick?: () => void;
}

export function HotspotCard({
  title,
  source,
  heatScore,
  time,
  category,
  isVerified,
  onClick,
}: HotspotCardProps) {
  const getHeatColor = (score: number) => {
    if (score >= 80) return 'text-accent-red';
    if (score >= 60) return 'text-accent-orange';
    if (score >= 40) return 'text-accent-yellow';
    return 'text-accent-green';
  };

  return (
    <Card 
      hover 
      onClick={onClick}
      className="hotspot-item p-4 group"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            {category && (
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-secondary/20 text-secondary">
                {category}
              </span>
            )}
            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-background-tertiary text-foreground-muted">
              {source}
            </span>
            {isVerified && (
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-accent-green/20 text-accent-green">
                Verified
              </span>
            )}
          </div>
          <h4 className="text-foreground font-medium group-hover:text-primary transition-colors line-clamp-2">
            {title}
          </h4>
          <p className="text-xs text-foreground-subtle mt-2">{time}</p>
        </div>
        <div className={`text-2xl font-bold tabular-nums ${getHeatColor(heatScore)}`}>
          {heatScore}
        </div>
      </div>
    </Card>
  );
}
