'use client';

import { KPIItem, ChartBlockData, TableBlockData } from '../types';

export interface DataSource {
  id: string;
  name: string;
  type: 'kpis' | 'chart' | 'table';
  description: string;
  requiresCompany: boolean;
}

export interface DataBinding {
  sourceId: string;
  companyId?: string;
  calculation?: 'sum' | 'average' | 'change' | 'none';
  format?: 'currency' | 'percentage' | 'number';
  period?: 'current' | 'previous' | 'ytd';
}

// Available data sources that blocks can bind to
export const dataSources: DataSource[] = [
  {
    id: 'revenue_current',
    name: 'Current Revenue',
    type: 'kpis',
    description: 'Total revenue for the current period',
    requiresCompany: true
  },
  {
    id: 'profit_trend',
    name: 'Profit Trend',
    type: 'chart',
    description: 'Monthly profit trend over time',
    requiresCompany: true
  },
  {
    id: 'expense_breakdown',
    name: 'Expense Breakdown',
    type: 'chart',
    description: 'Breakdown of expenses by category',
    requiresCompany: true
  },
  {
    id: 'pl_summary',
    name: 'P&L Summary',
    type: 'table',
    description: 'Profit & Loss statement summary',
    requiresCompany: true
  },
  {
    id: 'kpi_dashboard',
    name: 'KPI Dashboard',
    type: 'kpis',
    description: 'Key performance indicators',
    requiresCompany: true
  },
  {
    id: 'consolidated_kpis',
    name: 'Consolidated KPIs',
    type: 'kpis',
    description: 'Multi-company consolidated metrics',
    requiresCompany: false
  }
];

class DataBindingService {
  private cache = new Map<string, any>();
  private cacheTimestamps = new Map<string, number>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  private getCacheKey(binding: DataBinding): string {
    return `${binding.sourceId}-${binding.companyId || 'all'}-${binding.period || 'current'}`;
  }

  private isCacheValid(key: string): boolean {
    const timestamp = this.cacheTimestamps.get(key);
    if (!timestamp) return false;
    return Date.now() - timestamp < this.CACHE_TTL;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, data);
    this.cacheTimestamps.set(key, Date.now());
  }

  async bindData(binding: DataBinding): Promise<any> {
    const cacheKey = this.getCacheKey(binding);
    
    // Return cached data if valid
    if (this.isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const result = await this.fetchData(binding);
      this.setCache(cacheKey, result);
      return result;
    } catch (error) {
      console.error('Data binding error:', error);
      // Return mock data on error to keep UI functional
      return this.getMockData(binding);
    }
  }

  private async fetchData(binding: DataBinding): Promise<any> {
    const source = dataSources.find(s => s.id === binding.sourceId);
    if (!source) {
      throw new Error(`Unknown data source: ${binding.sourceId}`);
    }

    // For now, using mock data until live data integration is ready
    return this.getMockData(binding);
  }

  private getMockData(binding: DataBinding): any {
    const source = dataSources.find(s => s.id === binding.sourceId);
    if (!source) return null;

    switch (binding.sourceId) {
      case 'revenue_current':
        return [{
          label: 'Total Revenue',
          value: 450000 + Math.random() * 100000,
          delta: 5.2 + Math.random() * 10
        }];
      
      case 'profit_trend':
        return {
          type: 'line' as const,
          title: 'Profit Trend',
          series: [{
            name: 'Net Profit',
            data: [45000, 52000, 48000, 61000, 58000, 63000],
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
          }]
        };
      
      case 'expense_breakdown':
        return {
          type: 'pie' as const,
          title: 'Expense Breakdown',
          series: [{
            name: 'Expenses',
            data: [85000, 45000, 32000, 28000, 15000],
            labels: ['Salaries', 'Rent', 'Marketing', 'Utilities', 'Other']
          }]
        };
      
      case 'pl_summary':
        return {
          headers: ['Account', 'Current', 'Previous', 'Change'],
          rows: [
            {
              account: 'Revenue',
              current: '$485,000',
              previous: '$420,000',
              change: '+15.5%'
            },
            {
              account: 'Cost of Goods Sold',
              current: '$205,000',
              previous: '$180,000',
              change: '+13.9%'
            },
            {
              account: 'Gross Profit',
              current: '$280,000',
              previous: '$240,000',
              change: '+16.7%'
            },
            {
              account: 'Operating Expenses',
              current: '$175,000',
              previous: '$165,000',
              change: '+6.1%'
            },
            {
              account: 'Net Income',
              current: '$105,000',
              previous: '$75,000',
              change: '+40.0%'
            }
          ]
        };
      
      case 'kpi_dashboard':
        return [
          {
            label: 'Revenue',
            value: 485000,
            delta: 15.5
          },
          {
            label: 'Total Expenses',
            value: 380000,
            delta: -5.2
          },
          {
            label: 'Net Profit',
            value: 105000,
            delta: 40.0
          },
          {
            label: 'Gross Margin',
            value: 57.7,
            delta: 2.1
          }
        ];
      
      case 'consolidated_kpis':
        return [
          {
            label: 'Total Group Revenue',
            value: 2450000,
            delta: 12.3
          },
          {
            label: 'Group Net Profit',
            value: 385000,
            delta: 8.9
          },
          {
            label: 'Average Margin',
            value: 15.7,
            delta: 1.2
          },
          {
            label: 'Companies Count',
            value: 3,
            delta: 0
          }
        ];

      default:
        switch (source.type) {
          case 'kpis':
            return [{
              label: 'Mock KPI',
              value: 100000,
              delta: 5.0
            }];
          
          case 'chart':
            return {
              type: 'bar' as const,
              title: 'Mock Chart',
              series: [{
                name: 'Mock Data',
                data: [10, 20, 30, 40, 50],
                labels: ['A', 'B', 'C', 'D', 'E']
              }]
            };
          
          case 'table':
            return {
              headers: ['Mock', 'Data'],
              rows: [
                { mock: 'Row 1', data: 'Value 1' },
                { mock: 'Row 2', data: 'Value 2' }
              ]
            };
          
          default:
            return null;
        }
    }
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  }

  private formatPercentage(value: number): string {
    return `${value.toFixed(1)}%`;
  }

  clearCache(): void {
    this.cache.clear();
    this.cacheTimestamps.clear();
  }
}

export const dataBindingService = new DataBindingService();