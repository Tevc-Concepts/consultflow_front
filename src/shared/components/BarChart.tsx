'use client';

import React from 'react';

interface BarChartData {
  name: string;
  [key: string]: any;
}

interface BarChartProps {
  data: BarChartData[];
  bars: Array<{
    dataKey: string;
    fill: string;
    name?: string;
  }>;
  height?: string | number;
  loading?: boolean;
}

// Dynamic Recharts component that loads only on client
const DynamicRechartsBarChart = React.lazy(() => 
  import('recharts').then((recharts) => {
    const Component = ({ data, bars, height = "100%" }: BarChartProps) => {
      const { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } = recharts;
      
      return (
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={data} margin={{ left: 12, right: 12, top: 8, bottom: 80 }}>
            <XAxis 
              dataKey="name" 
              angle={-45}
              textAnchor="end"
              height={100}
              tick={{ fontSize: 12 }}
              interval={0}
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
            />
            <Legend />
            {bars.map((bar) => (
              <Bar 
                key={bar.dataKey}
                dataKey={bar.dataKey} 
                fill={bar.fill}
                name={bar.name || bar.dataKey}
                radius={[4, 4, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      );
    };
    
    return { default: Component };
  })
);

export default function RechartsBarChart(props: BarChartProps) {
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
      <DynamicRechartsBarChart data={data} {...restProps} />
    </React.Suspense>
  );
}

export { RechartsBarChart };