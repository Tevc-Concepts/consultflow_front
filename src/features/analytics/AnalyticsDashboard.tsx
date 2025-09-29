'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Card from '@components/ui/Card';
import Button from '@components/ui/Button';
import { analyticsService, FinancialMetrics, Insight, Forecast } from '@features/analytics/service';
import { useAppStore } from '@shared/state/app';
import dynamic from 'next/dynamic';

const ResponsiveContainer: any = dynamic(() => import('recharts').then(m => m.ResponsiveContainer as any), { ssr: false });
const LineChart: any = dynamic(() => import('recharts').then(m => m.LineChart as any), { ssr: false });
const Line: any = dynamic(() => import('recharts').then(m => m.Line as any), { ssr: false });
const XAxis: any = dynamic(() => import('recharts').then(m => m.XAxis as any), { ssr: false });
const YAxis: any = dynamic(() => import('recharts').then(m => m.YAxis as any), { ssr: false });
const Tooltip: any = dynamic(() => import('recharts').then(m => m.Tooltip as any), { ssr: false });
const BarChart: any = dynamic(() => import('recharts').then(m => m.BarChart as any), { ssr: false });
const Bar: any = dynamic(() => import('recharts').then(m => m.Bar as any), { ssr: false });

export default function AnalyticsDashboard() {
    const { selectedCompanyIds, consolidated, reportingCurrency } = useAppStore();
    const [loading, setLoading] = useState(true);
    const [metrics, setMetrics] = useState<FinancialMetrics | null>(null);
    const [insights, setInsights] = useState<Insight[]>([]);
    const [forecasts, setForecast] = useState<Forecast[]>([]);
    const [benchmarks, setBenchmarks] = useState<FinancialMetrics | null>(null);
    const [anomalies, setAnomalies] = useState<Insight[]>([]);
    const [activeTab, setActiveTab] = useState<'overview' | 'forecasts' | 'insights' | 'benchmarks'>('overview');

    const loadAnalytics = useCallback(async () => {
        setLoading(true);
        try {
            const currentCompanyId = consolidated && selectedCompanyIds.length > 0
                ? selectedCompanyIds[0]
                : 'lagos'; // Default demo company id

            const endDate = new Date().toISOString().split('T')[0];
            const startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

            // Load all analytics data
            const [metricsData, forecastData, benchmarkData, anomaliesData] = await Promise.all([
                analyticsService.calculateFinancialMetrics(currentCompanyId, {
                    start_date: startDate,
                    end_date: endDate
                }),
                analyticsService.generateForecast(currentCompanyId, {
                    forecast_periods: 12,
                    method: 'linear',
                    confidence_level: 0.85
                }),
                analyticsService.getBenchmarkData('technology', 'medium'),
                analyticsService.detectAnomalies(currentCompanyId)
            ]);

            setMetrics(metricsData);
            // Generate insights based on the actual computed metrics
            setInsights(await analyticsService.generateInsights(currentCompanyId, metricsData));
            setForecast(forecastData);
            setBenchmarks(benchmarkData);
            setAnomalies(anomaliesData);
        } catch (error) {
            console.error('Failed to load analytics:', error);
        } finally {
            setLoading(false);
        }
    }, [consolidated, selectedCompanyIds]);

    useEffect(() => {
        loadAnalytics();
    }, [loadAnalytics]);

    const formatPercentage = (value: number) => `${(value * 100).toFixed(1)}%`;
    const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: reportingCurrency
    }).format(value);

    const getSeverityColor = (severity: 'low' | 'medium' | 'high') => {
        switch (severity) {
            case 'high': return 'text-coral bg-coral/10 border-coral/20';
            case 'medium': return 'text-amber bg-amber/10 border-amber/20';
            default: return 'text-emerald bg-emerald/10 border-emerald/20';
        }
    };

    const getTypeIcon = (type: 'opportunity' | 'risk' | 'trend' | 'anomaly') => {
        switch (type) {
            case 'opportunity': return '📈';
            case 'risk': return '⚠️';
            case 'trend': return '📊';
            case 'anomaly': return '🔍';
            default: return 'ℹ️';
        }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Card key={i} className="animate-pulse">
                        <div className="h-48 bg-medium/40 rounded"></div>
                    </Card>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-deep-navy">Analytics Dashboard</h1>
                    <p className="text-deep-navy/70">Advanced insights and forecasting</p>
                </div>
                <Button onClick={loadAnalytics} variant="ghost" size="sm">
                    🔄 Refresh Data
                </Button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex space-x-1 bg-medium/30 rounded-xl p-1">
                {[
                    { key: 'overview', label: 'Overview', icon: '📊' },
                    { key: 'forecasts', label: 'Forecasts', icon: '🔮' },
                    { key: 'insights', label: 'Insights', icon: '💡' },
                    { key: 'benchmarks', label: 'Benchmarks', icon: '📏' }
                ].map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key as any)}
                        className={[
                            'flex items-center gap-2 px-4 py-2 rounded-xl transition-colors',
                            activeTab === tab.key
                                ? 'bg-white text-deep-navy shadow-sm'
                                : 'text-deep-navy/70 hover:text-deep-navy hover:bg-white/50'
                        ].join(' ')}
                    >
                        <span>{tab.icon}</span>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && metrics && (
                <div className="space-y-6">
                    {/* Key Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card className="p-4">
                            <h3 className="text-sm font-medium text-deep-navy/70 mb-2">Gross Margin</h3>
                            <div className="text-2xl font-semibold text-emerald">
                                {formatPercentage(metrics.profitability.gross_margin)}
                            </div>
                            <div className="text-xs text-deep-navy/60">
                                Target: 40%
                            </div>
                        </Card>

                        <Card className="p-4">
                            <h3 className="text-sm font-medium text-deep-navy/70 mb-2">Current Ratio</h3>
                            <div className="text-2xl font-semibold text-cobalt">
                                {metrics.liquidity.current_ratio.toFixed(2)}
                            </div>
                            <div className="text-xs text-deep-navy/60">
                                Target: 2.0
                            </div>
                        </Card>

                        <Card className="p-4">
                            <h3 className="text-sm font-medium text-deep-navy/70 mb-2">ROA</h3>
                            <div className="text-2xl font-semibold text-violet">
                                {formatPercentage(metrics.profitability.return_on_assets)}
                            </div>
                            <div className="text-xs text-deep-navy/60">
                                Industry avg: 8%
                            </div>
                        </Card>

                        <Card className="p-4">
                            <h3 className="text-sm font-medium text-deep-navy/70 mb-2">Debt-to-Equity</h3>
                            <div className="text-2xl font-semibold text-coral">
                                {metrics.leverage.debt_to_equity.toFixed(2)}
                            </div>
                            <div className="text-xs text-deep-navy/60">
                                Target: &lt;0.5
                            </div>
                        </Card>
                    </div>

                    {/* Recent Insights */}
                    <Card>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">Recent Insights</h3>
                            <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => setActiveTab('insights')}
                            >
                                View All
                            </Button>
                        </div>
                        
                        <div className="space-y-3">
                            {insights.slice(0, 3).map((insight) => (
                                <div key={insight.id} className="flex items-start gap-3 p-3 border border-medium/40 rounded-xl">
                                    <div className="text-xl">{getTypeIcon(insight.type)}</div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-medium">{insight.title}</h4>
                                            <span className={`text-xs px-2 py-1 rounded-full border ${getSeverityColor(insight.severity)}`}>
                                                {insight.severity}
                                            </span>
                                        </div>
                                        <p className="text-sm text-deep-navy/70">{insight.description}</p>
                                        <p className="text-xs text-cobalt mt-1">{insight.recommendation}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* Anomalies */}
                    {anomalies.length > 0 && (
                        <Card>
                            <h3 className="text-lg font-semibold mb-4">⚠️ Anomalies Detected</h3>
                            <div className="space-y-2">
                                {anomalies.slice(0, 2).map((anomaly) => (
                                    <div key={anomaly.id} className="flex items-center justify-between p-3 bg-amber/10 border border-amber/20 rounded-xl">
                                        <div>
                                            <div className="font-medium text-amber">{anomaly.title}</div>
                                            <div className="text-sm text-deep-navy/70">{anomaly.description}</div>
                                        </div>
                                        <Button size="sm" variant="ghost">Review</Button>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}
                </div>
            )}

            {/* Forecasts Tab */}
            {activeTab === 'forecasts' && (
                <div className="space-y-6">
                    <Card>
                        <h3 className="text-lg font-semibold mb-4">12-Month Revenue Forecast</h3>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={forecasts.map((f, i) => ({
                                    period: f.period,
                                    predicted: f.revenue.predicted / 1000,
                                    lower: f.revenue.lower_bound / 1000,
                                    upper: f.revenue.upper_bound / 1000,
                                    confidence: f.revenue.confidence * 100
                                }))}>
                                    <XAxis dataKey="period" />
                                    <YAxis />
                                    <Tooltip 
                                        labelFormatter={(label: any) => `Period: ${label}`}
                                        formatter={(value: any, name: any) => [
                                            `${reportingCurrency} ${Number(value).toLocaleString()}K`,
                                            name === 'predicted' ? 'Forecast' : name === 'confidence' ? 'Confidence %' : name
                                        ]}
                                    />
                                    <Line type="monotone" dataKey="predicted" stroke="#2774FF" strokeWidth={3} />
                                    <Line type="monotone" dataKey="lower" stroke="#FF6F59" strokeDasharray="5 5" />
                                    <Line type="monotone" dataKey="upper" stroke="#3AD29F" strokeDasharray="5 5" />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <h3 className="text-lg font-semibold mb-4">Cash Flow Forecast</h3>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={forecasts.slice(0, 6).map(f => ({
                                        period: f.period,
                                        cashFlow: f.cash_flow.predicted / 1000
                                    }))}>
                                        <XAxis dataKey="period" />
                                        <YAxis />
                                        <Tooltip formatter={(value: any) => [`${reportingCurrency} ${Number(value).toLocaleString()}K`, 'Cash Flow']} />
                                        <Bar dataKey="cashFlow" fill="#12B5B1" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>

                        <Card>
                            <h3 className="text-lg font-semibold mb-4">Forecast Assumptions</h3>
                            <ul className="space-y-2 text-sm">
                                {forecasts[0]?.assumptions.map((assumption, i) => (
                                    <li key={i} className="flex items-center gap-2">
                                        <span className="text-cobalt">•</span>
                                        {assumption}
                                    </li>
                                ))}
                            </ul>
                            <div className="mt-4 p-3 bg-cobalt/10 border border-cobalt/20 rounded-xl">
                                <div className="text-xs text-cobalt font-medium">Model Confidence</div>
                                <div className="text-lg font-semibold text-cobalt">
                                    {((forecasts[0]?.revenue.confidence || 0.85) * 100).toFixed(0)}%
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            )}

            {/* Insights Tab */}
            {activeTab === 'insights' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {insights.map((insight) => (
                        <Card key={insight.id}>
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-xl">{getTypeIcon(insight.type)}</span>
                                    <h3 className="font-semibold">{insight.title}</h3>
                                </div>
                                <span className={`text-xs px-2 py-1 rounded-full border ${getSeverityColor(insight.severity)}`}>
                                    {insight.severity}
                                </span>
                            </div>
                            
                            <p className="text-deep-navy/80 mb-3">{insight.description}</p>
                            <p className="text-sm text-deep-navy/70 mb-3">
                                <span className="font-medium">Impact:</span> {insight.impact}
                            </p>
                            
                            <div className="p-3 bg-cobalt/10 border border-cobalt/20 rounded-xl">
                                <div className="text-sm font-medium text-cobalt mb-1">Recommendation</div>
                                <div className="text-sm text-deep-navy">{insight.recommendation}</div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Benchmarks Tab */}
            {activeTab === 'benchmarks' && metrics && benchmarks && (
                <div className="space-y-6">
                    <Card>
                        <h3 className="text-lg font-semibold mb-4">Industry Benchmarks Comparison</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h4 className="font-medium mb-3">Profitability Metrics</h4>
                                <div className="space-y-3">
                                    {[
                                        { label: 'Gross Margin', current: metrics.profitability.gross_margin, benchmark: benchmarks.profitability.gross_margin },
                                        { label: 'Operating Margin', current: metrics.profitability.operating_margin, benchmark: benchmarks.profitability.operating_margin },
                                        { label: 'Net Margin', current: metrics.profitability.net_margin, benchmark: benchmarks.profitability.net_margin }
                                    ].map((metric) => (
                                        <div key={metric.label} className="space-y-1">
                                            <div className="flex justify-between text-sm">
                                                <span>{metric.label}</span>
                                                <span className={metric.current >= metric.benchmark ? 'text-emerald' : 'text-coral'}>
                                                    {formatPercentage(metric.current)} vs {formatPercentage(metric.benchmark)}
                                                </span>
                                            </div>
                                            <div className="flex gap-2 h-2">
                                                <div className="flex-1 bg-medium/40 rounded-full overflow-hidden">
                                                    <div 
                                                        className={`h-full ${metric.current >= metric.benchmark ? 'bg-emerald' : 'bg-coral'}`}
                                                        style={{ width: `${Math.min(100, (metric.current / Math.max(metric.current, metric.benchmark)) * 100)}%` }}
                                                    ></div>
                                                </div>
                                                <div className="w-12 text-xs text-right">
                                                    {metric.current >= metric.benchmark ? '✓' : '⚠️'}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h4 className="font-medium mb-3">Liquidity & Efficiency</h4>
                                <div className="space-y-3">
                                    {[
                                        { label: 'Current Ratio', current: metrics.liquidity.current_ratio, benchmark: benchmarks.liquidity.current_ratio },
                                        { label: 'Asset Turnover', current: metrics.efficiency.asset_turnover, benchmark: benchmarks.efficiency.asset_turnover },
                                        { label: 'ROA', current: metrics.profitability.return_on_assets, benchmark: benchmarks.profitability.return_on_assets }
                                    ].map((metric) => (
                                        <div key={metric.label} className="space-y-1">
                                            <div className="flex justify-between text-sm">
                                                <span>{metric.label}</span>
                                                <span className={metric.current >= metric.benchmark ? 'text-emerald' : 'text-coral'}>
                                                    {metric.current.toFixed(2)} vs {metric.benchmark.toFixed(2)}
                                                </span>
                                            </div>
                                            <div className="flex gap-2 h-2">
                                                <div className="flex-1 bg-medium/40 rounded-full overflow-hidden">
                                                    <div 
                                                        className={`h-full ${metric.current >= metric.benchmark ? 'bg-emerald' : 'bg-coral'}`}
                                                        style={{ width: `${Math.min(100, (metric.current / Math.max(metric.current, metric.benchmark)) * 100)}%` }}
                                                    ></div>
                                                </div>
                                                <div className="w-12 text-xs text-right">
                                                    {metric.current >= metric.benchmark ? '✓' : '⚠️'}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}