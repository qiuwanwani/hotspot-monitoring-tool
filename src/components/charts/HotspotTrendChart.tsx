'use client';

import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Hotspot } from '@/lib/api';

interface HotspotTrendChartProps {
  hotspots: Hotspot[];
  days?: number;
}

export default function HotspotTrendChart({ hotspots, days = 7 }: HotspotTrendChartProps) {
  const data = useMemo(() => {
    const now = new Date();
    const result = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayHotspots = hotspots.filter(h => {
        const hDate = new Date(h.createdAt);
        return hDate.toISOString().split('T')[0] === dateStr;
      });
      
      result.push({
        date: date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }),
        count: dayHotspots.length,
        avgHeat: dayHotspots.length > 0 
          ? Math.round(dayHotspots.reduce((sum, h) => sum + h.heatScore, 0) / dayHotspots.length)
          : 0,
      });
    }
    
    return result;
  }, [hotspots, days]);

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00d9ff" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#00d9ff" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorHeat" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ff6b35" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#ff6b35" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="#888888"
            opacity={0.2}
          />
          <XAxis 
            dataKey="date" 
            tick={{ fill: '#888888', fontSize: 12, fontWeight: 500 }}
            tickLine={false}
            axisLine={{ stroke: '#888888', opacity: 0.3 }}
          />
          <YAxis 
            yAxisId="left"
            tick={{ fill: '#888888', fontSize: 12, fontWeight: 500 }}
            tickLine={false}
            axisLine={{ stroke: '#888888', opacity: 0.3 }}
          />
          <YAxis 
            yAxisId="right"
            orientation="right"
            tick={{ fill: '#888888', fontSize: 12, fontWeight: 500 }}
            tickLine={false}
            axisLine={{ stroke: '#888888', opacity: 0.3 }}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-card border border-border rounded-lg shadow-lg p-3">
                    <p className="text-foreground font-semibold mb-1">{label}</p>
                    {payload.map((entry: any, index: number) => (
                      <p key={index} className="text-muted-foreground text-sm">
                        <span style={{ color: entry.color }}>●</span>{' '}
                        {entry.name}: {entry.value}
                      </p>
                    ))}
                  </div>
                );
              }
              return null;
            }}
          />
          <Area
            yAxisId="left"
            type="monotone"
            dataKey="count"
            name="热点数量"
            stroke="#00d9ff"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorCount)"
          />
          <Area
            yAxisId="right"
            type="monotone"
            dataKey="avgHeat"
            name="平均热度"
            stroke="#ff6b35"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorHeat)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
