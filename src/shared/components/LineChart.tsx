'use client';

import React from 'react';

interface LineChartData {
  date: string;
  [key: string]: any;
}

interface LineChartProps {
  data: LineChartData[];
  lines: Array<{
    dataKey: string;
    stroke: string;
    name?: string;
  }>;
  height?: string | number;
  loading?: boolean;
}

// Dynamic Recharts component that loads only on client
const DynamicRechartsLineChart = React.lazy(() => 
  import('recharts').then((recharts) => {
    const Component = ({ data, lines, height = "100%" }: LineChartProps) => {
      const { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend } = recharts;
      
      return (
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={data} margin={{ left: 12, right: 12, top: 8, bottom: 8 }}>
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }} 
              tickFormatter={(value: any) => {
                try {
                  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                } catch {
                  return value;
                }
              }}
            />
            <YAxis 
              tick={{ fontSize: 12 }} 
              width={60}
              tickFormatter={(value: any) => {
                if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
                return value.toString();
              }}
            />
            <Tooltip 
              contentStyle={{ 
                borderRadius: 12, 
                border: 'none', 
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' 
              }}
              formatter={(value: any, name: any) => [
                typeof value === 'number' ? value.toLocaleString() : value,
                name
              ]}
              labelFormatter={(label: any) => {
                try {
                  return new Date(label).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  });
                } catch {
                  return label;
                }
              }}
            />
            <Legend />
            {lines.map((line) => (
              <Line 
                key={line.dataKey}
                type="monotone" 
                dataKey={line.dataKey} 
                stroke={line.stroke} 
                strokeWidth={2} 
                dot={false}
                name={line.name || line.dataKey}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      );
    };
    
    return { default: Component };
  })
);

export default function RechartsLineChart(props: LineChartProps) {
  const { loading = false, data, ...restProps } = props;
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || loading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-medium/20 rounded animate-pulse">
        <div className="text-sm text-deep-navy/70">Loading chart...</div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-medium/10 rounded border-2 border-dashed border-medium/40">
        <div className="text-center">
          <div className="text-2xl mb-2">📊</div>
          <div className="text-sm text-deep-navy/70">No chart data available</div>
        </div>
      </div>
    );
  }

  return (
    <React.Suspense 
      fallback={
        <div className="h-full w-full flex items-center justify-center bg-medium/20 rounded animate-pulse">
          <div className="text-sm text-deep-navy/70">Loading chart...</div>
        </div>
      }
    >
      <DynamicRechartsLineChart data={data} {...restProps} />
    </React.Suspense>
  );
}

export { RechartsLineChart };