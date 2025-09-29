'use client';

import React from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Block, KPIItem, ChartBlockData, TableBlockData } from '../types';
import { dataBindingService } from '../services/dataBindingService';

interface LiveBlockProps {
  block: Block;
  isSelected?: boolean;
  onClick?: () => void;
  onRemove?: () => void;
}

export default function LiveBlock({ block, isSelected = false, onClick, onRemove }: LiveBlockProps) {
  const [data, setData] = React.useState<any>(block.data);
  const [isLoading, setIsLoading] = React.useState(false);

  const loadLiveData = React.useCallback(async () => {
    if (!block.binding || block.binding === 'none') return;
    
    setIsLoading(true);
    try {
      const liveData = await dataBindingService.bindData({
        sourceId: block.binding
      });
      setData(liveData);
    } catch (error) {
      console.error('Failed to load live data:', error);
      setData(block.data);
    } finally {
      setIsLoading(false);
    }
  }, [block.binding, block.data]);

  React.useEffect(() => {
    if (block.binding && block.binding !== 'none') {
      loadLiveData();
    } else {
      setData(block.data);
    }
  }, [block.binding, block.data, loadLiveData]);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cobalt"></div>
        </div>
      );
    }

    switch (block.kind) {
      case 'kpis':
        return <KPIBlockContent data={data} />;
      case 'chart':
        return <ChartBlockContent data={data} />;
      case 'table':
        return <TableBlockContent data={data} />;
      case 'narrative':
        return <NarrativeBlockContent data={data} />;
      case 'raw':
        return <RawBlockContent data={data} />;
      default:
        return <div className="text-center text-deep-navy/60 py-4">Unknown block type</div>;
    }
  };

  return (
    <div
      className={[
        'border rounded-xl p-4 transition-colors cursor-pointer',
        isSelected
          ? 'border-cobalt bg-cobalt/5'
          : 'border-medium/40 hover:border-cobalt/50'
      ].join(' ')}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-deep-navy/70 uppercase tracking-wide">
            {block.kind}
          </span>
          {block.binding && block.binding !== 'none' && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
              Live
            </span>
          )}
        </div>
        {onRemove && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="text-coral hover:bg-coral/10 p-1 rounded"
          >
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      
      <div className="bg-light/50 rounded p-3">
        {renderContent()}
      </div>
    </div>
  );
}

function KPIBlockContent({ data }: { data: KPIItem[] | any }) {
  const kpis = Array.isArray(data) ? data : [];

  if (kpis.length === 0) {
    return <div className="text-center text-deep-navy/60">No KPI data available</div>;
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {kpis.map((kpi: KPIItem, index: number) => (
        <div key={index} className="text-center">
          <div className="text-xs text-deep-navy/70 mb-1">{kpi.label}</div>
          <div className="font-bold text-cobalt">
            {typeof kpi.value === 'number' 
              ? kpi.value.toLocaleString() 
              : kpi.value}
          </div>
          {kpi.delta !== undefined && (
            <div className={`text-xs mt-1 ${kpi.delta >= 0 ? 'text-green-600' : 'text-coral'}`}>
              {kpi.delta >= 0 ? '+' : ''}{kpi.delta.toFixed(1)}%
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function ChartBlockContent({ data }: { data: ChartBlockData | any }) {
  if (!data || !data.series || data.series.length === 0) {
    return <div className="text-center text-deep-navy/60">No chart data available</div>;
  }

  const chartData = data.series[0].labels?.map((label: string, index: number) => ({
    name: label,
    value: data.series[0].data[index]
  })) || data.series[0].data.map((value: number, index: number) => ({
    name: `Item ${index + 1}`,
    value
  }));

  const colors = ['#2563eb', '#dc2626', '#059669', '#d97706', '#7c3aed', '#db2777'];

  return (
    <div>
      {data.title && (
        <h4 className="text-sm font-medium text-center mb-3">{data.title}</h4>
      )}
      <div style={{ width: '100%', height: '200px' }}>
        <ResponsiveContainer>
          {data.type === 'line' ? (
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#2563eb" />
            </LineChart>
          ) : data.type === 'pie' ? (
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                dataKey="value"
              >
                {chartData.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          ) : (
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#2563eb" />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function TableBlockContent({ data }: { data: TableBlockData | any }) {
  if (!data || !data.headers || !data.rows) {
    return <div className="text-center text-deep-navy/60">No table data available</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            {data.headers.map((header: string, index: number) => (
              <th key={index} className="text-left py-2 px-2 font-medium text-deep-navy/80">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.rows.slice(0, 5).map((row: any, rowIndex: number) => (
            <tr key={rowIndex} className="border-b border-medium/20">
              {data.headers.map((header: string, colIndex: number) => (
                <td key={colIndex} className="py-2 px-2 text-deep-navy/70">
                  {row[header.toLowerCase()] || row[Object.keys(row)[colIndex]] || '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {data.rows.length > 5 && (
        <div className="text-xs text-deep-navy/50 text-center mt-2">
          +{data.rows.length - 5} more rows
        </div>
      )}
    </div>
  );
}

function NarrativeBlockContent({ data }: { data: any }) {
  return (
    <div>
      {data.title && (
        <h4 className="font-medium text-deep-navy mb-2">{data.title}</h4>
      )}
      <p className="text-sm text-deep-navy/80 leading-relaxed">
        {data.body || 'Enter your narrative content...'}
      </p>
    </div>
  );
}

function RawBlockContent({ data }: { data: any }) {
  return (
    <div className="font-mono text-xs text-deep-navy/70 bg-light/80 rounded p-2 max-h-32 overflow-y-auto">
      <pre className="whitespace-pre-wrap">
        {typeof data === 'object' ? JSON.stringify(data, null, 2) : String(data)}
      </pre>
    </div>
  );
}