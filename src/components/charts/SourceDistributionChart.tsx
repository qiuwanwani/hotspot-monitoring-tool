'use client';

import { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import { Hotspot } from '@/lib/api';

interface SourceDistributionChartProps {
  hotspots: Hotspot[];
}

const COLORS = ['#00d9ff', '#ff6b35', '#00ff88', '#ffcc00', '#ff3366', '#9966ff'];

export default function SourceDistributionChart({ hotspots }: SourceDistributionChartProps) {
  const data = useMemo(() => {
    const sourceCount: Record<string, number> = {};
    
    hotspots.forEach(h => {
      sourceCount[h.source] = (sourceCount[h.source] || 0) + 1;
    });
    
    return Object.entries(sourceCount)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [hotspots]);

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="45%"
            innerRadius={50}
            outerRadius={70}
            paddingAngle={4}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={COLORS[index % COLORS.length]}
                stroke="transparent"
                strokeWidth={0}
              />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const entry = payload[0];
                return (
                  <div className="bg-card border border-border rounded-lg shadow-lg p-3">
                    <p className="text-foreground font-semibold mb-1">{entry.name}</p>
                    <p className="text-muted-foreground text-sm">
                      <span style={{ color: entry.payload.fill }}>●</span>{' '}
                      数量: {entry.value} 个热点
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Legend
            verticalAlign="bottom"
            align="center"
            layout="horizontal"
            iconType="circle"
            iconSize={8}
            wrapperStyle={{
              paddingTop: '16px',
              fontSize: '12px',
              fontWeight: 500,
              color: '#888888',
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
