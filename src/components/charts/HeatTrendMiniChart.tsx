'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface HeatHistoryItem {
  heatScore: number;
  recordedAt: string;
}

interface HeatTrendMiniChartProps {
  data: HeatHistoryItem[];
}

export default function HeatTrendMiniChart({ data }: HeatTrendMiniChartProps) {
  const chartData = data.map((item) => ({
    time: new Date(item.recordedAt).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    }),
    score: item.heatScore,
  }));

  return (
    <div className="w-full h-32">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis
            dataKey="time"
            stroke="rgba(255,255,255,0.3)"
            fontSize={10}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            stroke="rgba(255,255,255,0.3)"
            fontSize={10}
            tickLine={false}
            domain={[0, 100]}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(15, 15, 25, 0.95)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '12px',
            }}
            formatter={(value: number) => [`热度: ${value}`, '']}
          />
          <Line
            type="monotone"
            dataKey="score"
            stroke="#00d9ff"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: '#00d9ff' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
