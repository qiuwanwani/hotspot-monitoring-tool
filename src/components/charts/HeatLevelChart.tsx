'use client';

import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Hotspot } from '@/lib/api';

interface HeatLevelChartProps {
  hotspots: Hotspot[];
}

export default function HeatLevelChart({ hotspots }: HeatLevelChartProps) {
  const data = useMemo(() => {
    const levels = [
      { range: '0-20', label: '冷', count: 0, color: '#64748b' },
      { range: '21-40', label: '温', count: 0, color: '#22c55e' },
      { range: '41-60', label: '热', count: 0, color: '#eab308' },
      { range: '61-80', label: '火', count: 0, color: '#f97316' },
      { range: '81-100', label: '爆', count: 0, color: '#ef4444' },
    ];

    hotspots.forEach(h => {
      const score = h.heatScore;
      if (score <= 20) levels[0].count++;
      else if (score <= 40) levels[1].count++;
      else if (score <= 60) levels[2].count++;
      else if (score <= 80) levels[3].count++;
      else levels[4].count++;
    });

    return levels;
  }, [hotspots]);

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="#888888"
            opacity={0.2}
          />
          <XAxis
            dataKey="label"
            tick={{ fill: '#888888', fontSize: 13, fontWeight: 600 }}
            tickLine={false}
            axisLine={{ stroke: '#888888', opacity: 0.3 }}
          />
          <YAxis
            tick={{ fill: '#888888', fontSize: 12, fontWeight: 500 }}
            tickLine={false}
            axisLine={{ stroke: '#888888', opacity: 0.3 }}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                const entry = payload[0];
                return (
                  <div className="bg-card border border-border rounded-lg shadow-lg p-3">
                    <p className="text-foreground font-semibold mb-1">热度等级: {label}</p>
                    <p className="text-muted-foreground text-sm">
                      <span style={{ color: entry.payload.color }}>●</span>{' '}
                      数量: {entry.value} 个热点
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar
            dataKey="count"
            radius={[6, 6, 0, 0]}
            fill="#00d9ff"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
